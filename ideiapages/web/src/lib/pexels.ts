/**
 * Pexels API (server-only). Defina PEXELS_API_KEY no .env — nunca no client.
 * @see https://www.pexels.com/api/documentation/
 *
 * Fallbacks no CDN Pexels (licença Pexels) se a API falhar ou não houver chave.
 */
/** Fallbacks CDN Pexels (só se API falhar ou sem PEXELS_API_KEY). Cada entrada = foto distinta (evitar repetir na mesma página). */
export const PEXELS_STOCK_IMAGES = {
  hero: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
  heroAlt: "Pessoas a trabalhar com portáteis em equipa",
  inline: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
  inlineAlt: "Reunião e colaboração em escritório",
  credit: "Fauxels",
} as const;

/** Pool extra (IDs Pexels distintos) para secções quando a API falha ou todas as tentativas caem em duplicado. */
export const PEXELS_STOCK_POOL = [
  { src: PEXELS_STOCK_IMAGES.hero, alt: PEXELS_STOCK_IMAGES.heroAlt, credit: "Fauxels" },
  { src: PEXELS_STOCK_IMAGES.inline, alt: PEXELS_STOCK_IMAGES.inlineAlt, credit: PEXELS_STOCK_IMAGES.credit },
  {
    src: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Equipa em reunião",
    credit: "fauxels",
  },
  {
    src: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Escritório moderno",
    credit: "fauxels",
  },
  {
    src: "https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Pessoas em trabalho colaborativo",
    credit: "Helena Lopes",
  },
  {
    src: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Profissional com portátil",
    credit: "fauxels",
  },
  {
    src: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Reunião de negócios",
    credit: "Christina Morillo",
  },
  {
    src: "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop",
    alt: "Ambiente de trabalho",
    credit: "Christina Morillo",
  },
] as const;

export type PexelsPhoto = {
  src: string;
  srcLarge: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
};

function pickAlt(photo: {
  alt?: string | null;
  url?: string;
}): string {
  const a = (photo.alt ?? "").trim();
  if (a.length > 0) return a;
  return "Ilustração relacionada à página";
}

export type SearchPexelsParams = {
  query: string;
  orientation?: "landscape" | "portrait" | "square";
  /** Índice 0-based dentro da página de resultados. */
  resultIndex?: number;
  /** Página da API (1 = primeiro lote; use 2+ para outro conjunto e evitar repetir a mesma foto com a mesma query). */
  page?: number;
};

export async function searchPexelsPhoto(params: SearchPexelsParams): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey?.trim()) return null;

  const orientation = params.orientation ?? "landscape";
  const q = params.query.trim().slice(0, 200);
  if (!q) return null;

  const page = Math.max(1, params.page ?? 1);
  const idx = Math.max(0, params.resultIndex ?? 0);
  const perPage = Math.min(80, Math.max(15, idx + 1));

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", orientation);

  const isDev = process.env.NODE_ENV === "development";
  const fetchOptions: RequestInit = {
    headers: { Authorization: apiKey.trim() },
    ...(isDev
      ? { cache: "no-store" as const }
      : { next: { revalidate: 86_400 } }),
  };

  let res: Response;
  try {
    res = await fetch(url.toString(), fetchOptions);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  type SearchJson = {
    photos?: Array<{
      alt?: string;
      url?: string;
      photographer?: string;
      photographer_url?: string;
      src?: { large?: string; large2x?: string; original?: string };
    }>;
  };
  let json: SearchJson;
  try {
    json = (await res.json()) as SearchJson;
  } catch {
    return null;
  }

  const photos = json.photos ?? [];
  const photo = photos[idx] ?? photos[photos.length - 1] ?? photos[0];
  if (!photo?.src) return null;

  const src =
    photo.src.large2x ?? photo.src.large ?? photo.src.original ?? "";
  if (!src) return null;

  return {
    src,
    srcLarge: photo.src.large2x ?? photo.src.large ?? src,
    alt: pickAlt(photo),
    photographer: photo.photographer ?? "Pexels",
    photographerUrl: photo.photographer_url ?? "https://www.pexels.com",
  };
}

