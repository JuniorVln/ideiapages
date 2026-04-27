import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SchemaOrg } from "@/components/ui/SchemaOrg";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { StickyHeader } from "@/components/ui/StickyHeader";
import { ExposureTracker } from "@/components/ExposureTracker";
import { BlogTrustStrip } from "@/components/blog/BlogTrustStrip";
import { BlogLegalFooter } from "@/components/blog/BlogLegalFooter";
import { SalesPageHero } from "@/components/blog/BlogArticleHero";
import { PageContentSections } from "@/components/blog/PageContentSections";
import {
  resolveVariacaoId,
  variacaoCookieName,
  VISITOR_COOKIE,
  type PaginaExperimentContext,
  type VariacaoArm,
} from "@/lib/experiments/pick-variation";
import { loadBlogPost } from "@/lib/blog/load-post";
import { parseMarkdownToSections } from "@/lib/blog/parse-sections";
import type { VariacaoPagina } from "@/lib/blog/get-pagina";
import { PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const data = await loadBlogPost(rawSlug);
  if (!data) return { title: "Página não encontrada" };

  const { pagina, visuals } = data;
  const canonical = `${SITE_URL}${PUBLIC_CONTENT_BASE_PATH}/${pagina.slug}`;
  const ogImage = visuals.heroSrc ?? pagina.og_image_url ?? undefined;

  return {
    title: pagina.meta_title ?? pagina.titulo,
    description: pagina.meta_description ?? pagina.subtitulo ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: pagina.meta_title ?? pagina.titulo,
      description: pagina.meta_description ?? pagina.subtitulo ?? undefined,
      url: canonical,
      type: "website",
      locale: "pt_BR",
      images: ogImage ? [{ url: ogImage }] : [],
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
      "resposta" in item,
  );
}

export default async function PublicSalesPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const data = await loadBlogPost(rawSlug);
  if (!data) notFound();

  const { pagina, focusKeyword, visuals } = data;
  const publicSlug = pagina.slug;

  const faqs = parseFaq(pagina.faq_jsonb);
  const arms: VariacaoArm[] = Array.isArray(pagina.variacoes)
    ? (pagina.variacoes as VariacaoPagina[]).map((v) => ({
        id: v.id,
        nome: v.nome,
        ativa: v.ativa,
        provider: v.provider ?? "controle",
        peso_trafego: v.peso_trafego ?? 1,
        corpo_mdx: v.corpo_mdx,
      }))
    : [];

  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value ?? "anon";
  const ctx: PaginaExperimentContext = {
    id: pagina.id,
    status_experimento: pagina.status_experimento ?? "inativo",
    variacao_vencedora_id: pagina.variacao_vencedora_id ?? null,
    variacoes: arms,
  };
  const cookieVid = cookieStore.get(variacaoCookieName(pagina.id))?.value;
  const variacaoAtivaId = resolveVariacaoId(visitorId, ctx, cookieVid);
  const variacaoAtiva = arms.find((v) => v.id === variacaoAtivaId);
  const corpoMdx =
    variacaoAtiva?.corpo_mdx && variacaoAtiva.corpo_mdx.trim().length > 0
      ? variacaoAtiva.corpo_mdx
      : pagina.corpo_mdx;

  const ogForSchema = visuals.heroSrc ?? pagina.og_image_url;

  // Parsear markdown em seções estruturadas
  const sections = parseMarkdownToSections(corpoMdx ?? "");

  return (
    <>
      {variacaoAtivaId ? (
        <ExposureTracker paginaId={pagina.id} variacaoId={variacaoAtivaId} />
      ) : null}

      <SchemaOrg
        titulo={pagina.titulo}
        subtitulo={pagina.subtitulo}
        slug={publicSlug}
        siteUrl={SITE_URL}
        publicadoEm={pagina.publicado_em}
        atualizadoEm={pagina.atualizado_em}
        faqs={faqs}
        imageUrl={ogForSchema}
        articleSection={focusKeyword}
      />

      {/* ── Hero (inalterado) ─────────────────────────── */}
      <SalesPageHero
        titulo={pagina.titulo}
        subtitulo={pagina.subtitulo}
        focusKeyword={focusKeyword}
        heroImageSrc={visuals.heroSrc}
        heroImageAlt={visuals.heroAlt}
        heroCredit={pagina.og_image_url ? null : visuals.heroCredit}
        publicadoEm={pagina.publicado_em}
      />

      {/* ── Marquee (inalterado) ─────────────────────── */}
      <BlogTrustStrip />

      {/* ── Header sticky ───────────────────────────── */}
      <StickyHeader sentinelId="hero-scroll-sentinel" headline={pagina.titulo} />

      {/* ── Conteúdo dinâmico ────────────────────────── */}
      <main aria-label="Conteúdo comercial da página">
        {focusKeyword ? (
          <p className="sr-only">
            Foco desta oferta: {focusKeyword}. Conteúdo em português para empresas no Brasil.
          </p>
        ) : null}

        <PageContentSections
          sections={sections}
          faqs={faqs}
          pageTitulo={pagina.titulo}
          focusKeyword={focusKeyword}
          excludeImageSrcs={
            [visuals.heroSrc, visuals.inlineSrc].filter((u): u is string => Boolean(u)) as string[]
          }
          inlineFigure={{
            src: visuals.inlineSrc,
            alt: visuals.inlineAlt,
            credit: visuals.inlineCredit,
          }}
          paginaId={pagina.id}
          variacaoId={variacaoAtivaId}
          whatsappNumber={WA_NUMBER}
        />
      </main>

      <BlogLegalFooter />

      <FloatingCTA
        paginaId={pagina.id}
        variacaoId={variacaoAtivaId}
        keyword={pagina.titulo}
        whatsappNumber={WA_NUMBER}
      />
    </>
  );
}
