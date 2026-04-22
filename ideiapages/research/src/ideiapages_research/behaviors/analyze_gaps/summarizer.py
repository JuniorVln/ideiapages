"""Resumo extrativo de concorrentes (sem LLM)."""

from __future__ import annotations

import json
import re
from typing import Any, cast
from uuid import UUID

from supabase import Client

from ideiapages_research.behaviors.scrape_competitors.scraper import load_serp_group_latest_termo
from ideiapages_research.types.briefing import CompetitorContent, CompetitorSummary

_CODE_BLOCK = re.compile(r"```.*?```", re.DOTALL)
_IMG = re.compile(r"!\[[^\]]*]\([^)]+\)")


def _strip_for_snippet(md: str) -> str:
    t = _CODE_BLOCK.sub(" ", md)
    t = _IMG.sub(" ", t)
    t = re.sub(r"[#>*_`]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def summarize_competitor(content: CompetitorContent) -> CompetitorSummary:
    """Comprime um concorrente para o prompt principal."""
    flat = _strip_for_snippet(content.markdown)
    trecho = flat[:500] if flat else ""
    h3 = content.headings_h3[:20]
    return CompetitorSummary(
        url=content.url,
        titulo=content.titulo,
        posicao=content.posicao,
        word_count=content.word_count,
        headings_h2=list(content.headings_h2),
        headings_h3=h3,
        trecho_inicio=trecho,
        tem_faq=content.tem_faq,
        tem_tabela=content.tem_tabela,
    )


def estimate_summary_tokens(summaries: list[CompetitorSummary]) -> int:
    """Heurística barata: ~4 chars/token."""
    raw = json.dumps([s.model_dump() for s in summaries], ensure_ascii=False)
    return max(1, len(raw) // 4)


def summarize_competitors_for_term(
    sb: Client,
    termo_id: UUID,
    *,
    top_n: int = 10,
) -> list[CompetitorSummary]:
    """SERP mais recente + ``conteudo_concorrente``; ignora thin/paywall."""
    serp_rows = load_serp_group_latest_termo(sb, termo_id)
    if not serp_rows:
        return []

    out: list[CompetitorSummary] = []
    for row in serp_rows:
        if len(out) >= top_n:
            break
        sid = str(row["id"])
        url = str(row["url"])
        r = (
            sb.table("conteudo_concorrente")
            .select("*")
            .eq("snapshot_id", sid)
            .eq("url", url)
            .limit(1)
            .execute()
        )
        if not r.data:
            continue
        c = cast(dict[str, Any], r.data[0])
        thin = bool(c.get("thin"))
        paywalled = bool(c.get("paywalled"))
        if thin or paywalled:
            continue

        h2 = [str(x) for x in (c.get("headings_h2") or []) if x]
        h3 = [str(x) for x in (c.get("headings_h3") or []) if x]
        content = CompetitorContent(
            url=url,
            titulo=(str(row["titulo"]) if row.get("titulo") else None),
            posicao=int(row.get("posicao") or 0),
            markdown=str(c.get("markdown") or ""),
            word_count=int(c.get("word_count") or 0),
            headings_h2=h2,
            headings_h3=h3,
            tem_faq=bool(c.get("tem_faq")),
            tem_tabela=bool(c.get("tem_tabela")),
            thin=thin,
            paywalled=paywalled,
        )
        out.append(summarize_competitor(content))
    return out
