/** Marca pública Ideia Multichat / Ideia Chat (páginas de conteúdo e landing) */

const home = (process.env.NEXT_PUBLIC_IDEIA_HOME_URL ?? "https://ideiamultichat.com.br/").replace(
  /\/?$/,
  "/",
);

function absUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  try {
    return new URL(p, home).href;
  } catch {
    return `${home.replace(/\/$/, "")}${p}`;
  }
}

const waDigits = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5551995232447").replace(/\D/g, "");

export const IDEIA = {
  logoUrl:
    process.env.NEXT_PUBLIC_IDEIA_LOGO_URL ??
    "https://ideiamultichat.com.br/wp-content/uploads/2025/10/ideiachat-logo.png",
  logoAlt: "Ideia Chat",
  homeUrl: home,
  cnpj: process.env.NEXT_PUBLIC_IDEIA_CNPJ ?? "",
  address: process.env.NEXT_PUBLIC_IDEIA_ADDRESS ?? "",
  privacyUrl:
    process.env.NEXT_PUBLIC_IDEIA_PRIVACY_URL ??
    "https://ideiamultichat.com.br/politica-de-privacidade/",
  instagramUrl:
    process.env.NEXT_PUBLIC_IDEIA_INSTAGRAM_URL ?? "https://www.instagram.com/ideiachat/",
  /** Link público WhatsApp (site / footer) */
  whatsappPublicUrl:
    process.env.NEXT_PUBLIC_IDEIA_WHATSAPP_PUBLIC_URL ?? `https://wa.me/${waDigits}`,
  footerPhoneDisplay: process.env.NEXT_PUBLIC_IDEIA_PHONE_DISPLAY ?? "(51) 99523-2447",
  footerPhoneTel:
    process.env.NEXT_PUBLIC_IDEIA_PHONE_TEL ?? "tel:+5551995232447",
  footerHours:
    process.env.NEXT_PUBLIC_IDEIA_BUSINESS_HOURS ??
    "De segunda a sexta, das 08h12 às 18h00",
  footerServiceArea:
    process.env.NEXT_PUBLIC_IDEIA_SERVICE_AREA ?? "Atendemos todo o Brasil",
  footerBlurb:
    process.env.NEXT_PUBLIC_IDEIA_FOOTER_BLURB ??
    "Imagine todos os seus canais em um só lugar: WhatsApp, Instagram, Facebook e muito mais, chega de perder vendas por causa de atendimentos desorganizados.",
  /** Links “Acesso rápido” (paths relativos ao site principal) */
  footerQuickLinks: [
    { label: "Início", href: absUrl("/") },
    { label: "Sobre Nós", href: absUrl("/sobre-nos/") },
    { label: "Diferenciais", href: absUrl("/diferenciais/") },
    { label: "Funcionalidades", href: absUrl("/funcionalidades/") },
    { label: "Contato", href: absUrl("/contato/") },
  ] as const,
} as const;
