"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatThrown } from "@/lib/format-thrown";

type Props = {
  termoId: string;
  allowRemote: boolean;
  /** Barra ao lado do título vs bloco largo (estado vazio) */
  variant?: "inline" | "block";
};

export function GerarBriefingButton({ termoId, allowRemote, variant = "block" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [force, setForce] = useState(false);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/research/analyze-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo_id: termoId, topN: 10, force }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stderr?: string;
        stdout?: string;
      };
      if (res.ok && data.ok) {
        router.refresh();
        return;
      }
      setErr(
        [data.error, data.stderr].filter(Boolean).join("\n") || "Falha ao gerar briefing (analyze-gaps).",
      );
    } catch (e) {
      setErr(formatThrown(e));
    } finally {
      setLoading(false);
    }
  }

  if (!allowRemote) {
    return (
      <p
        className={
          variant === "inline"
            ? "text-xs text-slate-500 max-w-md text-right"
            : "text-sm text-slate-500 text-center max-w-lg mx-auto"
        }
      >
        Geração pelo painel só em <code className="text-slate-400">development</code> ou com{" "}
        <code className="text-slate-400">ALLOW_ADMIN_RESEARCH_CLI=1</code>. Alternativas: CLI{" "}
        <code className="text-slate-400">ideiapages-research analyze-gaps --termo-id …</code> na pasta{" "}
        <code className="text-slate-400">ideiapages/research</code>, ou o passo{" "}
        <strong className="text-slate-400">Gaps</strong> em{" "}
        <Link href="/admin/research#avancado" className="text-blue-400 hover:underline">
          Pesquisa → Avançado
        </Link>
        .
      </p>
    );
  }

  const forceLabel =
    variant === "inline" ? (
      <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
        <input type="checkbox" checked={force} onChange={() => setForce(!force)} />
        Forçar
      </label>
    ) : (
      <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
        <input type="checkbox" checked={force} onChange={() => setForce(!force)} />
        Forçar (ignorar cache de briefing recente)
      </label>
    );

  const buttonClass =
    variant === "inline"
      ? "shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium"
      : "px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium";

  return (
    <div className={variant === "block" ? "space-y-2 flex flex-col items-center" : "flex flex-wrap items-center justify-end gap-2"}>
      <div
        className={
          variant === "block"
            ? "flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3"
            : "flex flex-wrap items-center gap-2"
        }
      >
        {forceLabel}
        <button type="button" onClick={run} disabled={loading} className={buttonClass}>
          {loading ? "A gerar briefing (Claude)…" : "Gerar briefing"}
        </button>
      </div>
      {err && (
        <p className="text-xs text-red-300 whitespace-pre-wrap break-words max-w-prose w-full text-left">
          {err}
        </p>
      )}
    </div>
  );
}
