"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROVIDERS = [
  { id: "claude", label: "Claude (Anthropic)", color: "amber" },
  { id: "gpt", label: "GPT (OpenAI)", color: "emerald" },
  { id: "gemini", label: "Gemini (Google)", color: "blue" },
];

export function GenerateForm({ paginaId, slug }: { paginaId: string; slug: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(["claude"]);
  const [activate, setActivate] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleProvider(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Selecione ao menos um provider.");
      return;
    }
    setLoading(true);
    setError(null);
    setLogs(["Iniciando geração..."]);

    const res = await fetch(`/api/admin/pages/${slug}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagina_id: paginaId,
        providers: selected,
        activate,
        replace_existing: replaceExisting,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao gerar variações.");
      setLoading(false);
      return;
    }

    const resultLogs: string[] = [];
    for (const r of data.results ?? []) {
      if (r.ok) {
        resultLogs.push(`✓ ${r.provider}: variação criada (${r.model ?? ""}) — $${r.cost?.toFixed(4) ?? "—"}`);
      } else {
        resultLogs.push(`✗ ${r.provider}: ${r.error}`);
      }
    }

    setLogs(resultLogs);
    setLoading(false);

    if (data.results?.some((r: { ok: boolean }) => r.ok)) {
      setTimeout(() => router.push(`/admin/pages/${slug}`), 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleção de providers */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Providers de IA</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProvider(p.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                  <span
                    className={`w-4 h-4 rounded border flex-shrink-0 ${
                      isSelected ? "bg-blue-500 border-blue-500" : "border-slate-600"
                    }`}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 16 16" fill="white" className="w-4 h-4">
                        <path d="M13.7 4.3l-7 7L3.3 8" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opções */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300">Opções</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
            className="accent-blue-500 w-4 h-4"
          />
          <div>
            <span className="text-sm text-slate-200">Ativar experimento A/B</span>
            <p className="text-xs text-slate-500">
              Cria entrada em `experimentos` e ativa as variações para split-test
            </p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="accent-amber-500 w-4 h-4"
          />
          <div>
            <span className="text-sm text-slate-200">Substituir variações existentes</span>
            <p className="text-xs text-slate-500">
              Desativa a variação atual do provider antes de criar a nova
            </p>
          </div>
        </label>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-mono text-slate-500 mb-2">Log de execução</p>
          {logs.map((l, i) => (
            <p
              key={i}
              className={`text-xs font-mono ${l.startsWith("✓") ? "text-emerald-400" : l.startsWith("✗") ? "text-red-400" : "text-slate-400"}`}
            >
              {l}
            </p>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || selected.length === 0}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm"
        >
          {loading
            ? `Gerando com ${selected.join(", ")}...`
            : `Gerar com ${selected.length} provider${selected.length > 1 ? "s" : ""}`}
        </button>
        <a
          href={`/admin/pages/${slug}`}
          className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