/** ID numérico da foto Pexels (o mesmo ficheiro pode vir com query strings diferentes). */
export function pexelsPhotoIdFromUrl(url: string): string | null {
  const m = url.match(/\/photos\/(\d+)\//);
  return m ? m[1]! : null;
}

export function pexelsIsUrlUsed(url: string, used: ReadonlySet<string>): boolean {
  if (used.has(url)) return true;
  const id = pexelsPhotoIdFromUrl(url);
  if (id) return used.has(`id:${id}`);
  return false;
}

export function pexelsMarkUrlUsed(used: Set<string>, url: string): void {
  used.add(url);
  const id = pexelsPhotoIdFromUrl(url);
  if (id) used.add(`id:${id}`);
}

/** Marca um conjunto de URLs (hero, inline, …) com chaves de deduplicação. */
export function pexelsSeedUsedSet(urls: Iterable<string>): Set<string> {
  const s = new Set<string>();
  for (const u of urls) {
    if (u) pexelsMarkUrlUsed(s, u);
  }
  return s;
}

/** Stock distinto face ao que já foi usado na página. */
export function pickPexelsStockFallback(
  seed: string,
  used: ReadonlySet<string>,
): { src: string; alt: string; credit: string } {
  const n = PEXELS_STOCK_POOL.length;
  const start = pexelsDiversifyIndex(seed, n);
  for (let i = 0; i < n; i++) {
    const item = PEXELS_STOCK_POOL[(start + i) % n]!;
    if (!pexelsIsUrlUsed(item.src, used)) return { ...item };
  }
  return { ...PEXELS_STOCK_POOL[start]! };
}

/**
 * Índice estável (0 .. modulo-1) a partir de texto — varia a foto na mesma busca Pexels
 * sem depender de aleatoriedade em runtime.
 */
export function pexelsDiversifyIndex(seed: string, modulo = 10): number {
  let h = 2166136261;
  const s = seed.trim();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, modulo);
}

/**
 * Tenta obter uma foto cujo `src` não esteja em `exclude` (hero/inline/Secções anteriores).
 * Compara por URL e por **ID da foto** Pexels (evita a mesma imagem com parâmetros diferentes).
 * Varia índice e página de forma determinística.
 */
export async function searchPexelsPhotoExcluding(
  base: SearchPexelsParams,
  exclude: ReadonlySet<string>,
  maxAttempts = 10,
): Promise<PexelsPhoto | null> {
  const isExcluded = (url: string) => pexelsIsUrlUsed(url, exclude);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const p = await searchPexelsPhoto({
      ...base,
      resultIndex: (base.resultIndex ?? 0) + attempt,
      page: 1 + Math.floor(attempt / 4),
    });
    if (p?.src && !isExcluded(p.src)) return p;
  }
  for (let page = 2; page <= 5; page++) {
    for (let r = 0; r < 8; r++) {
      const p = await searchPexelsPhoto({
        ...base,
        resultIndex: (base.resultIndex ?? 0) + maxAttempts + r,
        page,
      });
      if (p?.src && !isExcluded(p.src)) return p;
    }
  }
  return null;
}

/** Monta busca em PT/EN a partir do título e opcional keyword SEO. */
export function buildPexelsQuery(titulo: string, focusKeyword: string | null): string {
  const fromKeyword = (focusKeyword ?? "").replace(/\s+/g, " ").trim();
  if (fromKeyword.length >= 3) {
    return `${fromKeyword} business technology`;
  }
  const cleaned = titulo
    .replace(/[^\p{L}\d\s–—-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean).slice(0, 6).join(" ");
  return words ? `${words} business strategy` : "business strategy technology";
}
