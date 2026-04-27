import { runIdeiaPagesResearchCli, isResearchCliAllowed } from "@/lib/admin/research-cli";
import { logAutomation } from "@/lib/monitoring/automation-log";
import { generatePageVariationsForPagina } from "@/lib/generation/generate-page-variations";
import type { Database, Json } from "@/lib/database.types";
import type { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient<Database>>;

function todaySpYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function usdToBrl(usd: number): number {
  const rate = Number(process.env.USD_TO_BRL ?? "5.5");
  if (!Number.isFinite(rate) || rate <= 0) return usd * 5.5;
  return usd * rate;
}

async function ensureAutomationDayRolls(db: AdminClient) {
  const today = todaySpYmd();
  const { data } = await db.from("automation_state").select("custo_dia_referencia").eq("id", 1).single();
  if (data && (data as { custo_dia_referencia: string | null }).custo_dia_referencia !== today) {
    await db
      .from("automation_state")
      .update({
        custo_dia_brl: 0,
        custo_dia_referencia: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  }
}

function parseProviders(): string[] {
  const raw = process.env.AUTOMATION_REWRITE_PROVIDERS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["claude", "gpt"];
}

const PIPELINE_ESTIMATE_BRL = () =>
  Math.max(1, Number(process.env.AUTOMATION_PIPELINE_ESTIMATE_BRL ?? "12"));

/**
 * Processa o item mais antigo com status `pendente` (um por invocação).
 */
export async function processNextAutoRewrite(db: AdminClient): Promise<{
  processed: boolean;
  queueId: string | null;
  status?: string;
  detail?: Json;
}> {
  const { data: st } = await db.from("automation_state").select("*").eq("id", 1).single();
  const state = st as
    | {
        automations_paused: boolean;
        custo_dia_brl: number;
        custo_max_dia_brl: number;
      }
    | null;

  if (state?.automations_paused) {
    return { processed: false, queueId: null, status: "paused", detail: { reason: "automation_state" } };
  }

  await ensureAutomationDayRolls(db);
  const { data: st2 } = await db.from("automation_state").select("custo_dia_brl, custo_max_dia_brl").eq("id", 1).single();
  const cost = st2 as { custo_dia_brl: number; custo_max_dia_brl: number } | null;
  if (cost && cost.custo_dia_brl + PIPELINE_ESTIMATE_BRL() > Number(cost.custo_max_dia_brl)) {
    await logAutomation(db, "auto-rewrite/skip-budget", {
      detalhe: { custo_dia: cost.custo_dia_brl, teto: cost.custo_max_dia_brl },
    });
    return { processed: false, queueId: null, status: "budget", detail: { custo: cost } };
  }

  const { data: next } = await db
    .from("auto_rewrite_queue")
    .select("id, pagina_id, termo_id, razao, status")
    .eq("status", "pendente")
    .order("prioridade", { ascending: false })
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) {
    return { processed: false, queueId: null, status: "empty" };
  }

  const qid = String(next.id);
  const paginaId = String(next.pagina_id);
  const termoId = next.termo_id != null ? String(next.termo_id) : null;

  await db
    .from("auto_rewrite_queue")
    .update({
      status: "em_processamento",
      iniciado_em: new Date().toISOString(),
    })
    .eq("id", qid);

  await logAutomation(db, "auto-rewrite/start", {
    pagina_id: paginaId,
    detalhe: { queue_id: qid, termo_id: termoId, razao: next.razao },
  });

  if (!termoId) {
    await db
      .from("auto_rewrite_queue")
      .update({ status: "falhou", erro_mensagem: "termo_id ausente", concluido_em: new Date().toISOString() })
      .eq("id", qid);
    return { processed: true, queueId: qid, status: "error", detail: { error: "no_termo" } };
  }

  if (!isResearchCliAllowed()) {
    await db
      .from("auto_rewrite_queue")
      .update({ status: "aguarda_cli", erro_mensagem: "ALLOW_ADMIN_RESEARCH_CLI / ambiente com research" })
      .eq("id", qid);
    await logAutomation(db, "auto-rewrite/aguarda-cli", { pagina_id: paginaId, detalhe: { queue_id: qid } });
    return { processed: true, queueId: qid, status: "aguarda_cli" };
  }

  const subBase = ["run", "ideiapages-research"] as const;
  let pipelineCostBrl = 0;

  try {
    const serp = await runIdeiaPagesResearchCli(
      [...subBase, "collect-serp", "--termo-id", termoId, "--top-n", "10", "--force", "--yes"],
      { timeoutMs: 900_000 },
    );
    await logAutomation(db, "auto-rewrite/collect-serp", {
      pagina_id: paginaId,
      resultado: { stderr: serp.stderr?.slice(0, 2000) ?? null },
    });

    const scrape = await runIdeiaPagesResearchCli(
      [
        ...subBase,
        "scrape-competitors",
        "--termo-id",
        termoId,
        "--top-n",
        "10",
        "--yes",
        "--no-cascade-serp",
      ],
      { timeoutMs: 900_000 },
    );
    await logAutomation(db, "auto-rewrite/scrape", {
      pagina_id: paginaId,
      resultado: { stderr: scrape.stderr?.slice(0, 2000) ?? null },
    });

    const gaps = await runIdeiaPagesResearchCli(
      [...subBase, "analyze-gaps", "--termo-id", termoId, "--force", "--yes"],
      { timeoutMs: 900_000 },
    );
    await logAutomation(db, "auto-rewrite/analyze-gaps", {
      pagina_id: paginaId,
      resultado: { stderr: gaps.stderr?.slice(0, 2000) ?? null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .from("auto_rewrite_queue")
      .update({ status: "falhou", erro_mensagem: msg.slice(0, 2000), concluido_em: new Date().toISOString() })
      .eq("id", qid);
    await logAutomation(db, "auto-rewrite/pipeline-err", { pagina_id: paginaId, detalhe: { error: msg } });
    return { processed: true, queueId: qid, status: "falhou", detail: { error: msg } };
  }

  const { results } = await generatePageVariationsForPagina(db, paginaId, {
    providers: parseProviders(),
    activate: true,
    replace_existing: false,
  });

  for (const r of results) {
    if (r.ok && typeof r.cost === "number") {
      pipelineCostBrl += usdToBrl(r.cost);
    }
  }

  const anyOk = results.some((r) => r.ok);
  if (!anyOk) {
    const errText = results.map((r) => `${r.provider}: ${r.error ?? "—"}`).join("; ") || "sem variação";
    await db
      .from("auto_rewrite_queue")
      .update({
        status: "falhou",
        erro_mensagem: errText.slice(0, 2000),
        custo_brl: pipelineCostBrl,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", qid);
    await logAutomation(db, "auto-rewrite/generate-fail", { pagina_id: paginaId, detalhe: { results } });
    return { processed: true, queueId: qid, status: "falhou", detail: { results } };
  }

  const { data: stBefore } = await db.from("automation_state").select("custo_dia_brl").eq("id", 1).single();
  const cur = (stBefore as { custo_dia_brl: number } | null)?.custo_dia_brl ?? 0;
  await db
    .from("automation_state")
    .update({
      custo_dia_brl: cur + pipelineCostBrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  await db
    .from("auto_rewrite_queue")
    .update({
      status: "concluido",
      custo_brl: pipelineCostBrl,
      concluido_em: new Date().toISOString(),
    })
    .eq("id", qid);

  await logAutomation(db, "auto-rewrite/ok", {
    pagina_id: paginaId,
    resultado: { results, custo_brl: pipelineCostBrl },
  });

  return { processed: true, queueId: qid, status: "concluido", detail: { results, custo_brl: pipelineCostBrl } };
}
