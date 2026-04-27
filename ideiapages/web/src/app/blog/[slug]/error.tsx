"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CONTENT_HUB_NAME, PUBLIC_CONTENT_BASE_PATH } from "@/lib/public-pages";

export default function PublicSalesPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[pagina-publica]", error);
    }
  }, [error]);

  return (
    <main className="min-h-[50vh] bg-surface px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="mb-2 text-2xl font-semibold text-text">Não foi possível carregar a página</h1>
        <p className="mb-6 text-text-muted leading-relaxed">
          Ocorreu um erro ao montar esta publicação. Tente de novo; se persistir, confira o terminal do
          Next.js (dev) ou os logs do deploy.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-brand-primary px-4 py-2 font-medium text-white hover:opacity-95"
          >
            Tentar novamente
          </button>
          <Link href={PUBLIC_CONTENT_BASE_PATH} className="text-brand-primary font-medium hover:underline">
            {CONTENT_HUB_NAME}
          </Link>
        </div>
      </div>
    </main>
  );
}
