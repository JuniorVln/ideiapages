import type { WithContext, Article, FAQPage, BreadcrumbList } from "schema-dts";

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
}

export function SchemaOrg({
  titulo,
  subtitulo,
  slug,
  siteUrl,
  publicadoEm,
  atualizadoEm,
  faqs,
}: SchemaOrgProps) {
  const pageUrl = `${siteUrl}/blog/${slug}`;

  const article: WithContext<Article> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titulo,
    description: subtitulo ?? undefined,
    url: pageUrl,
    datePublished: publicadoEm ?? undefined,
    dateModified: atualizadoEm ?? publicadoEm ?? undefined,
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
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
