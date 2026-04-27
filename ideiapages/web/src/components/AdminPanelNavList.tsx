"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_NAV_SECTIONS, adminNavItemMatchesPath } from "@/lib/admin/admin-nav";

const STORAGE_KEY = "ideiapages.adminNav.expanded";

type Props = { onNavigate?: () => void };

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      style={{ width: 14, height: 14, flexShrink: 0 }}
      fill="none"
      aria-hidden
      className={`shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Simple icons component
function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    Dashboard: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    Pesquisa: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    "Palavras-chave": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
    Briefing: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    "Todas as páginas": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    "Gerar página": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
      </svg>
    ),
    "Comparativo de IAs": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Performance: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    Autocura: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
    Alertas: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    "Relatório A/B": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    "Contatos capturados": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    "Exportar CSV": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    Custos: (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "Mapa do painel": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    "Ver site público": (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    ),
  };

  return (
    icons[name] || (
      <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  );
}

function loadStored(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveStored(map: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function AdminPanelNavList({ onNavigate }: Props) {
  const pathname = usePathname();
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedById((prev) => {
      const stored = loadStored();
      const next = { ...stored, ...prev };
      for (const sec of ADMIN_NAV_SECTIONS) {
        if (!sec.id || !sec.title) continue;
        const active = sec.items.some((i) => adminNavItemMatchesPath(i.href, pathname));
        if (active) next[sec.id] = true;
      }
      return next;
    });
  }, [pathname]);

  const isExpanded = useCallback(
    (id: string) => expandedById[id] !== false,
    [expandedById],
  );

  const toggleSection = useCallback((id: string) => {
    setExpandedById((prev) => {
      const wasOpen = prev[id] !== false;
      const next = { ...prev, [id]: !wasOpen };
      saveStored(next);
      return next;
    });
  }, []);

  return (
    <nav className="p-3 space-y-4 text-sm">
      {ADMIN_NAV_SECTIONS.map((sec, secIdx) => {
        const key = sec.id ?? (sec.title || `sec-${secIdx}`);
        const collapsible = Boolean(sec.id && sec.title);

        return (
          <div key={key}>
            {sec.title ? (
              collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id!)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-white/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  aria-expanded={isExpanded(sec.id!)}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2 min-w-0">
                    <span className="truncate">{sec.title}</span>
                    {sec.sectionBadge != null && sec.sectionBadge > 0 ? (
                      <span className="rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-px min-w-[1.25rem] text-center shrink-0">
                        {sec.sectionBadge > 99 ? "99+" : sec.sectionBadge}
                      </span>
                    ) : null}
                  </span>
                  <Chevron expanded={isExpanded(sec.id!)} />
                </button>
              ) : (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] px-2.5 mb-2 flex items-center gap-2">
                  <span>{sec.title}</span>
                  {sec.sectionBadge != null && sec.sectionBadge > 0 ? (
                    <span className="rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-px min-w-[1.25rem] text-center">
                      {sec.sectionBadge > 99 ? "99+" : sec.sectionBadge}
                    </span>
                  ) : null}
                </p>
              )
            ) : null}
            {(!collapsible || isExpanded(sec.id!)) && (
              <ul className="space-y-1 mt-1">
                {sec.items.map((item) => {
                  const active = adminNavItemMatchesPath(item.href, pathname);
                  return (
                    <li key={`${item.href}-${item.label}`}>
                      <Link
                        href={item.href as Route}
                        onClick={onNavigate}
                        className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all duration-200 ${
                          active
                            ? "bg-blue-600/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                        title={item.hint}
                      >
                        <span className={`transition-colors ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                          <Icon name={item.label} />
                        </span>
                        <span className="font-medium truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
