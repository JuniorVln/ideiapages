"""Relatório markdown Fase 0 (snapshot Supabase + custos opcionais)."""

from __future__ import annotations

import contextlib
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, cast

from supabase import Client

from ideiapages_research.settings import PROJECT_ROOT


def _fetch_all_statuses(sb: Client) -> list[str]:
    out: list[str] = []
    page = 0
    page_size = 1000
    while True:
        start = page * page_size
        end = start + page_size - 1
        r = (
            sb.table("termos")
            .select("status")
            .range(start, end)
            .execute()
        )
        chunk = r.data or []
        if not chunk:
            break
        for row in chunk:
            out.append(str(cast(dict[str, Any], row).get("status") or ""))
        if len(chunk) < page_size:
            break
        page += 1
    return out


def _intent_distribution(sb: Client) -> Counter[str]:
    c: Counter[str] = Counter()
    page = 0
    page_size = 1000
    while True:
        start = page * page_size
        end = start + page_size - 1
        r = (
            sb.table("termos")
            .select("intencao")
            .range(start, end)
            .execute()
        )
        chunk = r.data or []
        if not chunk:
            break
        for row in chunk:
            inv = cast(dict[str, Any], row).get("intencao")
            if inv:
                c[str(inv)] += 1
        if len(chunk) < page_size:
            break
        page += 1
    return c


def _score_histogram(sb: Client) -> Counter[int]:
    c: Counter[int] = Counter()
    page = 0
    page_size = 1000
    while True:
        start = page * page_size
        end = start + page_size - 1
        r = (
            sb.table("termos")
            .select("score_conversao")
            .range(start, end)
            .execute()
        )
        chunk = r.data or []
        if not chunk:
            break
        for row in chunk:
            sc = cast(dict[str, Any], row).get("score_conversao")
            if sc is not None:
                with contextlib.suppress(TypeError, ValueError):
                    c[int(sc)] += 1
        if len(chunk) < page_size:
            break
        page += 1
    return c


def _top_terms(sb: Client, *, n: int = 10) -> list[dict[str, Any]]:
    r = (
        sb.table("termos")
        .select("keyword,intencao,score_conversao,cluster,status")
        .gte("score_conversao", 1)
        .order("score_conversao", desc=True)
        .limit(n)
        .execute()
    )
    return [cast(dict[str, Any], x) for x in (r.data or [])]


def _briefing_sample(sb: Client, *, n: int = 5) -> list[dict[str, Any]]:
    r = (
        sb.table("briefings_seo")
        .select("termo_id,criado_em,custo_brl,prompt_version")
        .order("criado_em", desc=True)
        .limit(n)
        .execute()
    )
    return [cast(dict[str, Any], x) for x in (r.data or [])]


def write_fase_zero_report(
    sb: Client,
    *,
    cost_breakdown: dict[str, float] | None = None,
    pipeline_notes: list[str] | None = None,
) -> Path:
    """Gera ``research/data/relatorios/fase-0-<ts>.md`` e retorna o path."""
    rel_dir = PROJECT_ROOT / "research" / "data" / "relatorios"
    rel_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    path = rel_dir / f"fase-0-{ts}.md"

    statuses = _fetch_all_statuses(sb)
    st_counts = Counter(s for s in statuses if s)
    total_termos = len(statuses)
    intents = _intent_distribution(sb)
    scores = _score_histogram(sb)
    top = _top_terms(sb, n=10)
    briefs = _briefing_sample(sb, n=5)

    lines = [
        "# Relatório Fase 0 — Research Pipeline",
        "",
        f"- **Gerado em:** {datetime.now(UTC).isoformat()}",
        f"- **Total de termos (linhas):** {total_termos}",
        "",
        "## Termos por status",
        "",
    ]
    for k in sorted(st_counts.keys()):
        lines.append(f"- `{k}`: {st_counts[k]}")
    lines.extend(["", "## Intenção (termos classificados)", ""])
    if not intents:
        lines.append("- (nenhum com `intencao` preenchida)")
    else:
        for k, v in intents.most_common():
            lines.append(f"- `{k}`: {v}")
    lines.extend(["", "## Distribuição de score_conversao", ""])
    if not scores:
        lines.append("- (nenhum score)")
    else:
        for s in sorted(scores.keys()):
            lines.append(f"- **{s}:** {scores[s]}")

    lines.extend(["", "## Top 10 por score_conversao", ""])
    for i, row in enumerate(top, 1):
        lines.append(
            f"{i}. **{row.get('keyword')}** — score {row.get('score_conversao')}, "
            f"intent `{row.get('intencao')}`, status `{row.get('status')}`"
        )

    lines.extend(["", "## Últimos briefings (amostra)", ""])
    if not briefs:
        lines.append("- (nenhum registro em `briefings_seo`)")
    else:
        for b in briefs:
            lines.append(
                f"- termo `{b.get('termo_id')}` — v{b.get('prompt_version')}, "
                f"custo R$ {b.get('custo_brl')}, em {b.get('criado_em')}"
            )

    lines.extend(["", "## Custo desta execução do pipeline (estimativas internas)", ""])
    if cost_breakdown:
        total = sum(cost_breakdown.values())
        for k, v in sorted(cost_breakdown.items()):
            lines.append(f"- **{k}:** R$ {v:.4f}")
        lines.append(f"- **Total aproximado:** R$ {total:.4f}")
    else:
        lines.append("- (não informado — rode `run-pipeline` ou preencha manualmente)")

    if pipeline_notes:
        lines.extend(["", "## Notas", ""])
        for n in pipeline_notes:
            lines.append(f"- {n}")

    from ideiapages_research.behaviors.pipeline.status import (
        fetch_fase_zero_metrics,
        metrics_to_report_lines,
        suggest_fase_zero_steps,
    )

    m = fetch_fase_zero_metrics(sb)
    steps = suggest_fase_zero_steps(m)
    lines.extend(["", *metrics_to_report_lines(m, steps)])

    lines.extend(
        [
            "",
            "## Próximos passos (Fase 1)",
            "",
            "- Auditar briefings acionáveis no Supabase",
            "- Selecionar 20–50 termos para virar páginas piloto",
            "",
        ]
    )

    path.write_text("\n".join(lines), encoding="utf-8")
    return path
