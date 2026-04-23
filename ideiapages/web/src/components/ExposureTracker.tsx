"use client";

import { useEffect, useRef } from "react";

type Props = {
  paginaId: string;
  variacaoId: string;
};

/**
 * Incrementa sessão/pageview no Supabase (métricas por braço A/B).
 * Melhor esforço — falhas silenciosas não bloqueiam a página.
 */
export function ExposureTracker({ paginaId, variacaoId }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    void fetch("/api/metrics/exposure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagina_id: paginaId, variacao_id: variacaoId }),
      keepalive: true,
    }).catch(() => {});
  }, [paginaId, variacaoId]);

  return null;
}
