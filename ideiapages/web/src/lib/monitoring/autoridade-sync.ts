import type { Database } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient<Database>>;

/**
 * Autoridade de domínio — coleta e série histórica.
 *
 * Pedido do Victor (12/08/2026): acompanhar a autoridade subindo/descendo, não
 * uma foto isolada por apresentação.
 *
 * Fonte automática: OpenPageRank (escala 0-10 derivada do grafo do Common Crawl),
 * que devolve score, posição global, domínios referentes e o histórico mensal
 * desde 2018 — dá pra popular a série inteira na primeira coleta.
 *
 * ⚠️ Domínio pequeno pode simplesmente NÃO estar no índice do Common Crawl
 * (`found: false`). Foi o caso do ideiamultichat.com.br em 09/09/2026: sem
 * dado nenhum, enquanto redeideia.com.br marcava 2,74 com 9 domínios
 * referentes. Nesse caso gravamos a linha com valor nulo (o buraco é o próprio
 * diagnóstico) e o número da nossa autoridade entra por leitura manual do
 * Ahrefs Webmaster Tools, com `fonte = 'ahrefs_manual'`.
 */

export const OPENPAGERANK_ENDPOINT = "https://openpagerank.keywordseverywhere.com/v1/domains/bulk";
export const FONTE_OPENPAGERANK = "openpagerank";

export type AutoridadeSyncResult = {
  data: string;
  dominios: string[];
  rowsUpserted: number;
  semDados: string[];
  errors: string[];
};

type OprHistoryPoint = { date?: string; open_page_rank?: number | null };

type OprResult = {
  domain?: string;
  found?: boolean;
  open_page_rank?: number | null;
  rank?: number | string | null;
  referring_domains?: number | null;
  history?: OprHistoryPoint[];
};

type AutoridadeRowInsert = Database["public"]["Tables"]["autoridade_dominio"]["Insert"];

/** Normaliza "https://www.dominio.com.br/" -> "dominio.com.br". */
export function normalizeDominio(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";
  const noScheme = raw.replace(/^[a-z]+:\/\//, "");
  const host = noScheme.split("/")[0] ?? "";
  return host.replace(/^www\./, "");
}

/** Lista de domínios a monitorar (env `AUTORIDADE_DOMINIOS`, separados por vírgula). */
export function dominiosMonitorados(env = process.env): string[] {
  const fromEnv = (env.AUTORIDADE_DOMINIOS ?? "")
    .split(",")
    .map(normalizeDominio)
    .filter(Boolean);
  if (fromEnv.length > 0) return [...new Set(fromEnv)];

  const site = normalizeDominio(env.NEXT_PUBLIC_SITE_URL ?? "");
  return site ? [site] : [];
}

/** Data de hoje (America/Sao_Paulo) no formato YYYY-MM-DD. */
export function hojeSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toInt(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export async function fetchOpenPageRank(
  dominios: string[],
  apiKey: string,
  includeHistory: boolean,
): Promise<{ results: OprResult[]; error: string | null }> {
  if (dominios.length === 0) return { results: [], error: null };

  let res: Response;
  try {
    res = await fetch(OPENPAGERANK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domains: dominios, include_history: includeHistory }),
      cache: "no-store",
    });
  } catch (e) {
    return { results: [], error: e instanceof Error ? e.message : String(e) };
  }

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    return { results: [], error: `OpenPageRank HTTP ${String(res.status)} ${detalhe.slice(0, 200)}` };
  }

  const body = (await res.json()) as { results?: OprResult[] };
  return { results: body.results ?? [], error: null };
}

export async function runAutoridadeSync(args: {
  db: AdminClient;
  apiKey: string;
  dominios: string[];
  data?: string;
  /** Grava também o histórico mensal devolvido pela API (roda uma vez, é idempotente). */
  incluirHistorico?: boolean;
}): Promise<AutoridadeSyncResult> {
  const { db, apiKey } = args;
  const incluirHistorico = args.incluirHistorico ?? true;
  const data = args.data ?? hojeSaoPaulo();
  const dominios = [...new Set(args.dominios.map(normalizeDominio).filter(Boolean))];
  const errors: string[] = [];
  const semDados: string[] = [];
  let rowsUpserted = 0;

  const { results, error } = await fetchOpenPageRank(dominios, apiKey, incluirHistorico);
  if (error) errors.push(error);

  const rows: AutoridadeRowInsert[] = [];

  for (const item of results) {
    const dominio = normalizeDominio(item.domain ?? "");
    if (!dominio) continue;

    const encontrado = item.found !== false && item.open_page_rank != null;
    if (!encontrado) semDados.push(dominio);

    rows.push({
      dominio,
      data,
      fonte: FONTE_OPENPAGERANK,
      rank_decimal: encontrado ? item.open_page_rank ?? null : null,
      rank_posicao: toInt(item.rank),
      dominios_referentes: toInt(item.referring_domains),
      detalhe: { found: encontrado },
      coletado_em: new Date().toISOString(),
    });

    if (incluirHistorico) {
      for (const h of item.history ?? []) {
        if (!h.date || h.open_page_rank == null) continue;
        if (h.date >= data) continue;
        rows.push({
          dominio,
          data: h.date,
          fonte: FONTE_OPENPAGERANK,
          rank_decimal: h.open_page_rank,
          detalhe: { historico: true },
        });
      }
    }
  }

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error: uErr } = await db
      .from("autoridade_dominio")
      .upsert(chunk, { onConflict: "dominio,data,fonte" });
    if (uErr) errors.push(`upsert: ${uErr.message}`);
    else rowsUpserted += chunk.length;
  }

  const semRetorno = dominios.filter(
    (d) => !results.some((i) => normalizeDominio(i.domain ?? "") === d),
  );
  for (const d of semRetorno) errors.push(`${d}: sem retorno da API`);

  return { data, dominios, rowsUpserted, semDados, errors };
}
