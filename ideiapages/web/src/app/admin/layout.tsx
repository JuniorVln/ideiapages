import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <span className="font-semibold text-white">IDeiaPages — Admin</span>
          <nav className="flex flex-wrap gap-3 text-sm">
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
            <Link href="/" className="text-slate-500 hover:text-slate-300">
              Site público
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
