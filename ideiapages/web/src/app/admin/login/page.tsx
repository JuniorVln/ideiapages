"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Database } from "@/lib/database.types";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const err = searchParams.get("error");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/admin/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Verifique seu e-mail para o link mágico.");
  }

  return (
    <div className="max-w-md mx-auto mt-16 mb-16 px-4 p-6 rounded-2xl border border-slate-800 bg-slate-900">
      <h1 className="text-xl font-semibold text-white mb-2">Acesso operador</h1>
      <p className="text-sm text-slate-400 mb-6">
        Use o e-mail autorizado em <code className="text-slate-300">ADMIN_ALLOWED_EMAILS</code>.
      </p>
      {err && (
        <p className="text-sm text-red-400 mb-4">Falha na autenticação. Tente novamente.</p>
      )}
      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 disabled:opacity-50"
        >
          {loading ? "Enviando…" : "Enviar link mágico"}
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-slate-300">{msg}</p>}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={<div className="text-slate-400 text-sm p-6 text-center">Carregando…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
