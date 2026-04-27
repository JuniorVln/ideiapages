/**
 * Combina score de conversão (1–10) e volume estimado de busca.
 * Índice: score × (1 + ln(1+volume)) — com volume 0, mantém o peso do score (não zera).
 */

const SCORE_ALTO = 7;
const VOL_ALTO = 1_000;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Mesma fórmula que `ideiapages_research/behaviors/pipeline/runner.py` (priorização). */
export function potencialBusca(
  scoreConversao: number | null | undefined,
  volumeEstimado: number | null | undefined,
): number | null {
  const s = num(scoreConversao);
  if (s == null) return null;
  const v = num(volumeEstimado);
  const vol = v != null && v > 0 ? v : 0;
  return s * (1 + Math.log1p(vol));
}

export function potencialBuscaFormatado(
  scoreConversao: number | null | undefined,
  volumeEstimado: number | null | undefined,
): string {
  const p = potencialBusca(scoreConversao, volumeEstimado);
  if (p == null) return "—";
  return p >= 10 ? p.toFixed(0) : p.toFixed(1);
}

export type OportunidadeResumo = {
  label: string;
  /** Fórmula: score×ln(1+vol) ou só score se volume inexistente */
  indice: number | null;
  indiceTexto: string;
  descricao: string;
  badgeClass: string;
};

/**
 * Rótulo qualitativo (eixo score vs volume), útil em tabelas e cartões.
 * Limites: volume "alto" a partir de ~1k/mês (ajustável se necessário).
 */
export function oportunidadeResumo(
  scoreConversao: number | null | undefined,
  volumeEstimado: number | null | undefined,
): OportunidadeResumo {
  const s = num(scoreConversao);
  const v = num(volumeEstimado);
  const indice = potencialBusca(scoreConversao, volumeEstimado);
  const indiceTexto = indice == null ? "—" : potencialBuscaFormatado(scoreConversao, volumeEstimado);

  if (s == null) {
    return {
      label: "Sem score",
      indice,
      indiceTexto,
      descricao: "Ainda sem classificação; priorize com score antes de comparar com volume.",
      badgeClass: "bg-slate-800/80 text-slate-400 border-slate-600",
    };
  }

  const altoScore = s >= SCORE_ALTO;
  const altoVol = v != null && v >= VOL_ALTO;
  const semVol = v == null;

  let label: string;
  let descricao: string;
  let badgeClass: string;

  if (altoScore && altoVol) {
    label = "Alto potencial";
    descricao = `Score ≥${SCORE_ALTO} e volume ≥${VOL_ALTO.toLocaleString("pt-BR")}/mês: prioridade típica de conteúdo.`;
    badgeClass = "bg-emerald-500/15 text-emerald-200 border-emerald-500/40";
  } else if (altoScore && !altoVol) {
    label = "Nicho / conversão";
    descricao = `Score alto; volume abaixo de ${VOL_ALTO.toLocaleString("pt-BR")} ou ausente — bom para conversão com tráfego menor.`;
    badgeClass = "bg-sky-500/15 text-sky-200 border-sky-500/35";
  } else if (!altoScore && altoVol) {
    label = "Tráfego bruto";
    descricao = `Volume ≥${VOL_ALTO.toLocaleString("pt-BR")} com score abaixo de ${SCORE_ALTO}: validar intenção e fit antes de escalar.`;
    badgeClass = "bg-amber-500/15 text-amber-200 border-amber-500/35";
  } else {
    label = "Explorar";
    descricao =
      semVol && s < SCORE_ALTO
        ? "Sem volume ou score ainda fraco: coletar dados ou reclassificar."
        : "Combinação moderada: segmentar ou testar em campanha/briefing.";
    badgeClass = "bg-slate-700/50 text-slate-400 border-slate-600";
  }

  return { label, indice, indiceTexto, descricao, badgeClass };
}
