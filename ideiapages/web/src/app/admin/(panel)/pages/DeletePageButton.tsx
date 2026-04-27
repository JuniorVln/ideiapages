"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePageButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Excluir permanentemente a página "${slug}"?\n\nEsta ação não pode ser desfeita. Variações vinculadas também serão removidas.`,
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        alert(`Erro ao excluir: ${body.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      title="Excluir página permanentemente"
      className="inline-flex items-center rounded-md border border-red-800/60 bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-400 whitespace-nowrap hover:bg-red-900/50 hover:text-red-300 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Excluindo…" : "Excluir"}
    </button>
  );
}
