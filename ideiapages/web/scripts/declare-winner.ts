/**
 * Analisa experimentos ativos: conversão por braço (leads vs sessões em metricas_diarias).
 *
 * Uso:
 *   pnpm declare-winner -- [--apply] [--min-per-arm 30]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Database } from "../src/lib/database.types";
import { chiSquareHomogeneity, isChiSquareSignificant } from "../src/lib/experiments/chi-square";

const ENV_PATH = resolve(__dirname, "../../.env");
try {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch {
  /* */
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatórios.");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function parseArgs() {
  const argv = process.argv.slice(2);
  let apply = false;
  let minPerArm = 30;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--apply") apply = true;
    if (argv[i] === "--min-per-arm" && argv[i + 1]) {
      minPerArm = Number(argv[++i]);
    }
  }
  return { apply, minPerArm };
}

async function main() {
  const { apply, minPerArm } = parseArgs();

  const { data: exps, error: eErr } = await supabase
    .from("experimentos")
    .select("id, pagina_id, status")
    .eq("status", "ativo");

  if (eErr || !exps?.length) {
    console.log("Nenhum experimento ativo.");
    return;
  }

  for (const exp of exps) {
    const { data: vars, error: vErr } = await supabase
      .from("variacoes")
      .select("id, nome, provider, ativa")
      .eq("pagina_id", exp.pagina_id)
      .eq("ativa", true);

    if (vErr || !vars?.length) continue;

    const ids = vars.map((v) => v.id);

    const { data: metrics } = await supabase
      .from("metricas_diarias")
      .select("variacao_id, sessoes")
      .eq("pagina_id", exp.pagina_id)
      .in("variacao_id", ids);

    const sessoes = new Map<string, number>();
    for (const v of vars) sessoes.set(v.id, 0);
    for (const row of metrics ?? []) {
      if (!row.variacao_id) continue;
      sessoes.set(
        row.variacao_id,
        (sessoes.get(row.variacao_id) ?? 0) + (row.sessoes ?? 0),
      );
    }

    const leadCounts = new Map<string, number>();
    for (const v of vars) leadCounts.set(v.id, 0);

    const { data: leadRows } = await supabase
      .from("leads")
      .select("variacao_id")
      .eq("pagina_id", exp.pagina_id);

    for (const lr of leadRows ?? []) {
      if (lr.variacao_id) {
        leadCounts.set(
          lr.variacao_id,
          (leadCounts.get(lr.variacao_id) ?? 0) + 1,
        );
      }
    }

    const order = [...vars].sort((a, b) => a.nome.localeCompare(b.nome));
    const success = order.map((v) => leadCounts.get(v.id) ?? 0);
    const totals = order.map((v, i) =>
      Math.max(sessoes.get(v.id) ?? 0, success[i]!, 1),
    );

    const minSess = Math.min(...order.map((v) => sessoes.get(v.id) ?? 0));
    if (minSess < minPerArm) {
      console.log(
        `\nExperimento ${exp.id} (página ${exp.pagina_id}): amostra insuficiente (mín ${minPerArm} sessões/braço por métricas; menor=${minSess}).`,
      );
      continue;
    }

    const fail = totals.map((t, i) => Math.max(t - success[i]!, 0));
    const { chiSq, df } = chiSquareHomogeneity(success, fail);
    const significant = df > 0 && isChiSquareSignificant(chiSq, df);

    let bestIdx = 0;
    let bestRate = -1;
    for (let i = 0; i < order.length; i++) {
      const rate = success[i]! / totals[i]!;
      if (rate > bestRate) {
        bestRate = rate;
        bestIdx = i;
      }
    }

    const winner = order[bestIdx]!;
    const line = order
      .map((v, i) => `${v.provider}:${success[i]}/${totals[i]}`)
      .join(" | ");

    console.log(`\n── Experimento ${exp.id} ──`);
    console.log("Braços:", line);
    console.log(`χ²=${chiSq.toFixed(3)} df=${df} significativo(α≈0,05)? ${significant}`);
    console.log(`Melhor taxa: ${winner.provider} (${winner.nome})`);

    if (apply && significant) {
      const now = new Date().toISOString();
      await supabase
        .from("experimentos")
        .update({
          status: "vencedor_declarado",
          encerrado_em: now,
          vencedor_variacao_id: winner.id,
          lift: bestRate,
          amostra_total: totals.reduce((a, b) => a + b, 0),
          notas: `chiSq=${chiSq.toFixed(4)} df=${df}`,
        })
        .eq("id", exp.id);

      await supabase
        .from("paginas")
        .update({
          status_experimento: "vencedor_declarado",
          variacao_vencedora_id: winner.id,
        })
        .eq("id", exp.pagina_id);

      console.log("✅  Vencedor aplicado no banco.");
    } else if (apply && !significant) {
      console.log("⚠️  --apply ignorado: resultado não significativo.");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
