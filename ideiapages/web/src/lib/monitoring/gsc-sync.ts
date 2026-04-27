import { getGscClientForUser, getGscRedirectUri } from "@/lib/admin/google-gsc";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { getSiteUrl } from "@/lib/site-url";
import type { Database } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient<Database>>;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Consulta GSC considerada a principal da página (keyword do termo). */
export function matchesPrimaryQuery(query: string, keyword: string): boolean {
  const a = normalizeKey(query);
  const b = normalizeKey(keyword);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

/**
 * Sincroniza Search Analytics (GSC) para cada página publicada com termo, grava `gsc_metricas_diarias`.
 */
export async function runGscSync(opts: {
  db: AdminClient;
  gscOauthUserId: string;
  /** Propriedade GSC, ex. `https://exemplo.com/` ou `sc-domain:exemplo.com` */
  gscSiteUrl: string;
  /** Quantos dias para trás (incl. hoje / janela GSC) */
  daysBack: number;
}): Promise<{
  pages: number;
  rowsUpserted: number;
  errors: string[];
  dateStart: string;
  dateEnd: string;
}> {
  const { db, gscOauthUserId, gscSiteUrl, daysBack } = opts;
  const base = getSiteUrl().replace(/\/$/, "");
  const redirectUri = getGscRedirectUri(base);
  const sc = await getGscClientForUser(gscOauthUserId, redirectUri);

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  const endDate = ymd(end);
  const startDate = ymd(start);

  const { data: paginas, error: pErr } = await db
    .from("paginas")
    .select("id, slug, termo_id, termos:termo_id ( id, keyword )")
    .eq("status", "publicado")
    .not("termo_id", "is", null);

  if (pErr) {
    return {
      pages: 0,
      rowsUpserted: 0,
      errors: [pErr.message],
      dateStart: startDate,
      dateEnd: endDate,
    };
  }

  const list = (paginas ?? []) as {
    id: string;
    slug: string;
    termo_id: string;
    termos: { id: string; keyword: string } | null;
  }[];
  const errors: string[] = [];
  let rowsUpserted = 0;

  for (const p of list) {
    const keyword = p.termos?.keyword?.trim() ?? "";
    if (!keyword) continue;

    const path = `${PUBLIC_CONTENT_BASE_PATH.replace(/\/$/, "")}/${encodeURIComponent(p.slug)}`;
    const pageUrlNoSlash = `${base}${path}`;
    const pageUrlSlash = `${pageUrlNoSlash}/`;

    let gotAny = false;
    for (const pageExpr of [pageUrlNoSlash, pageUrlSlash]) {
      let startRow = 0;
      const pageSize = 25000;
      const batch: {
        pagina_id: string;
        data: string;
        query: string;
        impressoes: number;
        cliques: number;
        posicao_media: number;
      }[] = [];

      for (;;) {
        const { data, status } = await sc.searchanalytics.query({
          siteUrl: gscSiteUrl,
          requestBody: {
            startDate,
            endDate,
            dimensions: ["date", "query"],
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: "page",
                    operator: "equals",
                    expression: pageExpr,
                  },
                ],
              },
            ],
            rowLimit: pageSize,
            startRow,
            dataState: "all",
            searchType: "web",
          },
        });

        if (status !== 200) {
          errors.push(`GSC ${p.slug}: HTTP ${String(status)}`);
          break;
        }

        for (const r of data.rows ?? []) {
          const dKey = r.keys?.[0];
          const qKey = r.keys?.[1];
          if (!dKey || qKey == null) continue;
          const qStr = String(qKey);
          if (!matchesPrimaryQuery(qStr, keyword)) continue;
          batch.push({
            pagina_id: p.id,
            data: dKey,
            query: qStr,
            impressoes: r.impressions ?? 0,
            cliques: r.clicks ?? 0,
            posicao_media: r.position ?? 0,
          });
        }
        const chunk = data.rows ?? [];
        if (chunk.length < pageSize) break;
        startRow += pageSize;
      }

      if (batch.length > 0) {
        gotAny = true;
        for (const row of batch) {
          const { error: uErr } = await db.from("gsc_metricas_diarias").upsert(
            {
              ...row,
              atualizado_em: new Date().toISOString(),
            } as never,
            { onConflict: "pagina_id,data,query" },
          );
          if (uErr) {
            errors.push(`upsert ${p.slug}: ${uErr.message}`);
          } else {
            rowsUpserted += 1;
          }
        }
        break;
      }
    }

    if (!gotAny) {
      // Sem dados para keyword alinhada — não é erro fatal
    }
  }

  return {
    pages: list.length,
    rowsUpserted,
    errors,
    dateStart: startDate,
    dateEnd: endDate,
  };
}
