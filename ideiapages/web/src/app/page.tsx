import Link from "next/link";
import { CONTENT_HUB_NAME, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

export default function Home() {
  return (
    <main className="mx-auto max-w-content px-4 py-24">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">IDeiaPages</h1>
      <p className="mt-4 text-text-muted">
        Plataforma de geração de páginas otimizadas para SEO e conversão. As páginas públicas de
        conteúdo comercial ficam em <code>{PUBLIC_CONTENT_BASE_PATH}/[slug]</code> (rota técnica;
        experiência de página de vendas).
      </p>
      <p className="mt-6">
        <Link
          href={PUBLIC_CONTENT_BASE_PATH}
          className="text-brand-primary font-medium underline underline-offset-2 hover:text-brand-primary-dark"
        >
          Ver {CONTENT_HUB_NAME.toLowerCase()} e páginas publicadas →
        </Link>
      </p>
      <p className="mt-4 text-sm text-text-muted">
        Veja <code>docs/sdd-workflow.md</code> para o processo de criação de páginas.
      </p>
    </main>
  );
}
