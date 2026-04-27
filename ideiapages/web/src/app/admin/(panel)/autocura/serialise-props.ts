import type { Database } from "@/lib/database.types";

type AutomationRow = Database["public"]["Tables"]["automation_state"]["Row"];
type QueueRowDb = Database["public"]["Tables"]["auto_rewrite_queue"]["Row"];

export type AutocuraStateDto = {
  automations_paused: boolean;
  pause_reason: string | null;
  custo_dia_brl: number;
  custo_max_dia_brl: number;
  custo_dia_referencia: string | null;
};

export type AutocuraQueueRowDto = {
  id: string;
  status: string;
  razao: string;
  prioridade: number;
  criado_em: string;
  paginas: { slug: string; titulo: string } | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toAutocuraStateDto(row: AutomationRow | null): AutocuraStateDto | null {
  if (!row) return null;
  return {
    automations_paused: row.automations_paused,
    pause_reason: row.pause_reason,
    custo_dia_brl: num(row.custo_dia_brl as string | number),
    custo_max_dia_brl: num(row.custo_max_dia_brl as string | number),
    custo_dia_referencia: row.custo_dia_referencia,
  };
}

type QueueWithJoin = QueueRowDb & {
  paginas: { slug: string; titulo: string } | { slug: string; titulo: string }[] | null;
};

function normalisePaginas(
  p: QueueWithJoin["paginas"],
): { slug: string; titulo: string } | null {
  if (p == null) return null;
  if (Array.isArray(p)) {
    const first = p[0];
    if (first && typeof first === "object" && "slug" in first) return first;
    return null;
  }
  return p;
}

export function toAutocuraQueueDtos(
  rows: unknown[] | null | undefined,
): AutocuraQueueRowDto[] {
  if (!rows?.length) return [];
  const out: AutocuraQueueRowDto[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const q = r as QueueWithJoin;
    out.push({
      id: String(q.id),
      status: String(q.status ?? ""),
      razao: String(q.razao ?? ""),
      prioridade: Math.round(num(q.prioridade as string | number)),
      criado_em: String(q.criado_em ?? ""),
      paginas: normalisePaginas(q.paginas),
    });
  }
  return out;
}
