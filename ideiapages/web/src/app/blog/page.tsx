import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

type PaginaListItem = Pick<
  Tables<"paginas">,
  "slug" | "titulo" | "subtitulo" | "publicado_em"
>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideiamultichat.com.br";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos e guias sobre atendimento WhatsApp, Ideia Chat e conversão para empresas.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default async function BlogIndexPage() {
  const supabase = await getSupabaseServerClient();
  const { data: paginasRaw } = await supabase
    .from("paginas")
    .select("slug, titulo, subtitulo, publicado_em")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false });

  const paginas = (paginasRaw ?? []) as PaginaListItem[];

  return (
    <main className="max-w-container mx-auto px-4 py-section-y">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <li>
            <Link href="/" className="text-brand-primary hover:underline">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-text font-medium" aria-current="page">
            Blog
          </li>
        </ol>
      </nav>

      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-text tracking-display">
          Blog
        </h1>
        <p className="mt-3 text-text-muted max-w-2xl">
          Conteúdo para quem quer escalar atendimento e vendas no WhatsApp com processo profissional.
        </p>
      </header>

      {paginas && paginas.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {paginas.map((p) => (
            <li key={p.slug}>
              <article className="rounded-xl border border-border bg-surface p-5 shadow-card hover:border-border-focus/40 transition-colors">
                <Link
                  href={`/blog/${p.slug}`}
                  className="block group"
                >
                  <h2 className="text-lg font-semibold text-text group-hover:text-brand-primary transition-colors">
                    {p.titulo}
                  </h2>
                  {p.subtitulo && (
                    <p className="mt-1 text-sm text-text-muted line-clamp-2">{p.subtitulo}</p>
                  )}
                  {p.publicado_em && (
                    <time
                      dateTime={p.publicado_em}
                      className="mt-2 block text-xs text-text-subtle"
                    >
                      {new Date(p.publicado_em).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">
          Nenhum artigo publicado ainda. Publique páginas com{" "}
          <code className="text-sm bg-surface-card px-1 rounded">status = publicado</code> no
          Supabase.
        </p>
      )}
    </main>
  );
}
