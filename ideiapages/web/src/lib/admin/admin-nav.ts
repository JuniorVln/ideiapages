/** Rotas fixas do painel — usado na sidebar e na página Hub. */
export type AdminNavItem = { href: string; label: string; hint?: string };

/** Rota ativa pertence a este item (ex.: prefixo para sub-rotas). */
export function adminNavItemMatchesPath(itemHref: string, pathname: string): boolean {
  if (pathname === itemHref) return true;
  if (itemHref === "/") return false;
  return pathname.startsWith(`${itemHref}/`);
}

export type AdminNavSection = {
  /** Identificador estável para estado recolhido (sidebar). */
  id?: string;
  title: string;
  items: AdminNavItem[];
  /** Badge no título da seção (ex.: alertas pendentes). Opcional. */
  sectionBadge?: number;
};

/**
 * Nomenclatura alinhada ao menu de produto (leigo + SEO programático).
 * Rotas antigas mantidas; novas páginas onde o rótulo exigia destino próprio.
 */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    id: "research",
    title: "Pesquisa & descoberta",
    items: [
      { href: "/admin/research", label: "Pesquisa" },
      { href: "/admin/research/terms", label: "Palavras-chave" },
      { href: "/admin/research/briefings", label: "Briefing" },
    ],
  },
  {
    id: "pages-ab",
    title: "Páginas & A/B",
    items: [
      { href: "/admin/pages", label: "Todas as páginas" },
      { href: "/admin/pages/new", label: "Gerar página" },
      { href: "/admin/providers", label: "Comparativo de IAs" },
    ],
  },
  {
    id: "intelligence",
    title: "Inteligência",
    items: [
      { href: "/admin/dashboard", label: "Performance" },
      { href: "/admin/autocura", label: "Autocura" },
      { href: "/admin/recommendations", label: "Alertas" },
      { href: "/admin/experiments", label: "Relatório A/B" },
    ],
  },
  {
    id: "leads",
    title: "Leads",
    items: [{ href: "/admin/leads", label: "Contatos capturados" }],
  },
  {
    id: "data-system",
    title: "Dados & sistema",
    items: [
      { href: "/admin/export", label: "Exportar CSV" },
      { href: "/admin/costs", label: "Custos" },
      { href: "/admin/hub", label: "Mapa do painel" },
      { href: "/", label: "Ver site público" },
    ],
  },
];
