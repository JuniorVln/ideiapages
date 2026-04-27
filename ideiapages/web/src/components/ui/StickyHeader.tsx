"use client";

import { useEffect, useState } from "react";
import { ScrollToSectionButton } from "./ScrollToSectionButton";

interface StickyHeaderProps {
  /** Elemento observado: quando sair da viewport, o header aparece. */
  sentinelId: string;
  /** Título curto ao lado do CTA (opcional). */
  headline?: string;
}

export function StickyHeader({ sentinelId, headline }: StickyHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { root: null, rootMargin: "-72px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelId]);

  if (!visible) return null;

  return (
    <header
      role="banner"
      className="
        fixed top-0 left-0 right-0 z-50
        border-b border-border bg-surface/95 backdrop-blur-md shadow-card
        animate-in fade-in slide-in-from-top-2 duration-200
      "
    >
      <div className="max-w-container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {headline ? (
          <p className="text-sm font-semibold text-text truncate min-w-0 hidden sm:block">
            {headline}
          </p>
        ) : (
          <span className="hidden sm:block text-sm font-medium text-text-muted">Ideia Chat</span>
        )}
        <div className="flex-shrink-0 ml-auto">
          <ScrollToSectionButton
            targetId="demonstracao-gratuita"
            size="sm"
            aria-label="Rolar até valores e demonstração"
          >
            Valores e demonstração
          </ScrollToSectionButton>
        </div>
      </div>
    </header>
  );
}
