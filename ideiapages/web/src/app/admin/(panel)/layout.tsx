import Link from "next/link";
import { AdminSignOut } from "@/components/AdminSignOut";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <Link href="/admin" className="font-semibold text-white hover:text-blue-200">
            IDeiaPages — Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/admin/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/admin/pages" className="text-slate-300 hover:text-white">
              Páginas
            </Link>
            <Link href="/admin/recommendations" className="text-slate-300 hover:text-white">
              Recomendações
            </Link>
            <Link href="/admin/costs" className="text-slate-300 hover:text-white">
              Custos
            </Link>
            <Link href="/admin/export" className="text-slate-300 hover:text-white">
              Export CSV
            </Link>
            <Link href="/" className="text-slate-500 hover:text-slate-300">
              Site público
            </Link>
            <AdminSignOut />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
