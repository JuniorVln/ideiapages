import type { Database } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";
import { matchesPrimaryQuery, normalizeKey } from "@/lib/monitoring/gsc-sync";

type AdminClient = ReturnType<typeof createClient<Database>>;

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Regras (spec): posição média móvel 14d piora ≥5 vs 14d anterior; ou cliques últimos 7d < 60% do esperado pelo baseline 30d.
 */
export async function runDetectRankingDrop(db: AdminClient): Promise<{
  candidates: number;
  skipped: string[];
}> {
  const { data: state } = await db.from("automation_state").select("*").eq("id", 1).single();
  if (state?.automations_paused) {
    return { candidates: 0, skipped: ["automation_paused"] };
  }

  const { data: paginas } = await db
    .from("paginas")
    .select("id, termo_id, slug, termos:termo_id ( keyword )")
    .eq("status", "publicado")
    .not("termo_id", "is", null);

  const rows = (paginas ?? []) as {
    id: string;
    termo_id: string;
    slug: string;
    termos: { keyword: string } | null;
  }[];

  const skipped: string[] = [];
  let candidates = 0;
  const now = new Date();

  for (const p of rows) {
    const keyword = p.termos?.keyword?.trim() ?? "";
    if (!keyword) continue;

    const { data: existing } = await db
      .from("auto_rewrite_queue")
      .select("id")
      .eq("pagina_id", p.id)
      .in("status", ["pendente", "em_processamento", "aguarda_cli"])
      .maybeSingle();
    if (existing) {
      continue;
    }

    const { data: recentDone } = await db
      .from("auto_rewrite_queue")
      .select("concluido_em")
      .eq("pagina_id", p.id)
      .eq("status", "concluido")
      .order("concluido_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDone?.concluido_em) {
      const t = new Date(recentDone.concluido_em);
      const days = (now.getTime() - t.getTime()) / (86400 * 1000);
      if (days < 30) {
        continue;
      }
    }

    const since = new Date(now);
    since.setDate(since.getDate() - 60);
    const { data: metrics } = await db
      .from("gsc_metricas_diarias")
      .select("data, query, posicao_media, cliques")
      .eq("pagina_id", p.id)
      .gte("data", dayKey(since));

    const m = (metrics ?? []) as {
      data: string;
      query: string;
      posicao_media: number;
      cliques: number;
    }[];

    const primary = m.filter((x) => matchesPrimaryQuery(x.query, keyword));
    const byNorm = m.filter((x) => normalizeKey(x.query) === normalizeKey(keyword));
    const series = byNorm.length > 0 ? byNorm : primary;
    if (series.length < 8) {
      skipped.push(`${p.slug}:dados_insuficientes`);
      continue;
    }

    const posByDay = new Map<string, number>();
    const clkByDay = new Map<string, number>();
    for (const r of series) {
      posByDay.set(r.data, Number(r.posicao_media));
      clkByDay.set(r.data, (clkByDay.get(r.data) ?? 0) + Number(r.cliques));
    }

    const recentPos: number[] = [];
    const prevPos: number[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      if (posByDay.has(k)) recentPos.push(posByDay.get(k)!);
    }
    for (let i = 14; i < 28; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      if (posByDay.has(k)) prevPos.push(posByDay.get(k)!);
    }

    const recent7clk = [...Array(7)].reduce((s, _, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return s + (clkByDay.get(dayKey(d)) ?? 0);
    }, 0);

    const base30clk = [...Array(30)].reduce((s, _, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return s + (clkByDay.get(dayKey(d)) ?? 0);
    }, 0);
    const expected7 = (base30clk / 30) * 7;

    let reason: string | null = null;
    if (recentPos.length >= 4 && prevPos.length >= 4) {
      const a0 = avg(recentPos);
      const a1 = avg(prevPos);
      if (a0 - a1 >= 5) {
        reason = `queda_posicao: media_14d=${a0.toFixed(2)} vs_anterior_14d=${a1.toFixed(2)}`;
      }
    }
    if (!reason && expected7 >= 3 && recent7clk < expected7 * 0.4) {
      reason = `queda_cliques: 7d=${recent7clk} vs_esperado_7d≈${expected7.toFixed(1)}`;
    }

    if (!reason) continue;

    const { data: snap } = await db
      .from("serp_snapshots")
      .select("id")
      .eq("termo_id", p.termo_id)
      .order("capturado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: insErr } = await db.from("auto_rewrite_queue").insert({
      pagina_id: p.id,
      termo_id: p.termo_id,
      status: "pendente",
      prioridade: 7,
      razao: reason,
      detalhe_jsonb: {
        keyword,
        regra: "detect_v1",
      },
      snapshot_serp_id: snap?.id ?? null,
    });
    if (insErr) {
      if (insErr.message.includes("idx_auto_rewrite_um_ativo")) {
        continue;
      }
      skipped.push(`${p.slug}:${insErr.message}`);
      continue;
    }
    candidates += 1;
  }

  return { candidates, skipped };
}
