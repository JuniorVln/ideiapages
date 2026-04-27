import type { WithContext, Article, FAQPage, BreadcrumbList } from "schema-dts";
import { CONTENT_HUB_NAME, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

interface FaqItem {
  pergunta: string;
  resposta: string;
}

interface SchemaOrgProps {
  titulo: string;
  subtitulo?: string | null;
  slug: string;
  siteUrl: string;
  publicadoEm?: string | null;
  atualizadoEm?: string;
  faqs?: FaqItem[];
  /** Imagem principal (OG / Pexels) para Article rich results */
  imageUrl?: string | null;
  /** Keyword / tema — vira articleSection para contexto SEO */
  articleSection?: string | null;
}

export function SchemaOrg({
  titulo,
  subtitulo,
  slug,
  siteUrl,
  publicadoEm,
  atualizadoEm,
  faqs,
  imageUrl,
  articleSection,
}: SchemaOrgProps) {
  const pageUrl = `${siteUrl}${PUBLIC_CONTENT_BASE_PATH}/${slug}`;
  const hubUrl = `${siteUrl}${PUBLIC_CONTENT_BASE_PATH}`;

  const article: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titulo,
    description: subtitulo ?? undefined,
    url: pageUrl,
    datePublished: publicadoEm ?? undefined,
    dateModified: atualizadoEm ?? publicadoEm ?? undefined,
    inLanguage: "pt-BR",
    articleSection: articleSection ?? undefined,
    ...(imageUrl
      ? {
          image: {
            "@type": "ImageObject" as const,
            url: imageUrl,
          },
        }
      : {}),
    spatialCoverage: {
      "@type": "Place",
      name: "Brasil",
    },
    publisher: {
      "@type": "Organization",
      name: "Ideia Chat",
      url: siteUrl,
    },
  };

  const breadcrumb: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      { "@type": "ListItem", position: 2, name: CONTENT_HUB_NAME, item: hubUrl },
      { "@type": "ListItem", position: 3, name: titulo, item: pageUrl },
    ],
  };

  const schemas: object[] = [article, breadcrumb];

  if (faqs && faqs.length > 0) {
    const faqPage: WithContext<FAQPage> = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.pergunta,
        acceptedAnswer: { "@type": "Answer", text: f.resposta },
      })),
    };
    schemas.push(faqPage);
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Evita fechar a tag se FAQ/título tiverem "</script>" ou "<" em texto.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
