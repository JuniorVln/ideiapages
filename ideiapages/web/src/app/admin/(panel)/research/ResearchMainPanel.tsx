"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const card =
  "rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 shadow-lg shadow-slate-950/40";

type Props = { allowRemote: boolean };

type GscSite = { siteUrl: string; permissionLevel: string | null; kind: "domain" | "url_prefix" };

function gscParamMessage(key: string | null) {
  if (!key) return null;
  const map: Record<string, string> = {
    ok: "Conta Google ligada. Já podes importar consultas do Search Console.",
    denied: "Autorização Google recusada ou cancelada.",
    error: "Resposta OAuth inválida.",
    badstate: "Estado de segurança inválido. Tenta ligar de novo.",
    token: "Não foi possível trocar o código de autorização. Tenta outra vez.",
    norefresh: "A Google não devolveu um refresh token. Revoga o acesso à app no Google e repete a ligação (conta de teste: consentimento de novo).",
    db: "Falha ao guardar a ligação na base de dados (Supabase / service role).",
    session: "Sessão expirou antes de concluir. Faz login e volta a ligar o Google.",
    nocfg: "Credenciais OAuth não configuradas no servidor.",
  };
  return map[key] ?? "Algo correu mal na ligação com o Google.";
}

export function ResearchMainPanel({ allowRemote }: Props) {
  const router = useRouter();
  /** null = a carregar; evita falso "sem chave" com .env fora de web/ */
  const [assistantReady, setAssistantReady] = useState<boolean | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [gscQueriesText, setGscQueriesText] = useState("");
  const [gscOauthMessage, setGscOauthMessage] = useState<string | null>(null);
  const [gscStatus, setGscStatus] = useState<{
    connected: boolean;
    oauthConfigured: boolean;
    supabase: boolean;
  } | null>(null);
  const [gscSites, setGscSites] = useState<GscSite[] | null>(null);
  const [gscSite, setGscSite] = useState("");
  const [gscDays, setGscDays] = useState(28);
  const [gscListErr, setGscListErr] = useState<string | null>(null);
  const [gscImportLoading, setGscImportLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const [contexto, setContexto] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /** Lê ?gsc= no cliente após mount — evita mismatch de hidratação (useSearchParams). */
  useEffect(() => {
    const gsc = new URLSearchParams(window.location.search).get("gsc");
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (gsc) {
      const m = gscParamMessage(gsc) + (reason && gsc === "denied" ? ` (${reason})` : "");
      setGscOauthMessage(m);
      router.replace("/admin/research", { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/research/assistant-ready", {
      method: "GET",
      credentials: "include",
    })
      .then((r) => r.json() as Promise<{ ready?: boolean }>)
      .then((d) => {
        if (!cancelled) setAssistantReady(!!d.ready);
      })
      .catch(() => {
        if (!cancelled) setAssistantReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/gsc/status", { credentials: "include" })
      .then((r) => r.json() as Promise<{ connected?: boolean; oauthConfigured?: boolean; supabase?: boolean }>)
      .then((d) => {
        if (cancelled) return;
        if (d && typeof d.connected === "boolean") {
          setGscStatus({
            connected: d.connected,
            oauthConfigured: !!d.oauthConfigured,
            supabase: d.supabase !== false,
          });
        } else {
          setGscStatus({ connected: false, oauthConfigured: false, supabase: true });
        }
      })
      .catch(() => {
        if (!cancelled) setGscStatus({ connected: false, oauthConfigured: false, supabase: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gscStatus?.connected) {
      setGscSites(null);
      return;
    }
    let cancelled = false;
    setGscListErr(null);
    void fetch("/api/admin/gsc/sites", { credentials: "include" })
      .then((r) => r.json() as Promise<{ sites?: GscSite[]; error?: string }>)
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          setGscListErr(d.error);
          setGscSites([]);
          return;
        }
        const list = d.sites ?? [];
        setGscSites(list);
        setGscSite((prev) => {
          if (prev && list.some((s) => s.siteUrl === prev)) return prev;
          return list[0]?.siteUrl ?? "";
        });
      })
      .catch((e) => {
        if (!cancelled) setGscListErr(e instanceof Error ? e.message : "Falha ao listar sites");
      });
    return () => {
      cancelled = true;
    };
  }, [gscStatus?.connected]);

  const seeds = text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 12);

  async function runSuggest() {
    setSuggestLoading(true);
    setSuggestErr(null);
    setContexto(null);
    const res = await fetch("/api/admin/research/suggest-seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: siteUrl.trim(), gscQueriesText }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      seeds?: string[];
      contextoResumo?: string;
    };
    setSuggestLoading(false);
    if (res.ok && data.ok && data.seeds?.length) {
      setText(data.seeds.join("\n"));
      setContexto(data.contextoResumo ?? null);
      router.refresh();
      return;
    }
    setSuggestErr(data.error ?? "Não foi possível gerar sementes.");
  }

  async function importGscQueries() {
    if (!gscSite.trim()) {
      setGscListErr("Escolhe uma propriedade Search Console.");
      return;
    }
    setGscImportLoading(true);
    setGscListErr(null);
    const res = await fetch("/api/admin/gsc/import-queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ siteUrl: gscSite.trim(), days: gscDays, maxQueries: 100 }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; queries?: string[] };
    setGscImportLoading(false);
    if (res.ok && data.ok && data.queries?.length) {
      setGscQueriesText(data.queries.join("\n"));
      return;
    }
    setGscListErr(data.error ?? "Falha ao importar consultas.");
  }

  async function disconnectGsc() {
    setGscListErr(null);
    const res = await fetch("/api/admin/gsc/disconnect", { method: "POST", credentials: "include" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) {
      setGscStatus((s) =>
        s
          ? { ...s, connected: false }
          : { connected: false, oauthConfigured: true, supabase: true },
      );
      setGscSites(null);
      setGscSite("");
      router.refresh();
      return;
    }
    setGscListErr(data.error ?? "Não foi possível desligar.");
  }

  async function run() {
    setLoading(true);
    setLog(null);
    setErr(null);
    const res = await fetch("/api/admin/research/run-pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seeds,
        dryRun: false,
        skipTrends: false,
        skipGaps: true,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      stdout?: string;
      stderr?: string;
    };
    setLoading(false);
    const out = [data.stdout, data.stderr].filter(Boolean).join("\n---\n") || "";
    if (res.ok && data.ok) {
      setLog(out || "Concluído.");
      router.refresh();
      return;
    }
    setErr([data.error, data.stderr, data.stdout].filter(Boolean).join("\n") || "Falha.");
    if (out) setLog(out);
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="text-lg font-semibold text-white">Partir do site (recomendado)</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Cola a <strong className="text-slate-300">URL pública do cliente</strong>. O sistema
          lê a página com Firecrawl e usa a IA para propor sementes alinhadas ao que o site realmente
          oferece.
        </p>

        {assistantReady === null ? (
          <p className="mt-3 text-sm text-slate-500">A verificar chaves (Firecrawl + Anthropic)…</p>
        ) : assistantReady ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                URL do site
              </label>
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://exemplo.com.br"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </div>
            {contexto && (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm text-slate-300">
                <span className="text-xs text-emerald-400/90 font-medium uppercase">Contexto lido</span>
                <p className="mt-1 text-slate-300 leading-relaxed">{contexto}</p>
              </div>
            )}
            {suggestErr && (
              <p className="text-sm text-red-300 whitespace-pre-wrap">{suggestErr}</p>
            )}
            <button
              type="button"
              onClick={runSuggest}
              disabled={suggestLoading || !siteUrl.trim()}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              {suggestLoading ? "A ler site e a gerar…" : "Gerar sementes a partir do site"}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-200/80 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            Não encontrei <code className="text-amber-100">FIRECRAWL_API_KEY</code> e{" "}
            <code className="text-amber-100">ANTHROPIC_API_KEY</code>. Cola-as no{" "}
            <code className="text-amber-100">ideiapages/.env</code> (ou em{" "}
            <code className="text-amber-100">ideiapages/web/.env.local</code>) e reinicia o{" "}
            <code className="text-amber-100">pnpm dev</code>.
          </p>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-200">Search Console (opcional)</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Importa as consultas reais (top cliques) para a IA afinar sementes. Ligar à Google usa
            OAuth; a propriedade pode ser <span className="text-slate-400">URL prefixo</span> (ex.{" "}
            <code className="text-slate-500">https://…/</code>) ou <span className="text-slate-400">domínio</span> (
            <code className="text-slate-500">sc-domain:…</code>).
          </p>
          {gscOauthMessage && (
            <p className="mt-3 text-sm text-emerald-200/90 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              {gscOauthMessage}
            </p>
          )}
          {gscStatus === null ? (
            <p className="mt-2 text-sm text-slate-500">A carregar integração GSC…</p>
          ) : !gscStatus.supabase ? (
            <p className="mt-2 text-sm text-amber-200/80">
              <code className="text-amber-100">SUPABASE_SERVICE_ROLE_KEY</code> em falta — não dá
              para guardar o token OAuth.
            </p>
          ) : !gscStatus.oauthConfigured ? (
            <p className="mt-2 text-sm text-amber-200/80">
              Definir <code className="text-amber-100">GOOGLE_OAUTH_CLIENT_ID</code> e{" "}
              <code className="text-amber-100">GOOGLE_OAUTH_CLIENT_SECRET</code> no{" "}
              <code className="text-amber-100">.env</code> (ver exemplo no repositório).
            </p>
          ) : !gscStatus.connected ? (
            <div className="mt-3">
              <a
                href="/api/admin/gsc/oauth"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-sm font-medium"
              >
                Ligar conta Google
              </a>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {gscSites === null && !gscListErr && (
                <p className="text-sm text-slate-500">A carregar propriedades…</p>
              )}
              {gscSites && gscSites.length === 0 && !gscListErr && (
                <p className="text-sm text-amber-200/80">
                  Não há propriedades listadas. Confirma acesso a este Google na Search Console
                  (conta de serviço ou utilizador com permissão).
                </p>
              )}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                    Propriedade GSC
                  </label>
                  <select
                    value={gscSite}
                    onChange={(e) => setGscSite(e.target.value)}
                    disabled={gscSites === null}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
                  >
                    {(gscSites ?? []).map((s) => (
                      <option key={s.siteUrl} value={s.siteUrl}>
                        {s.kind === "domain" ? "[Domínio] " : "[URL] "}
                        {s.siteUrl}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                    Dias
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={400}
                    value={gscDays}
                    onChange={(e) => setGscDays(Math.max(3, Math.min(400, Number(e.target.value) || 28)))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={importGscQueries}
                  disabled={gscImportLoading || (gscSites?.length ?? 0) === 0}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium h-[38px] self-end"
                >
                  {gscImportLoading ? "A importar…" : "Importar do GSC"}
                </button>
                <button
                  type="button"
                  onClick={disconnectGsc}
                  className="px-3 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800/60 h-[38px] self-end"
                >
                  Desligar Google
                </button>
              </div>
              {gscListErr && <p className="text-sm text-red-300 whitespace-pre-wrap">{gscListErr}</p>}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                  Consultas importadas (usadas ao gerar sementes)
                </label>
                <textarea
                  value={gscQueriesText}
                  onChange={(e) => setGscQueriesText(e.target.value)}
                  rows={4}
                  placeholder="Importa com o botão acima ou cola consultas, uma por linha."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={card}>
        <h2 className="text-lg font-semibold text-white">Pesquisa volumétrica</h2>

        {!allowRemote && (
          <p className="mt-3 text-sm text-amber-200/80 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <strong>Pipeline</strong> pelo browser está desligado: usa{" "}
            <code className="text-amber-100">development</code> ou{" "}
            <code className="text-amber-100">ALLOW_ADMIN_RESEARCH_CLI=1</code>, ou a CLI em{" "}
            <code className="text-amber-100">ideiapages/research</code> com a mesma base de
            sementes.
          </p>
        )}

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Temas / sementes
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"Gera a partir do site acima ou escreve aqui, uma por linha.\nex.\natendimento whatsapp clínicas"}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            {seeds.length > 0 && (
              <span className="text-slate-400">
                <strong>{seeds.length}</strong>
                {` semente(s) · máx. 12 · `}
              </span>
            )}
            {`Mínimo 2 caracteres por linha. O funil de pesquisa volumétrica `}
            <strong className="text-slate-400">inclui Google Trends</strong>
            {` (PyTrends) automaticamente; não gera roteiros Claude neste passo.`}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={loading || !allowRemote || seeds.length === 0}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold shadow-md shadow-emerald-900/20"
          >
            {loading ? "A processar (pode levar muito tempo)…" : "Processar tudo"}
          </button>
          <span className="text-xs text-slate-500">Apify, Firecrawl, Google Trends (PyTrends) e LLM no pipeline.</span>
        </div>

        {err && (
          <p className="mt-4 text-sm text-red-300 whitespace-pre-wrap break-words border-t border-slate-800 pt-4">
            {err}
          </p>
        )}
        {log && (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500 mb-1">Log</p>
            <pre className="text-xs text-slate-400 bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap">
              {log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
