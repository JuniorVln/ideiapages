import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-content px-4 py-24">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">IDeiaPages</h1>
      <p className="mt-4 text-text-muted">
        Plataforma de geração de páginas otimizadas para SEO e conversão. Esta é uma raiz placeholder
        — as páginas de produção serão geradas em <code>/blog/[slug]</code>,{" "}
        <code>/solucoes/[slug]</code>, etc., conforme os behaviors de <code>rendering/</code>.
      </p>
      <p className="mt-6">
        <Link
          href="/blog"
          className="text-brand-primary font-medium underline underline-offset-2 hover:text-brand-primary-dark"
        >
          Ver artigos publicados no blog →
        </Link>
      </p>
      <p className="mt-4 text-sm text-text-muted">
        Veja <code>docs/sdd-workflow.md</code> para o processo de criação de páginas.
      </p>
    </main>
  );
}
