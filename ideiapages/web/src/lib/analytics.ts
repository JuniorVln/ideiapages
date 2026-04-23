"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Nomes alinhados à spec Fase 1 (+ redirects WhatsApp). */
export const GA_EVENTS = {
  FORM_START: "form_start",
  FORM_ABANDON: "form_abandon",
  LEAD_SUBMIT: "lead_submit",
  WHATSAPP_OPEN: "whatsapp_open",
  WHATSAPP_REDIRECT: "whatsapp_redirect",
} as const;

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
