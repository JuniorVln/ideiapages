import Link from "next/link";
import { AdminPanelNavList } from "@/components/AdminPanelNavList";
import { AdminSignOut } from "@/components/AdminSignOut";

export function AdminPanelSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-b-0 border-r border-slate-800 bg-slate-900/95 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
      <div className="p-4 border-b border-slate-800 md:border-b-0">
        <Link href="/admin/hub" className="font-semibold text-white hover:text-blue-200 block">
          IDeiaPages
        </Link>
        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">SEO programático</p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 backdrop-blur-sm">
          <span
            className="relative flex h-2 w-2 shrink-0"
            style={{ width: 8, height: 8, minWidth: 8, minHeight: 8 }}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span
              className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
              style={{ width: 8, height: 8 }}
            />
          </span>
          <span className="text-[11px] font-medium text-emerald-200/90 uppercase tracking-tight">IA Ativa</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AdminPanelNavList />
      </div>
      <div className="shrink-0 p-3 border-t border-slate-800">
        <AdminSignOut />
      </div>
    </aside>
  );
}
