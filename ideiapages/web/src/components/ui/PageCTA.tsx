"use client";

import { useState } from "react";
import { Button } from "./Button";
import { WhatsAppModal } from "./WhatsAppModal";
import { GA_EVENTS, trackEvent } from "@/lib/analytics";

interface PageCTAProps {
  paginaId: string;
  variacaoId?: string;
  keyword?: string;
  whatsappNumber: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Visual: azul marca Ideia ou verde WhatsApp padrão. */
  buttonVariant?: "ideia" | "whatsapp";
}

export function PageCTA({
  paginaId,
  variacaoId,
  keyword,
  whatsappNumber,
  label = "Falar com especialista",
  size = "lg",
  className = "",
  buttonVariant = "ideia",
}: PageCTAProps) {
  const [open, setOpen] = useState(false);

  function handleClick() {
    trackEvent(GA_EVENTS.WHATSAPP_OPEN, { source: "page_cta", pagina_id: paginaId });
    setOpen(true);
  }

  return (
    <>
      <Button
        variant={buttonVariant === "ideia" ? "ideia" : "whatsapp"}
        size={size}
        onClick={handleClick}
        className={className}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.526 5.845L.057 23.999l6.304-1.651A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 0 1-5.003-1.37l-.358-.213-3.742.98 1.003-3.647-.234-.374A9.793 9.793 0 0 1 2.182 12C2.182 6.576 6.576 2.182 12 2.182c5.424 0 9.818 4.394 9.818 9.818 0 5.423-4.394 9.818-9.818 9.818z" />
        </svg>
        {label}
      </Button>

      <WhatsAppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        paginaId={paginaId}
        variacaoId={variacaoId}
        keyword={keyword}
        whatsappNumber={whatsappNumber}
      />
    </>
  );
}
