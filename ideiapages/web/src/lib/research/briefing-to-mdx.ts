/**
 * Converte `briefings_seo.briefing_jsonb` (Briefing SEO do analyze-gaps) em Markdown
 * para `paginas.corpo_mdx`. O formato legado (introdução + tópicos {titulo, conteudo})
 * continua suportado.
 */

import { briefingPageTitle } from "./briefing-json";

type LegacyTopico = { titulo: string; conteudo: string };
type LegacyFaq = { pergunta: string; resposta: string };

function isLegacyTopicos(
  t: unknown,
): t is LegacyTopico[] {
  if (!Array.isArray(t) || t.length === 0) return false;
  return t.every(
    (x) =>
      x &&
      typeof x === "object" &&
      "titulo" in (x as object) &&
      "conteudo" in (x as object) &&
      typeof (x as LegacyTopico).titulo === "string" &&
      typeof (x as LegacyTopico).conteudo === "string",
  );
}

function pickStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/** Gera o corpo MDX a partir do JSON do briefing. */
export function briefingJsonToMdx(
  bj: Record<string, unknown>,
  keyword: string,
): string {
  const intro = pickStr(bj.introducao);
  const conclusao = pickStr(bj.conclusao);
  if (isLegacyTopicos(bj.topicos) && bj.topicos.length > 0) {
    const parts: string[] = [];
    if (intro) {
      parts.push(intro, "");
    }
    for (const topico of bj.topicos) {
      parts.push(`## ${topico.titulo}`, "", topico.conteudo, "");
    }
    if (conclusao) {
      parts.push("## Conclusão", "", conclusao, "");
    }
    if (parts.length > 0) {
      return parts.join("\n").trim();
    }
  }

  return briefingSeoToMdx(bj, keyword);
}

/**
 * Estrutura v2 (Pydantic BriefingSEO, analyze-gaps): título = title_seo, corpo
 * baseado em gancho + estrutura H2/H3, gaps, tópicos, PAA, LSI, information_gain.
 * Alinhado à landing: contexto (dor) → oferta (Ideia) → o que a SERP não cobre → prova/SEO.
 */
