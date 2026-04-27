/**
 * Atribuição determinística de braço A/B (mesmo visitorId + página → mesma variação).
 * Usado no middleware e nas páginas públicas de conteúdo (fallback).
 */

export type VariacaoArm = {
  id: string;
  nome: string;
  ativa: boolean;
  provider: string;
  peso_trafego: number;
  corpo_mdx: string | null;
};

export type PaginaExperimentContext = {
  id: string;
  status_experimento: string;
  variacao_vencedora_id: string | null;
  variacoes: VariacaoArm[];
};

function hashUnit01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

export function pickVariation(visitorId: string, ctx: PaginaExperimentContext): VariacaoArm {
  const fallback =
    ctx.variacoes.find((v) => v.nome === "controle" && v.ativa) ?? ctx.variacoes[0];

  if (!fallback) {
    throw new Error("pickVariation: nenhuma variação disponível");
  }

  if (ctx.status_experimento === "inativo" || ctx.status_experimento === "encerrado") {
    return fallback;
  }

  if (ctx.status_experimento === "vencedor_declarado" && ctx.variacao_vencedora_id) {
    const w = ctx.variacoes.find((v) => v.id === ctx.variacao_vencedora_id && v.ativa);
    if (w) return w;
  }

  if (ctx.status_experimento !== "ativo") {
    return fallback;
  }

  const arms = ctx.variacoes.filter((v) => v.ativa);
  if (arms.length === 0) return fallback;

  const totalW = arms.reduce((s, v) => s + v.peso_trafego, 0);
  if (totalW <= 0) return fallback;

  const u = hashUnit01(`${visitorId}:${ctx.id}`) * totalW;
  let acc = 0;
  for (const v of arms) {
    acc += v.peso_trafego;
    if (u < acc) return v;
  }
  return arms[arms.length - 1]!;
}

/**
 * Se não houver variações na base, devolve `undefined` (a página usa só `paginas.corpo_mdx`
 * e não chama A/B, métricas por braço nem `pickVariation`).
 */
export function resolveVariacaoId(
  visitorId: string,
  ctx: PaginaExperimentContext,
  cookieVariacaoId: string | undefined
): string | undefined {
  if (ctx.variacoes.length === 0) {
    return undefined;
  }
  if (
    cookieVariacaoId &&
    ctx.variacoes.some((v) => v.id === cookieVariacaoId && v.ativa)
  ) {
    return cookieVariacaoId;
  }
  return pickVariation(visitorId, ctx).id;
}

export function variacaoCookieName(paginaId: string): string {
  return `ideia_ab_${paginaId}`;
}

export const VISITOR_COOKIE = "ideia_vid";
