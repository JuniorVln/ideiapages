export type AutoridadeSnapshot = {
  dominio: string;
  data: string;
  rank_decimal: number | null;
};

export type AutoridadeSerie = {
  /** Linhas prontas pro gráfico: { label, [dominio]: valor }. */
  chartRows: ({ label: string } & Record<string, string | number | null>)[];
  /** Domínios presentes, com o nosso sempre em primeiro. */
  dominios: string[];
  /** Último valor do nosso domínio (null se nunca coletado). */
  atual: number | null;
  /** Valor do nosso domínio ~30 dias antes do último ponto. */
  anterior: number | null;
  /** Data do último ponto (YYYY-MM-DD). */
  ultimaData: string | null;
};

function ymdMinusDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

function labelBr(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

/**
 * Monta a série histórica de autoridade. `siteDominio` fica em primeiro lugar
 * (é o que o Victor acompanha); os demais entram como comparação.
 */
export function buildAutoridadeSerie(
  rows: AutoridadeSnapshot[],
  siteDominio: string,
): AutoridadeSerie {
  if (rows.length === 0) {
    return { chartRows: [], dominios: [], atual: null, anterior: null, ultimaData: null };
  }

  const datas = [...new Set(rows.map((r) => r.data))].sort();
  const outros = [...new Set(rows.map((r) => r.dominio))]
    .filter((d) => d !== siteDominio)
    .sort();
  const dominios = rows.some((r) => r.dominio === siteDominio)
    ? [siteDominio, ...outros]
    : outros;

  const porChave = new Map<string, number | null>();
  for (const r of rows) porChave.set(`${r.dominio}\t${r.data}`, r.rank_decimal);

  const chartRows = datas.map((data) => {
    const row: { label: string } & Record<string, string | number | null> = { label: labelBr(data) };
    for (const d of dominios) row[d] = porChave.get(`${d}\t${data}`) ?? null;
    return row;
  });

  const ultimaData = datas[datas.length - 1] ?? null;
  const atual = ultimaData ? porChave.get(`${siteDominio}\t${ultimaData}`) ?? null : null;

  let anterior: number | null = null;
  if (ultimaData) {
    const alvo = ymdMinusDays(ultimaData, 30);
    // ponto mais recente até 30 dias antes do último
    for (const data of datas) {
      if (data > alvo) break;
      const v = porChave.get(`${siteDominio}\t${data}`);
      if (v != null) anterior = v;
    }
  }

  return { chartRows, dominios, atual, anterior, ultimaData };
}
