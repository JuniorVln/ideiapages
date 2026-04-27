import { existsSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Mesmo ficheiro `ideiapages/.env` quer `pnpm dev` corra a partir de `web/` ou da raiz. */
const fromHere = (p: string) => path.join(__dirname, p);
const monorepoRoot = fromHere("..");
if (existsSync(path.join(monorepoRoot, ".env")) || existsSync(path.join(monorepoRoot, ".env.local"))) {
  loadEnvConfig(monorepoRoot);
} else if (existsSync(fromHere(".env")) || existsSync(fromHere(".env.local"))) {
  loadEnvConfig(__dirname);
} else {
  loadEnvConfig(monorepoRoot);
}

const BASE_SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** HSTS só em produção — em localhost (http) pode gerar comportamento estranho no browser. */
const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
} as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** Monorepo: pasta pai `ideiapages` (evita avisos de tracing ao fazer build a partir de `web/`). */
  outputFileTracingRoot: path.join(__dirname, ".."),
  typedRoutes: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "ideiamultichat.com.br", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
  async headers() {
    const headers =
      process.env.NODE_ENV === "production"
        ? [...BASE_SECURITY_HEADERS, HSTS_HEADER]
        : [...BASE_SECURITY_HEADERS];
    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
  /**
   * `/admin` sem `page.tsx` com redirect sólido no RSC devolvia, em dev, tela em branco com URL presa.
   * Redirect HTTP 307/308 garante navegação imediata para o hub.
   */
  async redirects() {
    return [
      { source: "/admin", destination: "/admin/hub", permanent: false },
      { source: "/admin/", destination: "/admin/hub", permanent: false },
    ];
  },
};

export default nextConfig;
