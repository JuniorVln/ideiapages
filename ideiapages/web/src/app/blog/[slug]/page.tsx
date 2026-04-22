import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SchemaOrg } from "@/components/ui/SchemaOrg";
import { PageCTA } from "@/components/ui/PageCTA";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import type { Tables } from "@/lib/database.types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideiamultichat.com.br";
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

interface Props {
  params: Promise<{ slug: string }>;
}

type Variacao = Pick<Tables<"variacoes">, "id" | "nome" | "ativa">;
type PaginaComVariacoes = Tables<"paginas"> & { variacoes: Variacao[] };

async function getPagina(slug: string): Promise<PaginaComVariacoes | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("paginas")
    .select("*, variacoes(id, nome, ativa)")
    .eq("slug", slug)
    .eq("status", "publicado")
    .single();

  if (error || !data) return null;
  return data as unknown as PaginaComVariacoes;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await getPagina(slug);
  if (!pagina) return { title: "Página não encontrada" };

  const canonical = `${SITE_URL}/blog/${slug}`;

  return {
    title: pagina.meta_title ?? pagina.titulo,
    description: pagina.meta_description ?? pagina.subtitulo ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: pagina.meta_title ?? pagina.titulo,
      description: pagina.meta_description ?? pagina.subtitulo ?? undefined,
      url: canonical,
      type: "article",
      images: pagina.og_image_url ? [{ url: pagina.og_image_url }] : [],
    },
  };
}

interface FaqItem {
  pergunta: string;
  resposta: string;
}

function parseFaq(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is FaqItem =>
      typeof item === "object" &&
      item !== null &&
      "pergunta" in item &&
      "resposta" in item
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|p|u|o|l])/, "<p>")
    .replace(/$(?!<\/[h|p|u|o|l])/, "</p>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>");
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;
  const pagina = await getPagina(slug);

  if (!pagina) notFound();

  const faqs = parseFaq(pagina.faq_jsonb);
  const variacaoControle = Array.isArray(pagina.variacoes)
    ? (pagina.variacoes as Array<{ id: string; nome: string; ativa: boolean }>).find(
        (v) => v.nome === "controle" && v.ativa
      )
    : undefined;

  return (
    <>
      <SchemaOrg
        titulo={pagina.titulo}
        subtitulo={pagina.subtitulo}
        slug={slug}
        siteUrl={SITE_URL}
        publicadoEm={pagina.publicado_em}
        atualizadoEm={pagina.atualizado_em}
        faqs={faqs}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white py-16 px-4">
        <div className="max-w-container mx-auto">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-blue-200">
              <li><a href="/" className="hover:text-white transition-colors">Início</a></li>
              <li aria-hidden className="text-blue-300">/</li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li aria-hidden className="text-blue-300">/</li>
              <li className="text-white font-medium truncate max-w-[200px]" aria-current="page">{pagina.titulo}</li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {pagina.titulo}
          </h1>

          {pagina.subtitulo && (
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">{pagina.subtitulo}</p>
          )}

          <PageCTA
            paginaId={pagina.id}
            variacaoId={variacaoControle?.id}
            keyword={pagina.titulo}
            whatsappNumber={WA_NUMBER}
            label={pagina.cta_whatsapp_texto}
            size="lg"
          />
        </div>
      </section>

      {/* Conteúdo */}
      <div className="max-w-container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        <article className="flex-1 min-w-0">
          <div
            className="prose-blog"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(pagina.corpo_mdx) }}
          />

          {/* CTA intermediário (a cada ~600 palavras é feito inline, mas aqui colocamos um fixo no meio) */}
          <div className="my-10 p-6 bg-surface-alt rounded-2xl border border-border text-center">
            <p className="text-lg font-semibold text-text mb-2">
              Pronto para transformar o atendimento da sua empresa?
            </p>
            <p className="text-text-muted mb-4">
              Fale agora com um especialista e receba uma demonstração gratuita do Ideia Chat.
            </p>
            <PageCTA
              paginaId={pagina.id}
              variacaoId={variacaoControle?.id}
              keyword={pagina.titulo}
              whatsappNumber={WA_NUMBER}
              label="Quero ver uma demo grátis"
            />
          </div>

          {/* FAQ */}
          {faqs.length > 0 && (
            <section aria-labelledby="faq-heading" className="mt-12">
              <h2 id="faq-heading" className="text-2xl font-bold text-text mb-6">
                Perguntas frequentes
              </h2>
              <dl className="flex flex-col gap-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="group rounded-xl border border-border p-4">
                    <summary className="font-semibold text-text cursor-pointer list-none flex justify-between items-center">
                      {faq.pergunta}
                      <svg
                        className="size-4 text-text-muted transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-text-muted leading-relaxed">{faq.resposta}</p>
                  </details>
                ))}
              </dl>
            </section>
          )}

          {/* CTA final */}
          <div className="mt-12 p-8 bg-brand-primary rounded-2xl text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Comece agora com o Ideia Chat</h2>
            <p className="text-blue-100 mb-6">
              Mais de 400 empresas já usam. Setup em menos de 24h.
            </p>
            <PageCTA
              paginaId={pagina.id}
              variacaoId={variacaoControle?.id}
              keyword={pagina.titulo}
              whatsappNumber={WA_NUMBER}
              label={pagina.cta_whatsapp_texto}
              size="lg"
              className="bg-white !text-brand-primary hover:bg-blue-50"
            />
          </div>
        </article>

        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-8 p-6 bg-surface-alt rounded-2xl border border-border">
            <p className="font-semibold text-text mb-1">Fale com um especialista</p>
            <p className="text-sm text-text-muted mb-4">
              Tire suas dúvidas e veja como o Ideia Chat se encaixa no seu negócio.
            </p>
            <PageCTA
              paginaId={pagina.id}
              variacaoId={variacaoControle?.id}
              keyword={pagina.titulo}
              whatsappNumber={WA_NUMBER}
              label="Conversar agora"
              size="md"
              className="w-full"
            />
          </div>
        </aside>
      </div>

      {/* CTA flutuante mobile */}
      <FloatingCTA
        paginaId={pagina.id}
        variacaoId={variacaoControle?.id}
        keyword={pagina.titulo}
        whatsappNumber={WA_NUMBER}
      />
    </>
  );
}
