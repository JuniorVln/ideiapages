type FirecrawlV2Data = {
  markdown?: string;
  content?: string;
  html?: string;
};

type FirecrawlV2Response = {
  success?: boolean;
  data?: FirecrawlV2Data;
  error?: string;
  message?: string;
};

const MAX_MD = 28_000;

/**
 * Raspagem mínima via API REST (mesma chave do módulo research).
 * @see https://docs.firecrawl.dev/api-reference/endpoint/scrape
 */
export async function scrapeUrlToMarkdown(url: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  const json = (await res.json()) as FirecrawlV2Response;
  if (!res.ok || json.success === false) {
    const msg = json.error || json.message || res.statusText || "Firecrawl falhou";
    throw new Error(typeof msg === "string" ? msg : "Firecrawl falhou");
  }
  const md = json.data?.markdown ?? json.data?.content;
  if (!md || typeof md !== "string" || !md.trim()) {
    throw new Error("Raspagem sem conteúdo legível (markdown vazio).");
  }
  const t = md.trim();
  return t.length > MAX_MD ? `${t.slice(0, MAX_MD)}\n\n[… conteúdo truncado para análise]` : t;
}
