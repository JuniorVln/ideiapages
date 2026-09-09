import type { Database } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient<Database>>;

/**
 * Autoridade de domínio — coleta e série histórica.
 *
 * Pedido do Victor (12/08/2026): acompanhar a autoridade subindo/descendo, não
 * uma foto isolada por apresentação. A fonte automática é o Open PageRank
 * (escala 0-10, API gratuita com chave). DR do Ahrefs e domínios referentes
 * entram como leitura manual (fonte `ahrefs_manual`) — escalas diferentes,
 * por isso a coluna `fonte` sempre acompanha o número.
 */

export const OPENPAGERANK_ENDPOINT = "https://openpagerank.com/api/v1.0/getPageRank";
export const FONTE_OPENPAGERANK = "openpagerank";

export type AutoridadeSyncResult = {
  data: string;
  dominios: string[];
  rowsUpserted: number;
  errors: string[];
};

type OprItem = {
  status_code?: number;
  error?: string;
  page_rank_integer?: number;
  page_rank_decimal?: number;
  rank?: string | number | null;
  domain?: string;
};

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

export async function fetchOpenPageRank(
  dominios: string[],
  apiKey: string,
): Promise<{ items: OprItem[]; error: string | null }> {
  if (dominios.length === 0) return { items: [], error: null };

  const qs = dominios.map((d) => `domains%5B%5D=${encodeURIComponent(d)}`).join("&");
  let res: Response;
  try {
    res = await fetch(`${OPENPAGERANK_ENDPOINT}?${qs}`, {
      headers: { "API-OPR": apiKey },
      cache: "no-store",
    });
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }

  if (!res.ok) {
    return { items: [], error: `Open PageRank HTTP ${String(res.status)}` };
  }

  const body = (await res.json()) as { response?: OprItem[] };
  return { items: body.response ?? [], error: null };
}

export async function runAutoridadeSync(args: {
  db: AdminClient;
  apiKey: string;
  dominios: string[];
  data?: string;
}): Promise<AutoridadeSyncResult> {
  const { db, apiKey } = args;
  const data = args.data ?? hojeSaoPaulo();
  const dominios = [...new Set(args.dominios.map(normalizeDominio).filter(Boolean))];
  const errors: string[] = [];
  let rowsUpserted = 0;

  const { items, error } = await fetchOpenPageRank(dominios, apiKey);
  if (error) errors.push(error);

  for (const item of items) {
    const dominio = normalizeDominio(item.domain ?? "");
    if (!dominio) continue;
    if (item.status_code != null && item.status_code !== 200) {
      errors.push(`${dominio}: ${item.error || `status ${String(item.status_code)}`}`);
      continue;
    }

    const rankPosicao = Number(item.rank);
    const { error: uErr } = await db.from("autoridade_dominio").upsert(
      {
        dominio,
        data,
        fonte: FONTE_OPENPAGERANK,
        rank_decimal: item.page_rank_decimal ?? null,
        rank_posicao: Number.isFinite(rankPosicao) && rankPosicao > 0 ? rankPosicao : null,
        detalhe: { page_rank_integer: item.page_rank_integer ?? null },
        coletado_em: new Date().toISOString(),
      },
      { onConflict: "dominio,data,fonte" },
    );

    if (uErr) errors.push(`upsert ${dominio}: ${uErr.message}`);
    else rowsUpserted += 1;
  }

  const semRetorno = dominios.filter(
    (d) => !items.some((i) => normalizeDominio(i.domain ?? "") === d),
  );
  for (const d of semRetorno) errors.push(`${d}: sem retorno da API`);

  return { data, dominios, rowsUpserted, errors };
}
