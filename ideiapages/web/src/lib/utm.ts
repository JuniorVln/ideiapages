"use client";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const UTM_COOKIE = "__utmip";
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
  const raw = cookies[UTM_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UtmParams;
  } catch {
    return null;
  }
}
