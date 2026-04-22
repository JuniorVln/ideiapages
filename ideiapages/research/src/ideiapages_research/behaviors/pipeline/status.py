"""Métricas e sugestões de CLI para fechar a Fase 0 (sem custo de API)."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from supabase import Client

from ideiapages_research.behaviors.pipeline.report import _fetch_all_statuses


def _exact_count_termos(
    sb: Client,
    *,
    status: str | None = None,
    intencao_is_null: bool = False,
) -> int:
    q = sb.table("termos").select("id", count="exact")
    if status is not None:
        q = q.eq("status", status)
    if intencao_is_null:
        q = q.is_("intencao", "null")
    r = q.limit(1).execute()
    c = getattr(r, "count", None)
    if c is not None:
        return int(c)
    return len(r.data or [])


def _exact_count_briefings(sb: Client) -> int:
    r = sb.table("briefings_seo").select("id", count="exact").limit(1).execute()
    c = getattr(r, "count", None)
    if c is not None:
        return int(c)
    return len(r.data or [])


@dataclass(frozen=True)
class FaseZeroMetrics:
    total_termos: int
    by_status: dict[str, int]
    pending_classify: int
    briefings_seo_total: int
    briefing_pronto: int


def fetch_fase_zero_metrics(sb: Client) -> FaseZeroMetrics:
    """Snapshot leve do funil (contagens)."""
    st = Counter(s for s in _fetch_all_statuses(sb) if s)
    pending = _exact_count_termos(sb, status="coletado", intencao_is_null=True)
    br_total = _exact_count_briefings(sb)
    bp = int(st.get("briefing_pronto", 0))
    return FaseZeroMetrics(
        total_termos=sum(st.values()),
        by_status=dict(st),
        pending_classify=pending,
        briefings_seo_total=br_total,
        briefing_pronto=bp,
    )


@dataclass(frozen=True)
class SuggestedStep:
    title: str
    command: str
    note: str


def suggest_fase_zero_steps(m: FaseZeroMetrics) -> list[SuggestedStep]:
    """Passos sugeridos na ordem do funil (ajuste conforme seu estado no Supabase)."""
    st = m.by_status
    out: list[SuggestedStep] = []

    if m.pending_classify > 0:
        out.append(
            SuggestedStep(
                title="Classificar termos",
                command="uv run ideiapages-research classify-terms --batch-size 50 --yes",
                note=f"{m.pending_classify} linha(s) em coletado sem intencao",
            )
        )

    analisado = int(st.get("analisado", 0))
    priorizado = int(st.get("priorizado", 0))
    if analisado > 0 and priorizado == 0:
        out.append(
            SuggestedStep(
                title="Priorizar para SERP",
                command="uv run ideiapages-research prioritize-terms --limit 50",
                note="Opcional: --dry-run primeiro; depois rode collect-serp abaixo",
            )
        )

    if priorizado > 0 or analisado > 0:
        serp_cmd = (
            "uv run ideiapages-research collect-serp --all-priorizados "
            "--limit 30 --top-n 10 --yes"
        )
        serp_note = f"priorizado={priorizado}, analisado={analisado}"
        if priorizado == 0 and analisado > 0:
            serp_cmd += " --include-analisado"
            serp_note += " (inclui analisado até priorizar de fato)"
        out.append(
            SuggestedStep(
                title="Snapshot SERP",
                command=serp_cmd,
                note=serp_note,
            )
        )

    if int(st.get("snapshot_serp_ok", 0)) > 0:
        out.append(
            SuggestedStep(
                title="Raspar concorrentes",
                command=(
                    "uv run ideiapages-research scrape-competitors --all-pending "
                    "--limit 30 --top-n 10 --yes"
                ),
                note=f"{st.get('snapshot_serp_ok', 0)} termo(s) com SERP aguardando scrape",
            )
        )

    if int(st.get("scraped", 0)) > 0:
        out.append(
            SuggestedStep(
                title="Briefings (analyze-gaps)",
                command=(
                    "uv run ideiapages-research analyze-gaps --all-scraped "
                    "--limit 30 --top-n 10 --yes"
                ),
                note=f"{st.get('scraped', 0)} termo(s) scraped; custo Sonnet",
            )
        )

    out.append(
        SuggestedStep(
            title="Relatório markdown",
            command="uv run ideiapages-research report",
            note="Gera research/data/relatorios/fase-0-*.md",
        )
    )

    meta = 20
    if m.briefing_pronto >= meta:
        out.append(
            SuggestedStep(
                title="Fase 0 — critério de entrega",
                command="(revisão humana — sem comando)",
                note=f"{m.briefing_pronto} termo(s) briefing_pronto (meta ≥ {meta})",
            )
        )
    else:
        out.append(
            SuggestedStep(
                title="Fase 0 — falta para meta",
                command="uv run ideiapages-research fase-0-status",
                note=f"{m.briefing_pronto}/{meta} briefings prontos; rode status após analyze-gaps",
            )
        )

    return out


def metrics_to_report_lines(m: FaseZeroMetrics, steps: list[SuggestedStep]) -> list[str]:
    """Bloco markdown para anexar ao relatório."""
    lines = [
        "## Fechamento Fase 0 (automático)",
        "",
        f"- **Termos no banco:** {m.total_termos}",
        f"- **Coletados sem classificar:** {m.pending_classify}",
        f"- **Registros em briefings_seo:** {m.briefings_seo_total}",
        f"- **Termos `briefing_pronto`:** {m.briefing_pronto}",
        "",
        "### Próximos comandos sugeridos",
        "",
    ]
    for i, s in enumerate(steps, 1):
        lines.append(f"{i}. **{s.title}** — _{s.note}_")
        lines.append("   ```bash")
        lines.append(f"   {s.command}")
        lines.append("   ```")
        lines.append("")
    return lines
