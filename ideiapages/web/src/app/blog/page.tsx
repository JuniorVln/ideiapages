import Link from "next/link";
import type { Metadata } from "next";
import { getSupabasePublicReadClient } from "@/lib/supabase/public";
import type { Tables } from "@/lib/database.types";
import { CONTENT_HUB_NAME, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { getSiteUrl } from "@/lib/site-url";
import { formatDatePtBrLong } from "@/lib/format-date-br";

type PaginaListItem = Pick<
  Tables<"paginas">,
  "slug" | "titulo" | "subtitulo" | "publicado_em"
>;

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: `${CONTENT_HUB_NAME} | Ideia Chat`,
  description:
    "Páginas e conteúdos para decidir com confiança: atendimento WhatsApp com IA, API oficial e escala comercial.",
  alternates: { canonical: `${SITE_URL}${PUBLIC_CONTENT_BASE_PATH}` },
};

export default async function ContentHubIndexPage() {
  const supabase = getSupabasePublicReadClient();
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
            {CONTENT_HUB_NAME}
          </li>
        </ol>
      </nav>

      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-text tracking-display">
          Soluções para vender e atender melhor no WhatsApp
        </h1>
        <p className="mt-3 text-text-muted max-w-2xl">
          Conteúdos pensados para apresentar o Ideia Chat, tirar dúvidas e levar você a falar com um
          especialista — com foco em resultado comercial e conversão.
        </p>
      </header>

      {paginas && paginas.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {paginas.map((p) => (
            <li key={p.slug}>
              <article className="rounded-xl border border-border bg-surface p-5 shadow-card hover:border-border-focus/40 transition-colors">
                <Link
                  href={`${PUBLIC_CONTENT_BASE_PATH}/${p.slug}`}
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
                      {formatDatePtBrLong(p.publicado_em) || "—"}
                    </time>
                  )}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">
          Nenhuma página pública ainda. Publique com{" "}
          <code className="text-sm bg-surface-card px-1 rounded">status = publicado</code> no painel
          ou Supabase.
        </p>
      )}
    </main>
  );
}
