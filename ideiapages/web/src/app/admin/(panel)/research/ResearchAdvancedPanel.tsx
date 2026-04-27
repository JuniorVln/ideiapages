"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogState = { title: string; out: string; err: string | null };

async function postJson(
  url: string,
  body: Record<string, unknown>,
  setLog: (s: LogState) => void,
  title: string,
  onSuccess?: () => void,
): Promise<void> {
  setLog({ title, out: "Executando…", err: null });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    stdout?: string;
    stderr?: string;
  };
  const out = [data.stdout, data.stderr].filter(Boolean).join("\n---\n") || "(sem saída)";
  if (res.ok && data.ok) {
    setLog({ title, out, err: null });
    onSuccess?.();
    return;
  }
  setLog({
    title,
    out: [data.error, data.stderr, data.stdout].filter(Boolean).join("\n") || "Erro",
    err: "Falha",
  });
}

const card = "rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3";

export function ResearchAdvancedPanel({ allowRemote }: { allowRemote: boolean }) {
  const router = useRouter();
  const [log, setLog] = useState<LogState | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(
    label: string,
    url: string,
    body: Record<string, unknown>,
  ) {
    setLoading(label);
    setLog(null);
    await postJson(url, body, setLog, label, () => router.refresh());
    setLoading(null);
  }

  if (!allowRemote) {
    return (
      <p className="text-amber-200/90 text-sm rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
        O painel não pode disparar a CLI neste ambiente. Use os comandos em{" "}
        <code className="text-amber-100">ideiapages/research</code> (README) com o mesmo{" "}
        <code className="text-amber-100">.env</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-sm text-slate-500">
        Só se precisar de um passo isolado (o fluxo normal é o botão <strong className="text-slate-400">Processar tudo</strong> acima). Confira resultados em{" "}
        <Link href="/admin/research/terms" className="text-blue-400 hover:underline">
          Palavras-chave
        </Link>
        .
      </p>

      <section className={card}>
        <h2 className="text-white font-semibold">1. Classificar termos (coletado → analisado)</h2>
        <p className="text-xs text-slate-500">Claude classifica pendentes; usa lotes para limitar custo.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-500">
            Batch
            <input
              type="number"
              id="classify-batch"
              defaultValue={40}
              min={1}
              max={200}
              className="block mt-0.5 w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Máx. lotes
            <input
              type="number"
              id="classify-maxb"
              defaultValue={5}
              min={1}
              max={100}
              className="block mt-0.5 w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="classify-dry" />
            Dry-run
          </label>
          <label className="flex items-center gap-1.5 text-xs text-amber-300/90">
            <input type="checkbox" id="classify-re" />
            Reclassificar
          </label>
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => {
            const batch = Number(
              (document.getElementById("classify-batch") as HTMLInputElement)?.value ?? 40,
            );
            const maxBatches = Number(
              (document.getElementById("classify-maxb") as HTMLInputElement)?.value ?? 5,
            );
            const dryRun = (document.getElementById("classify-dry") as HTMLInputElement)?.checked;
            const reclassify = (document.getElementById("classify-re") as HTMLInputElement)
              ?.checked;
            void run("Classificar", "/api/admin/research/classify-terms", {
              batchSize: batch,
              maxBatches: maxBatches,
              dryRun,
              reclassify,
            });
          }}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading === "Classificar" ? "Executando…" : "Executar classificação"}
        </button>
      </section>

      <section className={card}>
        <h2 className="text-white font-semibold">2. Priorizar (analisado → priorizado)</h2>
        <p className="text-xs text-slate-500">
          Entre termos com score ≥ mínimo, ordena por índice{" "}
          <code className="text-slate-400">score×(1+ln(1+volume))</code> (volume do Supabase). Tendência
          decrescente fica de fora, salvo &quot;Manter decrescente&quot;.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-500">
            Score mín.
            <input
              type="number"
              id="pri-min"
              defaultValue={7}
              min={1}
              max={10}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Limite
            <input
              type="number"
              id="pri-limit"
              defaultValue={50}
              min={1}
              max={500}
              className="block mt-0.5 w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="pri-dry" />
            Dry-run
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="pri-keep" />
            Manter decrescente
          </label>
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => {
            const minScore = Number((document.getElementById("pri-min") as HTMLInputElement)?.value ?? 7);
            const limit = Number((document.getElementById("pri-limit") as HTMLInputElement)?.value ?? 50);
            const dryRun = (document.getElementById("pri-dry") as HTMLInputElement)?.checked;
            const keepDecrescente = (document.getElementById("pri-keep") as HTMLInputElement)?.checked;
            void run("Priorizar", "/api/admin/research/prioritize-terms", {
              minScore,
              limit,
              dryRun,
              keepDecrescente,
            });
          }}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading === "Priorizar" ? "Executando…" : "Executar priorização"}
        </button>
      </section>

      <section className={card}>
        <h2 className="text-white font-semibold">3. Coletar SERP (priorizados → snapshot SERP)</h2>
        <p className="text-xs text-slate-500">Lote Apify. Pode marcar &quot;incluir analisado&quot; se ainda não priorizou tudo.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-500">
            Limite termos
            <input
              type="number"
              id="serp-limit"
              defaultValue={20}
              min={1}
              max={50}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Top N
            <input
              type="number"
              id="serp-top"
              defaultValue={10}
              min={1}
              max={50}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="serp-a" />
            Incluir analisado
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="serp-dry" />
            Dry-run
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="serp-force" />
            Forçar (ignorar cache SERP)
          </label>
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => {
            const limit = Number((document.getElementById("serp-limit") as HTMLInputElement)?.value ?? 20);
            const topN = Number((document.getElementById("serp-top") as HTMLInputElement)?.value ?? 10);
            const includeAnalisado = (document.getElementById("serp-a") as HTMLInputElement)?.checked;
            const dryRun = (document.getElementById("serp-dry") as HTMLInputElement)?.checked;
            const force = (document.getElementById("serp-force") as HTMLInputElement)?.checked;
            void run("SERP", "/api/admin/research/collect-serp", {
              limit,
              topN,
              includeAnalisado,
              dryRun,
              force,
            });
          }}
          className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading === "SERP" ? "Executando…" : "Executar coleta SERP (lote)"}
        </button>
      </section>

      <section className={card}>
        <h2 className="text-white font-semibold">4. Raspagem de concorrentes (SERP ok → scraped)</h2>
        <p className="text-xs text-slate-500">Firecrawl em lote para termos com status adequado.</p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-500">
            Limite termos
            <input
              type="number"
              id="sc-limit"
              defaultValue={15}
              min={1}
              max={100}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Top URLs / termo
            <input
              type="number"
              id="sc-top"
              defaultValue={10}
              min={1}
              max={10}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="sc-dry" />
            Dry-run
          </label>
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => {
            const limit = Number((document.getElementById("sc-limit") as HTMLInputElement)?.value ?? 15);
            const topN = Number((document.getElementById("sc-top") as HTMLInputElement)?.value ?? 10);
            const dryRun = (document.getElementById("sc-dry") as HTMLInputElement)?.checked;
            void run("Scrape", "/api/admin/research/scrape-competitors", { limit, topN, dryRun });
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading === "Scrape" ? "Executando…" : "Executar raspagem (lote)"}
        </button>
      </section>

      <section className={`${card} border-amber-900/50`}>
        <h2 className="text-white font-semibold">5. Analisar gaps / gerar roteiro (scraped → briefing)</h2>
        <p className="text-xs text-amber-200/80">
          Etapa <strong>mais cara</strong> (Claude Sonnet, muito contexto). Use limite baixo; dry-run
          recomendado antes.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-500">
            Limite termos
            <input
              type="number"
              id="gaps-limit"
              defaultValue={5}
              min={1}
              max={100}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Top N concor.
            <input
              type="number"
              id="gaps-top"
              defaultValue={10}
              min={1}
              max={10}
              className="block mt-0.5 w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" id="gaps-dry" />
            Dry-run
          </label>
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => {
            const limit = Number((document.getElementById("gaps-limit") as HTMLInputElement)?.value ?? 5);
            const topN = Number((document.getElementById("gaps-top") as HTMLInputElement)?.value ?? 10);
            const dryRun = (document.getElementById("gaps-dry") as HTMLInputElement)?.checked;
            void run("Gaps", "/api/admin/research/analyze-gaps", { limit, topN, dryRun });
          }}
          className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          {loading === "Gaps" ? "Executando…" : "Executar análise de gaps (lote)"}
        </button>
      </section>

      {log && (
        <div>
          <p className="text-xs text-slate-500 mb-1">{log.title}</p>
          {log.err && <p className="text-xs text-red-300 mb-1">Saída de erro (HTTP 5xx ou exit≠0)</p>}
          <pre className="text-xs text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg p-4 max-h-96 overflow-auto whitespace-pre-wrap">
            {log.out}
          </pre>
        </div>
      )}
    </div>
  );
}
