"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminPanelNavList } from "@/components/AdminPanelNavList";
import { AdminSignOut } from "@/components/AdminSignOut";

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-slate-200">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="text-slate-200">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Barra do admin em &lt; md: hamburguer, links à direita e, ao abrir, navegação em largura total
 * por baixo (empurra o &lt;main&gt;, sem overlay fixo).
 */
export function AdminPanelMobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden w-full">
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shrink-0"
            aria-expanded={open}
            aria-controls="admin-mobile-nav-panel"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link
            href={"/admin/hub" as Route}
            className="text-sm font-semibold text-white truncate hover:text-blue-200"
            onClick={close}
          >
            IDeiaPages
          </Link>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href={"/" as Route} className="text-xs text-slate-500 hover:text-slate-300" onClick={close}>
            Site público ↗
          </Link>
          <AdminSignOut />
        </div>
      </div>

      {open && (
        <div
          id="admin-mobile-nav-panel"
          className="border-t border-slate-800 w-full bg-slate-900/90"
        >
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">SEO programático</p>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 w-fit">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden />
              <span className="text-[11px] font-medium text-emerald-200/90">IA ativa</span>
            </div>
          </div>
          <div className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-slate-800/80">
            <AdminPanelNavList onNavigate={close} />
          </div>
          <div className="px-4 py-2 border-t border-slate-800/80">
            <Link
              href={"/admin/hub" as Route}
              onClick={close}
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Mapa do painel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
