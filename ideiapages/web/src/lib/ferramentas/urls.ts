/**
 * As ferramentas-isca moram no domínio do Pages, não no site principal
 * (www.ideiamultichat.com.br), que é outro sistema e devolve 404 nesta rota.
 *
 * Uma fonte só para as canônicas das páginas e para o sitemap — foi a divergência
 * entre os dois que colocou URL de 404 no sitemap em 11/09/2026.
 */

export const FERRAMENTAS_BASE_URL = "https://pages.ideiabusiness.com.br";

export const FERRAMENTAS = {
  linkWhatsapp: "/ferramentas/gerador-de-link-do-whatsapp-gratis",
  mensagensAutomaticas: "/ferramentas/gerador-de-mensagens-automaticas-whatsapp-gratis",
} as const;

export function urlFerramenta(rota: (typeof FERRAMENTAS)[keyof typeof FERRAMENTAS]): string {
  return `${FERRAMENTAS_BASE_URL}${rota}`;
}
