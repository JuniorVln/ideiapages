import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";

const EXPORTS = [
  { type: "paginas", label: "Páginas", desc: "slug, status, experimento, datas" },
  { type: "variacoes", label: "Variações", desc: "braços A/B, provider, custo estimado" },
  { type: "metricas", label: "Métricas diárias", desc: "até 5000 linhas recentes" },
  {
    type: "leads_privacy",
    label: "Leads (pseudonimizado)",
    desc: "sem e-mail/telefone brutos — hash SHA-256 do e-mail, últimos 4 dígitos do telefone",
  },
] as const;

export default async function AdminExportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <p>
        <Link href="/admin/dashboard" className="text-sm text-blue-400 hover:underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="text-2xl font-bold text-white">Exportar CSV</h1>
      <p className="text-slate-400 text-sm max-w-2xl">
        Downloads autenticados pela mesma sessão do admin. Abra cada link estando logado; o
        navegador baixa o arquivo.
      </p>
      <ul className="space-y-3">
        {EXPORTS.map((e) => (
          <li
            key={e.type}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-white">{e.label}</p>
              <p className="text-sm text-slate-500">{e.desc}</p>
            </div>
            <a
              href={`/api/admin/export?type=${e.type}`}
              className="inline-flex justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 shrink-0"
            >
              Baixar .csv
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
