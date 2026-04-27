import Link from "next/link";
import { CONTENT_HUB_NAME, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

export default function PublicContentNotFound() {
  return (
    <main className="min-h-[50vh] bg-surface">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-text">Página não encontrada</h1>
        <p className="mb-4 text-text-muted leading-relaxed">
          Não encontrámos nada neste endereço{" "}
          <code className="rounded bg-surface-card px-1 text-sm text-text">{PUBLIC_CONTENT_BASE_PATH}/…</code>
          . Confirme o <strong className="text-text">slug</strong> (trecho após{" "}
          <code className="rounded bg-surface-card px-1 text-sm text-text">
            {PUBLIC_CONTENT_BASE_PATH}/
          </code>
          ) — tem de ser igual ao mostrado no admin. Use <strong className="text-text">Abrir página pública</strong>{" "}
          na mesma publicação para evitar erro de digitação. Só páginas com status{" "}
          <strong className="text-text">publicado</strong> aparecem aqui; se já publicou e continua a falhar,
          confira as variáveis de ambiente no deploy (Supabase).
        </p>
        <p className="mb-6 text-sm text-text-subtle">
          A URL pública é{" "}
          <code className="rounded bg-surface-card px-1 text-text">{PUBLIC_CONTENT_BASE_PATH}/nome-do-slug</code>, não{" "}
          <code className="rounded bg-surface-card px-1 text-text-muted">/admin/pages/…</code>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href="/" className="text-brand-primary font-medium hover:underline">
            Início
          </Link>
          <span className="text-border">·</span>
          <Link href={PUBLIC_CONTENT_BASE_PATH} className="text-brand-primary font-medium hover:underline">
            {CONTENT_HUB_NAME}
          </Link>
          <span className="text-border">·</span>
          <Link href="/admin/pages" className="text-brand-primary font-medium hover:underline">
            Páginas (admin)
          </Link>
        </div>
      </div>
    </main>
  );
}
