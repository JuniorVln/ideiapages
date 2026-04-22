"use client";

import { useEffect, useRef } from "react";
import { LeadForm } from "./LeadForm";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  paginaId: string;
  variacaoId?: string;
  keyword?: string;
  whatsappNumber: string;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  paginaId,
  variacaoId,
  keyword,
  whatsappNumber,
}: WhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="modal-title"
      className="
        w-full max-w-md rounded-2xl p-0 shadow-modal
        backdrop:bg-black/50 backdrop:backdrop-blur-sm
        open:animate-in open:fade-in open:slide-in-from-bottom-4
      "
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-text">
              Falar com especialista
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              Preencha e você será redirecionado para o WhatsApp.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar modal"
            className="
              ml-4 flex-shrink-0 p-1.5 rounded-lg text-text-subtle
              hover:bg-surface-card hover:text-text transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
            "
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <LeadForm
          paginaId={paginaId}
          variacaoId={variacaoId}
          keyword={keyword}
          whatsappNumber={whatsappNumber}
          onSuccess={onClose}
        />
      </div>
    </dialog>
  );
}
