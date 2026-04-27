import Link from "next/link";
import type { Route } from "next";

/** Quando SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY não estão no .env.local */
export function AdminNeedSupabaseEnv() {
  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100">
      <h1 className="text-lg font-semibold text-white">Supabase não configurado</h1>
      <p className="text-sm text-amber-200/90 leading-relaxed">
        Para esta tela o servidor precisa falar com o banco. Adicione no arquivo{" "}
        <code className="rounded bg-black/30 px-1 py-0.5 text-amber-50">ideiapages/web/.env.local</code>:
      </p>
      <ul className="text-sm font-mono text-amber-50/90 space-y-1 list-disc list-inside">
        <li>
          <code>SUPABASE_URL</code> ou <code>NEXT_PUBLIC_SUPABASE_URL</code>
        </li>
        <li>
          <code>SUPABASE_SERVICE_ROLE_KEY</code>
        </li>
      </ul>
      <p className="text-xs text-amber-200/70">
        Reinicie o <code className="text-amber-100">pnpm dev</code> depois de salvar.
      </p>
      <Link
        href={"/admin/hub" as Route}
        className="inline-block text-sm text-blue-300 hover:text-blue-200 underline"
      >
        ← Voltar ao índice
      </Link>
    </div>
  );
}
