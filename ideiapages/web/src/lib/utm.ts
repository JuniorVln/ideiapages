"use client";

import { useEffect, useState } from "react";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/** First-touch UTM (90d, SameSite=Lax) — alinhado ao contract Fase 1 */
const UTM_COOKIE = "__utm";
/** Nome legado (migração silenciosa) */
const UTM_COOKIE_LEGACY = "__utmip";
const UTM_TTL_DAYS = 90;

function parseBrowserCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  return Object.fromEntries(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((c) => c.split("=").map(decodeURIComponent))
  );
}

function setUtmCookie(params: UtmParams): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setDate(expires.getDate() + UTM_TTL_DAYS);
  const value = encodeURIComponent(JSON.stringify(params));
  document.cookie = `${UTM_COOKIE}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function captureUtmsFromUrl(): UtmParams | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utms: UtmParams = {};
  const keys: (keyof UtmParams)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];
  let hasAny = false;
  for (const key of keys) {
    const val = params.get(key);
    if (val) {
      utms[key] = val;
      hasAny = true;
    }
  }
  if (!hasAny) return null;
  setUtmCookie(utms);
  return utms;
}

export function getStoredUtms(): UtmParams | null {
  const cookies = parseBrowserCookies();
  const raw = cookies[UTM_COOKIE] ?? cookies[UTM_COOKIE_LEGACY];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UtmParams;
  } catch {
    return null;
  }
}

/**
 * Hook para páginas client: captura UTMs da URL no mount e devolve cookie first-touch.
 */
export function useUtmTracking(): UtmParams | null {
  const [utms, setUtms] = useState<UtmParams | null>(null);

  useEffect(() => {
    setUtms(captureUtmsFromUrl() ?? getStoredUtms());
  }, []);

  return utms;
}
