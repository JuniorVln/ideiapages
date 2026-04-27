"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  keyword: string;
  /** Ação secundária: ignora cache de tendência e refaz a chamada. */
  forceDefault?: boolean;
};

export function AtualizarTrendsButton({ keyword, forceDefault = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [force, setForce] = useState(forceDefault);

  async function run() {
    setLoading(true);
    setErr(null);
    const res = await fetch("/api/admin/research/collect-trends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: keyword.trim(), force }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      stderr?: string;
      stdout?: string;
    };
    setLoading(false);
    if (res.ok && data.ok) {
      router.refresh();
      return;
    }
    setErr(
      [data.error, data.stderr].filter(Boolean).join("\n") || "Falha ao atualizar tendência.",
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={force} onChange={() => setForce(!force)} />
          Forçar (ignorar cache)
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading || !keyword.trim()}
          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium"
        >
          {loading ? "Atualizando (pode levar minutos)…" : "Atualizar tendência (Google Trends)"}
        </button>
      </div>
      <p className="text-xs text-slate-500 max-w-lg">
        Usa pytrends (BR): atualiza tendência, índice 0–100 e o volume estimado (proxy mensal) no termo.
        Em picos, o Google pode limitar; a CLI aguarda e retenta. Não dispara custo de LLM/Apify.
      </p>
      {err && (
        <p className="text-xs text-red-300 whitespace-pre-wrap break-words">{err}</p>
      )}
    </div>
  );
}
