"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeclareWinnerButton({ experimentId }: { experimentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    winner?: string;
    pValue?: number;
    lift?: number;
  } | null>(null);

  async function handleDeclare() {
    setLoading(true);
    setResult(null);
    const res = await fetch(`/api/admin/experiments/${experimentId}/declare-winner`, {
      method: "POST",
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    if (data.ok) {
      setTimeout(() => router.refresh(), 1000);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleDeclare}
        disabled={loading}
        className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm"
      >
        {loading ? "Analisando dados..." : "Declarar vencedor agora"}
      </button>

      {result && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.winner && (
            <p className="mt-1 text-xs opacity-80">
              Vencedor: <span className="font-mono">{result.winner}</span>
              {result.lift != null && ` · Lift: ${(result.lift * 100).toFixed(1)}%`}
              {result.pValue != null && ` · p-value: ${result.pValue.toFixed(4)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
