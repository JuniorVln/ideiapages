"use client";

import { useState } from "react";

type QueueRow = {
  id: string;
  status: string;
  razao: string;
  prioridade: number;
  criado_em: string;
  paginas: { slug: string; titulo: string } | null;
};

type AutomationState = {
  automations_paused: boolean;
  pause_reason: string | null;
  custo_dia_brl: number;
  custo_max_dia_brl: number;
  custo_dia_referencia: string | null;
};

const card =
  "rounded-xl border border-white/10 bg-slate-900/50 p-5 shadow-lg backdrop-blur";

export function AutocuraClient({
  initialState,
  initialQueue,
  gscEnvOk,
  gscEnvMessage,
  cronHint,
}: {
  initialState: AutomationState | null;
  initialQueue: QueueRow[];
  gscEnvOk: boolean;
  gscEnvMessage: string;
  cronHint: string;
}) {
  const [state, setState] = useState<AutomationState | null>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  async function refreshState() {
    const res = await fetch("/api/admin/automation/state");
    const j = (await res.json()) as { state?: AutomationState; error?: string };
    if (res.ok && j.state) setState(j.state);
  }

  async function setPaused(paused: boolean) {
    setLoading("pause");
    setErr(null);
    setMessage(null);
    const res = await fetch("/api/admin/automation/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        automations_paused: paused,
        pause_reason: paused ? pauseReason || "Pausa manual" : null,
      }),
    });
    const j = (await res.json()) as { state?: AutomationState; error?: string };
    setLoading(null);
    if (res.ok && j.state) {
      setState(j.state);
      setMessage(paused ? "Automações pausadas." : "Automações reativadas.");
    } else {
      setErr(j.error ?? "Falha ao atualizar.");
    }
  }

  async function runStep(step: "gsc_sync" | "detect" | "auto_rewrite" | "all") {
    setLoading(step);
    setErr(null);
    setMessage(null);
    const res = await fetch("/api/admin/monitoring/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string;[k: string]: unknown };
    setLoading(null);
    if (res.ok) {
      const summary = JSON.stringify(j);
      setMessage(
        `Concluído: ${step} — ${summary.length > 600 ? summary.slice(0, 600) + "…" : summary}`,
      );
      void refreshState();
    } else {
      setErr(j.error ?? "Falha.");
    }
  }

  return (
    <div className="space-y-8 text-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Autocura</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Monitorização GSC, deteção de quedas, fila de rewrites e orçamento diário. Os crons em
          produção usam <code className="text-cyan-300/90">CRON_SECRET</code> e as rotas em{" "}
          <code className="text-cyan-300/90">/api/cron/*</code>.
        </p>
      </div>

      {!gscEnvOk && gscEnvMessage && (
        <div
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm"
          role="status"
        >
          {gscEnvMessage}
        </div>
      )}
      {cronHint && (
        <div
          className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sky-100/90 text-sm"
          role="status"
        >
          {cronHint}
        </div>
      )}

      <section className={card}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Estado & orçamento</h2>
        {state ? (
          <ul className="text-sm space-y-2 text-slate-300">
            <li>
              Automações:{" "}
              <span className={state.automations_paused ? "text-amber-400" : "text-emerald-400"}>
                {state.automations_paused ? "pausadas" : "ativas"}
              </span>
            </li>
            <li>
              Custo hoje: R$ {Number(state.custo_dia_brl).toFixed(2)} / teto R${" "}
              {Number(state.custo_max_dia_brl).toFixed(2)}
            </li>
            {state.custo_dia_referencia && (
              <li className="text-slate-500">Ref. dia: {state.custo_dia_referencia}</li>
            )}
            {state.automations_paused && state.pause_reason && (
              <li className="text-amber-200/80">Motivo: {state.pause_reason}</li>
            )}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">Sem dados (migração 0016 aplicada?)</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Motivo se pausar (opcional)"
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            className="flex-1 min-w-[12rem] rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!!loading}
            onClick={() => void setPaused(true)}
            className="px-3 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading === "pause" ? "…" : "Pausar"}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => void setPaused(false)}
            className="px-3 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
          >
            Reativar
          </button>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Executar agora (manual)</h2>
        <p className="text-xs text-slate-500 mb-3">
          Requer o mesmo ambiente que os crons: OAuth GSC guardado para{" "}
          <code className="text-cyan-300/90">GSC_SYNC_USER_ID</code>,{" "}
          <code className="text-cyan-300/90">GSC_SITE_URL</code> e, para o rewrite completo, módulo Python em
          máquina com <code className="text-cyan-300/90">ALLOW_ADMIN_RESEARCH_CLI=1</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          {(["gsc_sync", "detect", "auto_rewrite", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={!!loading}
              onClick={() => void runStep(s)}
              className="px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
            >
              {loading === s ? "…" : s}
            </button>
          ))}
        </div>
        {message && (
          <pre className="mt-3 text-xs text-slate-400 whitespace-pre-wrap break-words max-h-48 overflow-auto">
            {message}
          </pre>
        )}
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      </section>

      <section className={card}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Fila de rewrites</h2>
        {initialQueue.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum item na fila.</p>
        ) : (
          <ul className="space-y-3">
            {initialQueue.map((q) => (
              <li
                key={q.id}
                className="border border-white/5 rounded-lg p-3 text-sm text-slate-300 space-y-1"
              >
                <div className="font-medium text-white">
                  {q.paginas?.slug ?? "—"} — {q.status}
                </div>
                <div className="text-slate-500 text-xs">{q.razao}</div>
                <div className="text-slate-500 text-xs">
                  pri {q.prioridade} · {q.criado_em}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