function briefingSeoToMdx(bj: Record<string, unknown>, keyword: string): string {
  const lines: string[] = [];

  const gancho = pickStr(bj.gancho_vendas);
  const ganchoFraming =
    "No primeiro contato, o visitante procura o mesmo que a palavra-chave sugere. O texto abaixo alinha a sua mensagem a essa intenção.";

  const obrigatorios = Array.isArray(bj.topicos_obrigatorios)
    ? bj.topicos_obrigatorios
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
    : [];

  /** Blocos H2 do briefing: limitados para caber no template da landing (duo + layouts 03–05+). */
  const estruturaRaw = bj.estrutura_h2_h3;
  const estrutura = Array.isArray(estruturaRaw) ? estruturaRaw.slice(0, 8) : [];
  if (estrutura.length > 0) {
    let blockIndex = 0;
    let ganchoColocado = false;
    for (const block of estrutura) {
      if (!block || typeof block !== "object" || !("h2" in block)) continue;
      const h2 = pickStr((block as { h2?: string }).h2);
      if (!h2) continue;
      lines.push("## " + h2, "");
      if (!ganchoColocado && gancho) {
        lines.push(ganchoFraming, "", gancho, "");
        ganchoColocado = true;
      }
      const h3s = (block as { h3s?: string[] }).h3s;
      if (Array.isArray(h3s) && h3s.length > 0) {
        /** 5.º bloco (índice 4) = secção "05" da UI: três cards com **título** — descrição. */
        const isTimelineSection = blockIndex === 4;
        const h3List = h3s
          .map((h3) => (typeof h3 === "string" ? h3.trim() : ""))
          .filter(Boolean);
        const toRender = isTimelineSection ? h3List.slice(0, 3) : h3List;
        for (let ti = 0; ti < toRender.length; ti++) {
          const h3t = toRender[ti]!;
          if (isTimelineSection) {
            const suporte = obrigatorios[ti] ?? obrigatorios[obrigatorios.length - 1] ?? "";
            const extra =
              suporte.length > 0 && suporte.length <= 220
                ? suporte
                : `Análise de como a funcionalidade impacta o contexto de ${keyword}.`;
            lines.push(`- **${h3t}** — ${extra}`);
          } else {
            lines.push("- **" + h3t + "**");
          }
        }
        lines.push("");
      } else {
        lines.push("");
      }
      blockIndex += 1;
    }
  }

  const gaps = pickStr(bj.gaps_conteudo_top3);
  if (gaps) {
    lines.push("## O que os primeiros resultados ainda deixam aquém", "", gaps, "");
  }

  const ig = bj.information_gain;
  if (ig && typeof ig === "object" && "angulo_diferenciado" in (ig as object)) {
    const ang = pickStr((ig as { angulo_diferenciado?: string }).angulo_diferenciado);
    const unicos = (ig as { topicos_unicos_que_concorrentes_nao_tem?: string[] })
      .topicos_unicos_que_concorrentes_nao_tem;
    if (ang || (Array.isArray(unicos) && unicos.length)) {
      lines.push("## Por que vale a pena ir além do básico", "");
      if (ang) {
        lines.push(ang, "");
      }
      if (Array.isArray(unicos) && unicos.length) {
        for (const u of unicos) {
          if (typeof u === "string" && u.trim()) {
            lines.push("- " + u.trim());
          }
        }
        lines.push("");
      }
    }
  }

  if (lines.length > 0) {
    return lines.join("\n").trim();
  }

  // Último recurso: keyword no corpo, sem placeholder genérico
  const tTitle = briefingPageTitle(bj, keyword);
  return [
    "## Sobre o tema: " + keyword,
    "",
    "Desenvolvimento focado em: " + tTitle + ".",
  ].join("\n");
}

/** Metadados de página a partir de BriefingSEO + fallbacks. */
export function pageMetaFromBriefing(
  bj: Record<string, unknown>,
  keyword: string,
): {
  titulo: string;
  subtitulo: string | null;
  meta_title: string;
  meta_description: string | null;
  cta: string;
} {
  const titulo = briefingPageTitle(bj, keyword);
  const metaDesc = pickStr(bj.meta_description);
  const titleSeo = pickStr(bj.title_seo);
  return {
    titulo,
    subtitulo: metaDesc,
    meta_title: titleSeo ?? titulo,
    meta_description: metaDesc,
    cta: pickStr(bj.cta_principal) ?? pickStr(bj.cta) ?? "Falar com especialista",
  };
}

export function faqJsonbFromBriefing(
  bj: Record<string, unknown>,
): { pergunta: string; resposta: string }[] | null {
  const f1 = bj.faq_sugerida;
  if (Array.isArray(f1) && f1.length > 0) {
    const out = f1
      .filter((f) => f && typeof f === "object")
      .map((f) => {
        const p = f as { pergunta?: string; resposta_curta?: string; resposta?: string };
        const pergunta = pickStr(p.pergunta);
        const resposta = pickStr(p.resposta_curta) ?? pickStr(p.resposta);
        if (pergunta && resposta) {
          return { pergunta, resposta };
        }
        return null;
      })
      .filter((x): x is { pergunta: string; resposta: string } => x !== null);
    if (out.length > 0) {
      return out;
    }
  }
  const f2 = bj.faq;
  if (Array.isArray(f2) && f2.length > 0) {
    const out = f2
      .filter((f) => f && typeof f === "object")
      .map((f) => {
        const p = f as LegacyFaq;
        const pergunta = pickStr(p.pergunta);
        const resposta = pickStr(p.resposta);
        if (pergunta && resposta) {
          return { pergunta, resposta };
        }
        return null;
      })
      .filter((x): x is { pergunta: string; resposta: string } => x !== null);
    if (out.length > 0) {
      return out;
    }
  }
  return null;
}
