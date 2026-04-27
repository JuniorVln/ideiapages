"use client";

import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishPageBar({ slug, status }: { slug: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isPublic = status === "publicado";

  async function setStatus(next: "publicado" | "rascunho") {
    setLoading(true);
    const res = await fetch(`/api/admin/pages/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      window.alert((j as { error?: string }).error ?? "Erro ao atualizar status");
    }
  }

  if (isPublic) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90 flex flex-wrap items-center justify-between gap-3">
        <span>Esta página está publicada. O endereço público responde normalmente.</span>
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("rascunho")}
          className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {loading ? "…" : "Voltar a rascunho"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95 space-y-3">
      <p>
        <strong className="text-amber-50">A URL pública ainda devolve 404</strong> porque o status
        é <span className="font-mono">rascunho</span>. Só quem acessa o admin vê a página no painel;
        o site em <span className="font-mono">{PUBLIC_CONTENT_BASE_PATH}/{slug}</span> exige{" "}
        <strong>publicado</strong>.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => setStatus("publicado")}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Publicando…" : "Publicar agora"}
        </button>
      </div>
    </div>
  );
}
