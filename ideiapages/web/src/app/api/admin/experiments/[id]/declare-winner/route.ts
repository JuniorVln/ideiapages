import { getAdminUser } from "@/lib/admin/session";
import { getSupabaseAdminOptional } from "@/lib/supabase/admin";
import { chiSquareHomogeneity, isChiSquareSignificant } from "@/lib/experiments/chi-square";
import { NextRequest, NextResponse } from "next/server";

const MIN_PER_ARM = 50;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdminOptional();
  if (!db) {
    return NextResponse.json(
      { error: "Supabase não configurado (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  const { data: exp } = await db
    .from("experimentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!exp) return NextResponse.json({ error: "Experimento não encontrado" }, { status: 404 });
  if (exp.status !== "ativo") {
    return NextResponse.json({ ok: false, message: "Experimento não está ativo." });
  }

  const { data: variacoes } = await db
    .from("variacoes")
    .select("id, nome, provider")
    .eq("pagina_id", exp.pagina_id!)
    .eq("ativa", true);

  if (!variacoes || variacoes.length < 2) {
    return NextResponse.json({
      ok: false,
      message: "Necessário ao menos 2 variações ativas para comparação.",
    });
  }

  // Agrega métricas
  const { data: metricas } = await db
    .from("metricas_diarias")
    .select("variacao_id, sessoes, leads")
    .eq("pagina_id", exp.pagina_id!);

  const byVar: Record<string, { sessoes: number; leads: number }> = {};
  for (const m of metricas ?? []) {
    const vid = m.variacao_id ?? "";
    if (!byVar[vid]) byVar[vid] = { sessoes: 0, leads: 0 };
    byVar[vid].sessoes += m.sessoes ?? 0;
    byVar[vid].leads += m.leads ?? 0;
  }

  const arms = variacoes
    .map((v) => ({ ...v, ...(byVar[v.id] ?? { sessoes: 0, leads: 0 }) }))
    .filter((v) => v.sessoes >= MIN_PER_ARM);

  if (arms.length < 2) {
    return NextResponse.json({
      ok: false,
      message: `Amostra insuficiente. Precisa de pelo menos ${MIN_PER_ARM} sessões por braço. Máximo encontrado: ${Math.max(...variacoes.map((v) => byVar[v.id]?.sessoes ?? 0))}.`,
    });
  }

  const success = arms.map((a) => a.leads);
  const fail = arms.map((a) => Math.max(0, a.sessoes - a.leads));

  const { chiSq, df } = chiSquareHomogeneity(success, fail);
  const significant = isChiSquareSignificant(chiSq, df);

  // Estima p-value aproximado a partir do chi-square
  const pValue = significant ? Math.max(0.001, 0.05 - (chiSq - 3.841) * 0.005) : 0.1;

  const bestArm = arms.reduce((best, cur) => {
    const curRate = cur.sessoes > 0 ? cur.leads / cur.sessoes : 0;
    const bestRate = best.sessoes > 0 ? best.leads / best.sessoes : 0;
    return curRate > bestRate ? cur : best;
  });

  const baseArm = arms[0]!;
  const baseRate = baseArm.sessoes > 0 ? baseArm.leads / baseArm.sessoes : 0;
  const bestRate = bestArm.sessoes > 0 ? bestArm.leads / bestArm.sessoes : 0;
  const lift = baseRate > 0 ? (bestRate - baseRate) / baseRate : 0;
  const totalSamples = arms.reduce((s, a) => s + a.sessoes, 0);

  if (!significant) {
    return NextResponse.json({
      ok: false,
      message: `Resultado não é estatisticamente significativo (χ²=${chiSq.toFixed(2)}, p≈${pValue.toFixed(3)}). Continue coletando dados.`,
      pValue,
      chiSq,
    });
  }

  // Aplica o vencedor
  await db
    .from("experimentos")
    .update({
      status: "vencedor_declarado",
      encerrado_em: new Date().toISOString(),
      vencedor_variacao_id: bestArm.id,
      p_value: pValue,
      lift,
      amostra_total: totalSamples,
      notas: `Declarado automaticamente via UI. χ²=${chiSq.toFixed(3)}, df=${df}, p≈${pValue.toFixed(4)}`,
    })
    .eq("id", id);

  await db
    .from("paginas")
    .update({
      status_experimento: "vencedor_declarado",
      variacao_vencedora_id: bestArm.id,
    })
    .eq("id", exp.pagina_id!);

  return NextResponse.json({
    ok: true,
    message: `Vencedor declarado: ${bestArm.nome} (${bestArm.provider ?? "?"})`,
    winner: bestArm.nome,
    pValue,
    lift,
    chiSq,
  });
}
