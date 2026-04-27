"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";

type Entry = { href: string; label: string; section?: string; extra?: string };

export function HubSearch({
  staticEntries,
  pages,
  experiments,
}: {
  staticEntries: Entry[];
  pages: Array<{
    href: string;
    label: string;
    slug: string;
    status: string;
    experimento: string | null;
  }>;
  experiments: Array<{ href: string; label: string; status: string }>;
}) {
  const [q, setQ] = useState("");

  const all = useMemo(() => {
    const fromPages: Entry[] = pages.map((p) => ({
      href: p.href,
      label: p.label,
      section: "Página",
      extra: `${p.slug} · ${p.status}${p.experimento ? ` · ${p.experimento}` : ""}`,
    }));
    const fromExp: Entry[] = experiments.map((e) => ({
      href: e.href,
      label: e.label,
      section: "Experimento",
      extra: e.status,
    }));
    return [...staticEntries, ...fromPages, ...fromExp];
  }, [staticEntries, pages, experiments]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all.slice(0, 12);
    return all
      .filter(
        (e) =>
          e.label.toLowerCase().includes(t) ||
          e.href.toLowerCase().includes(t) ||
          (e.section?.toLowerCase().includes(t) ?? false) ||
          (e.extra?.toLowerCase().includes(t) ?? false),
      )
      .slice(0, 24);
  }, [all, q]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
      <label className="block text-xs font-medium text-slate-400">Busca rápida</label>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Digite nome, slug, rota ou status…"
        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
        autoComplete="off"
      />
      <ul className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.map((e) => (
          <li key={`${e.href}-${e.label}`}>
            <Link
              href={e.href as Route}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 rounded-md px-2 py-1.5 hover:bg-slate-800 text-sm"
            >
              <span className="text-blue-400">{e.label}</span>
              <span className="text-[10px] text-slate-500 font-mono truncate sm:max-w-[45%]">
                {e.section}
                {e.extra ? ` · ${e.extra}` : ""}
              </span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-slate-500 text-sm py-4 text-center">Nenhum resultado.</li>
        )}
      </ul>
    </div>
  );
}
