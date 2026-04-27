import Link from "next/link";
import type { Route } from "next";
import { AdminPanelMobileTopBar } from "@/components/AdminPanelMobileTopBar";
import { AdminPanelSidebar } from "@/components/AdminPanelSidebar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-x-hidden text-slate-200">
      {/* Decoração: sem mix-blend (evita ecrã branco / “lavagem” no Safari e compositing). */}
      <div
        className="pointer-events-none absolute top-[-10%] left-[-10%] z-0 rounded-full bg-brand-primary/20 blur-[120px]"
        style={{ width: "min(40vw, 28rem)", height: "min(40vw, 28rem)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] z-0 rounded-full bg-blue-500/10 blur-[100px]"
        style={{ width: "min(30vw, 24rem)", height: "min(30vw, 24rem)" }}
      />
      <div
        className="pointer-events-none absolute top-[30%] right-[10%] z-0 rounded-full bg-purple-500/10 blur-[90px]"
        style={{ width: "min(20vw, 20rem)", height: "min(20vw, 20rem)" }}
      />

      <AdminPanelSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md shrink-0 w-full shadow-sm sticky top-0 z-20">
          <div className="hidden md:flex px-6 py-3 items-center justify-between">
             <div className="flex items-center gap-4">
                {/* Opcional: Breadcrumb ou título da página atual aqui */}
             </div>
            <Link
              href={"/" as Route}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5"
            >
              Site público <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <AdminPanelMobileTopBar />
        </header>
        
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:px-8 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
