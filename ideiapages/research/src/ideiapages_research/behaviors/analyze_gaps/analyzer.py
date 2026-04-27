"""Analyzer: payload + Claude Sonnet + validação + Supabase."""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, cast
from uuid import UUID

from anthropic import Anthropic, APIStatusError
from pydantic import ValidationError
from supabase import Client
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from ideiapages_research.behaviors.analyze_gaps.summarizer import (
    estimate_summary_tokens,
    summarize_competitors_for_term,
)
from ideiapages_research.behaviors.classify_terms.classifier import (
    load_product_facts,
    load_prompt_bundle,
)
from ideiapages_research.behaviors.scrape_competitors.scraper import (
    load_serp_group_latest_termo,
)
from ideiapages_research.llm.claude import get_claude
from ideiapages_research.settings import PROJECT_ROOT, Settings, get_settings
from ideiapages_research.types.briefing import BriefingSEO, CompetitorSummary


def _summaries_when_no_serp_data(keyword: str) -> list[CompetitorSummary]:
    """Último recurso: sem linhas em serp_snapshots — ainda assim gera briefing com Claude."""
    k = keyword.strip()[:240] or "keyword"
    return [
        CompetitorSummary(
            url="https://invalid.invalid/no-serp-data",
            titulo="Sem snapshot SERP no banco",
            posicao=1,
            word_count=0,
            headings_h2=[],
            headings_h3=[],
            trecho_inicio=(
                "Não há serp_snapshots para este termo (rode collect-serp quando possível). "
                f"Keyword: {k}. Produza briefing completo usando product_facts, term_data e schema."
            )[:520],
            tem_faq=False,
            tem_tabela=False,
        )
    ]

BEHAVIOR = "research/analyze-gaps"
PROMPT_REL = Path("references") / "prompts" / "analyze-gaps.md"
CONTENT_QUALITY_REL = Path("references") / "prompts" / "content-quality-and-briefing.md"
BRIEFINGS_DIR = PROJECT_ROOT / "research" / "data" / "briefings"


def _load_content_quality_append() -> str:
    """Regras partilhadas com generate-page (factualidade, MDX, briefing)."""
    p = PROJECT_ROOT / CONTENT_QUALITY_REL
    if not p.is_file():
        return ""
    return "\n\n---\n\n" + p.read_text(encoding="utf-8")


@dataclass
class AnalyzeGapsReport:
    termo_id: UUID
    ok: bool
    skipped_cache: bool
    briefing: BriefingSEO | None
    cost_brl: float
    error: str | None
    json_retries: int
    suspicious_price_alerts: list[str]


def load_serp_extras_json_for_prompt(sb: Client, termo_id: UUID) -> str:
    """PAA, buscas relacionadas e featured snippet do último snapshot SERP (Apify)."""
    rows = load_serp_group_latest_termo(sb, termo_id)
    if not rows:
        return json.dumps(
            {
                "people_also_ask": [],
                "related_searches": [],
                "featured_snippet": None,
                "nota": "Sem serp_snapshots — rode collect-serp antes.",
            },
            ensure_ascii=False,
            indent=2,
        )
    r0 = cast(dict[str, Any], rows[0])
    raw = r0.get("raw_jsonb")
    ex: dict[str, Any] = {}
    if isinstance(raw, dict):
        ex = cast(dict[str, Any], raw.get("extras_head") or {})
    out = {
        "people_also_ask": ex.get("people_also_ask") or [],
        "related_searches": ex.get("related_searches") or [],
        "featured_snippet": ex.get("featured_snippet"),
    }
    s = json.dumps(out, ensure_ascii=False, indent=2)
    if len(s) > 16_000:
        return s[:16_000] + "\n…(truncado)"
    return s


def load_seo_rules(path: Path | None = None) -> str:
    p = path or (PROJECT_ROOT / "references" / "seo_rules.md")
    if not p.is_file():
        raise FileNotFoundError(f"seo_rules não encontrado: {p}")
    return p.read_text(encoding="utf-8")


def _extract_json_object(text: str) -> str:
    """Extrai o primeiro objeto JSON de uma resposta (markdown ou texto puro)."""
    t = text.strip()
    
    # 1. Tenta extrair de blocos de código markdown
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", t, re.IGNORECASE)
    if fence_match:
        t = fence_match.group(1).strip()
    
    # 2. Se ainda não for um JSON puro, procura pelo primeiro '{' e último '}'
    if not t.startswith("{"):
        i = t.find("{")
        j = t.rfind("}")
        if i != -1 and j != -1 and j > i:
            t = t[i : j + 1]
            
    # 3. Remove comentários simples e de bloco (comuns em alucinações de IA)
    t = re.sub(r"/\*[\s\S]*?\*/|(?<!:)//.*", "", t)
    
    return t.strip()


def _estimate_cost_brl_sonnet(
    *,
    input_tokens: int,
    output_tokens: int,
    settings: Settings,
) -> float:
    tin = input_tokens / 1_000_000.0 * settings.claude_sonnet_input_usd_per_mtok
    tout = output_tokens / 1_000_000.0 * settings.claude_sonnet_output_usd_per_mtok
    return round((tin + tout) * settings.usd_to_brl, 4)


def _allowed_price_fragments(facts: str) -> set[str]:
    allowed: set[str] = set()
    for m in re.finditer(r"R\$\s*[\d.,]+", facts):
        allowed.add(m.group(0).replace(" ", "").lower())
    for m in re.finditer(r"\d+[.,]\d{2}", facts):
        allowed.add(m.group(0))
    allowed.update(
        {
            "a confirmar",
            "sob consulta",
            "consulte o site",
            "consulte",
        }
    )
    return allowed


def _scan_price_hallucinations(briefing: BriefingSEO, facts: str) -> list[str]:
    frag = _allowed_price_fragments(facts)
    blobs: list[str] = [
        briefing.title_seo,
        briefing.meta_description,
        briefing.h1_sugerido,
        briefing.cta_principal,
        briefing.cta_secundario or "",
        briefing.information_gain.angulo_diferenciado,
        briefing.tom_de_voz,
    ]
    for t in briefing.topicos_obrigatorios:
        blobs.append(t)
    for t in briefing.information_gain.topicos_unicos_que_concorrentes_nao_tem:
        blobs.append(t)
    blobs.append(briefing.gancho_vendas)
    blobs.append(briefing.gaps_conteudo_top3)
    for kw in briefing.keywords_semanticas_lsi:
        blobs.append(kw)
    for f in briefing.faq_sugerida:
        blobs.append(f.pergunta)
        blobs.append(f.resposta_curta)

    alerts: list[str] = []
    for blob in blobs:
        low = blob.lower()
        if "r$" not in low and "reais" not in low:
            continue
        for m in re.finditer(r"R\$\s*[\d.,]+", blob, re.IGNORECASE):
            token = m.group(0).replace(" ", "").lower()
            if not any(
                token in a or a in token for a in frag if a.startswith("r$")
            ) and re.search(r"\d", token):
                alerts.append(f"Preço possivelmente fora de product_facts: {m.group(0)!r}")
    return alerts


def _avg_word_count_top3(summaries: list[CompetitorSummary]) -> float:
    if not summaries:
        return 0.0
    top = sorted(summaries, key=lambda s: s.posicao)[:3]
    if not top:
        return 0.0
    return sum(s.word_count for s in top) / len(top)


def _apply_wordcount_sanity(
    briefing: BriefingSEO,
    summaries: list[CompetitorSummary],
) -> BriefingSEO:
    avg = _avg_word_count_top3(summaries)
    if avg <= 0:
        return briefing
    lo = avg * 1.05
    hi = avg * 3.05
    wc = briefing.word_count_alvo
    alerts = list(briefing.alertas_para_humano)
    if wc < lo or wc > hi:
        alerts.append(
            f"word_count_alvo ({wc}) fora da faixa sugerida pela amostra "
            f"(média top3 ≈ {avg:.0f} palavras; esperado entre {lo:.0f} e {hi:.0f})."
        )
        return briefing.model_copy(update={"alertas_para_humano": alerts})
    return briefing


def _should_retry_anthropic(exc: BaseException) -> bool:
    if isinstance(exc, APIStatusError):
        return exc.status_code in (429, 500, 502, 503, 529)
    return False


@retry(
    retry=retry_if_exception(_should_retry_anthropic),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=2, max=60),
    reraise=True,
)
def _call_claude(
    client: Anthropic,
    *,
    model: str,
    system: str,
    user: str,
    max_tokens: int,
    temperature: float,
) -> tuple[str, int, int, int]:
    t0 = time.perf_counter()
    msg = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    latency_ms = int((time.perf_counter() - t0) * 1000)
    text = ""
    for block in msg.content:
        if block.type == "text":
            text += block.text
    usage = msg.usage
    return text, usage.input_tokens, usage.output_tokens, latency_ms


def _persist_llm_log(
    sb: Client,
    *,
    termo_id: UUID | None,
    model: str,
    prompt_version: int,
    tin: int,
    tout: int,
    cost_brl: float,
    latency_ms: int,
    payload: dict[str, Any],
) -> None:
    sb.table("llm_calls_log").insert(
        {
            "behavior": BEHAVIOR,
            "purpose": "analyze_gaps_for_term",
            "model": model,
            "prompt_version": prompt_version,
            "tokens_input": tin,
            "tokens_output": tout,
            "custo_brl": cost_brl,
            "latencia_ms": latency_ms,
            "termo_id": str(termo_id) if termo_id else None,
            "payload_resumido_jsonb": payload,
        }
    ).execute()


def _recent_briefing_blocks(
    sb: Client,
    termo_id: UUID,
    *,
    prompt_version: int,
    cache_days: int,
) -> bool:
    cutoff = datetime.now(UTC) - timedelta(days=cache_days)
    r = (
        sb.table("briefings_seo")
        .select("criado_em,prompt_version")
        .eq("termo_id", str(termo_id))
        .eq("prompt_version", prompt_version)
        .order("criado_em", desc=True)
        .limit(1)
        .execute()
    )
    if not r.data:
        return False
    row = cast(dict[str, Any], r.data[0])
    raw = row.get("criado_em")
    if not raw or not isinstance(raw, str):
        return False
    ts = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    return ts.astimezone(UTC) >= cutoff


def _mark_falha_briefing(sb: Client, termo_id: UUID, motivo: str) -> None:
    tr = sb.table("termos").select("metadata").eq("id", str(termo_id)).limit(1).execute()
    meta: dict[str, Any] = {}
    if tr.data:
        meta = dict(cast(dict[str, Any], tr.data[0]).get("metadata") or {})
    meta["falha_briefing"] = True
    meta["falha_briefing_motivo"] = motivo[:2000]
    sb.table("termos").update({"metadata": meta}).eq("id", str(termo_id)).execute()


def _clear_falha_briefing(sb: Client, termo_id: UUID) -> None:
    tr = sb.table("termos").select("metadata").eq("id", str(termo_id)).limit(1).execute()
    if not tr.data:
        return
    meta = dict(cast(dict[str, Any], tr.data[0]).get("metadata") or {})
    meta.pop("falha_briefing", None)
    meta.pop("falha_briefing_motivo", None)
    sb.table("termos").update({"metadata": meta}).eq("id", str(termo_id)).execute()


def _log_metricas_parse_error(sb: Client, termo_id: UUID, err: str) -> None:
    sb.table("metricas_coleta").insert(
        {
            "behavior": BEHAVIOR,
            "comecou_em": datetime.now(UTC).isoformat(),
            "terminou_em": datetime.now(UTC).isoformat(),
            "items_processados": 1,
            "items_sucesso": 0,
            "items_falha": 1,
            "custo_brl": None,
            "log_jsonb": {"termo_id": str(termo_id), "erro_validacao": err[:8000]},
        }
    ).execute()


def briefing_to_markdown(b: BriefingSEO, *, keyword: str) -> str:
    """Markdown legível para revisão humana."""
    lines = [
        f"# Briefing SEO — {keyword}",
        "",
        f"**Title:** {b.title_seo}",
        f"**Meta:** {b.meta_description}",
        f"**H1:** {b.h1_sugerido}",
        f"**Word count alvo:** {b.word_count_alvo}",
        f"**Tom:** {b.tom_de_voz}",
        "",
        "## Estrutura sugerida",
        "",
    ]
    for block in b.estrutura_h2_h3:
        lines.append(f"### {block.h2}")
        for h in block.h3s:
            lines.append(f"- {h}")
        lines.append("")
    lines.extend(
        [
            "## Gancho de vendas (1º parágrafo)",
            "",
            b.gancho_vendas,
            "",
            "## Gaps vs top 3 da SERP",
            "",
            b.gaps_conteudo_top3,
            "",
            "## Keywords semânticas (LSI)",
            "",
            *([f"- {t}" for t in b.keywords_semanticas_lsi] or ["- (nenhuma)"]),
            "",
            "## Perguntas tipo PAA",
            "",
            *([f"- {t}" for t in b.perguntas_tipo_paa] or ["- (nenhuma)"]),
            "",
            "## Tópicos obrigatórios",
            "",
            *[f"- {t}" for t in b.topicos_obrigatorios],
            "",
            "## Information gain",
            "",
            f"**Ângulo:** {b.information_gain.angulo_diferenciado}",
            "",
            *[f"- {t}" for t in b.information_gain.topicos_unicos_que_concorrentes_nao_tem],
            "",
            "## FAQ sugerida",
            "",
        ]
    )
    for f in b.faq_sugerida:
        lines.extend([f"### {f.pergunta}", "", f"{f.resposta_curta}", ""])
    lines.extend(
        [
            "## CTAs",
            "",
            f"- Principal: {b.cta_principal}",
            f"- Secundário: {b.cta_secundario or '—'}",
            "",
            "## Alertas",
            "",
        ]
    )
    alert_lines = [f"- {a}" for a in b.alertas_para_humano] or ["- (nenhum)"]
    lines.extend([*alert_lines, ""])
    return "\n".join(lines)


def fetch_term_rows_scraped(sb: Client, *, limit: int) -> list[dict[str, Any]]:
    r = (
        sb.table("termos")
        .select("id,keyword,status,intencao,score_conversao,cluster,tipo_pagina_recomendado")
        .eq("status", "scraped")
        .order("updated_at", desc=False)
        .limit(limit)
        .execute()
    )
    return [cast(dict[str, Any], x) for x in (r.data or [])]


def analyze_gaps_for_term(
    sb: Client,
    termo_id: UUID,
    *,
    keyword: str,
    intencao: str | None,
    score_conversao: int | None,
    cluster: str | None,
    tipo_pagina: str | None,
    prompt_version: int | None = None,
    top_n: int = 10,
    dry_run: bool = False,
    force: bool = False,
    settings: Settings | None = None,
) -> AnalyzeGapsReport:
    settings = settings or get_settings()
    bundle = load_prompt_bundle(
        PROJECT_ROOT / PROMPT_REL,
        prompt_version=prompt_version,
    )
    product_facts = load_product_facts()
    seo_rules = load_seo_rules()

    if (
        sb
        and not dry_run
        and not force
        and _recent_briefing_blocks(
            sb,
            termo_id,
            prompt_version=bundle.version,
            cache_days=settings.analyze_gaps_cache_days,
        )
    ):
        return AnalyzeGapsReport(
            termo_id=termo_id,
            ok=True,
            skipped_cache=True,
            briefing=None,
            cost_brl=0.0,
            error=None,
            json_retries=0,
            suspicious_price_alerts=[],
        )

    summaries = summarize_competitors_for_term(sb, termo_id, top_n=top_n)
    if not summaries:
        summaries = _summaries_when_no_serp_data(keyword)

    tok_est = estimate_summary_tokens(summaries)
    if tok_est > 30_000:
        # Não aborta: operador pode reduzir --top-n; apenas sinaliza no log.
        pass

    term_payload = {
        "keyword": keyword,
        "intencao": intencao,
        "score_conversao": score_conversao,
        "cluster": cluster,
        "tipo_pagina_recomendado": tipo_pagina,
    }
    summaries_json = json.dumps(
        [s.model_dump() for s in summaries],
        ensure_ascii=False,
        indent=2,
    )
    serp_extras_json = load_serp_extras_json_for_prompt(sb, termo_id)
    user = (
        bundle.user_template.replace("{{product_facts}}", product_facts)
        .replace("{{seo_rules}}", seo_rules[:12_000])
        .replace("{{term_data}}", json.dumps(term_payload, ensure_ascii=False, indent=2))
        .replace("{{competitor_summaries}}", summaries_json)
        .replace("{{serp_extras}}", serp_extras_json)
    )

    client = get_claude()
    model = settings.analyze_gaps_model
    max_tokens = min(settings.analyze_gaps_max_tokens, bundle.max_tokens_output)
    temperature = settings.analyze_gaps_temperature

    retries = 0
    last_err: str | None = None
    raw_text = ""
    tin = tout = 0
    latency_ms = 0

    for attempt in range(2):
        retries = attempt
        extra = (
            "\n\nSua resposta anterior não foi um JSON válido. Devolva **apenas** um objeto JSON "
            "que obedeça ao schema (sem markdown, sem texto extra)."
            if attempt > 0
            else ""
        )
        try:
            raw_text, tin, tout, latency_ms = _call_claude(
                client,
                model=model,
                system=bundle.system + _load_content_quality_append(),
                user=user + extra,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            briefing = BriefingSEO.model_validate_json(_extract_json_object(raw_text))
        except (json.JSONDecodeError, ValidationError, ValueError) as e:
            last_err = str(e)
            continue
        briefing = _apply_wordcount_sanity(briefing, summaries)
        sus = _scan_price_hallucinations(briefing, product_facts)
        for s in sus:
            if s not in briefing.alertas_para_humano:
                briefing = briefing.model_copy(
                    update={"alertas_para_humano": [*briefing.alertas_para_humano, s]}
                )

        cost = _estimate_cost_brl_sonnet(
            input_tokens=tin, output_tokens=tout, settings=settings
        )

        if sb and not dry_run:
            _persist_llm_log(
                sb,
                termo_id=termo_id,
                model=model,
                prompt_version=bundle.version,
                tin=tin,
                tout=tout,
                cost_brl=cost,
                latency_ms=latency_ms,
                payload={
                    "keyword": keyword,
                    "competitors_n": len(summaries),
                    "summary_tokens_est": tok_est,
                    "json_attempts": attempt + 1,
                    "suspicious_prices_n": len(sus),
                },
            )
            payload = briefing.model_dump()
            sb.table("briefings_seo").insert(
                {
                    "termo_id": str(termo_id),
                    "prompt_version": bundle.version,
                    "model": model,
                    "briefing_jsonb": payload,
                    "custo_brl": cost,
                }
            ).execute()
            _clear_falha_briefing(sb, termo_id)
            sb.table("termos").update({"status": "briefing_pronto"}).eq(
                "id", str(termo_id)
            ).execute()
            BRIEFINGS_DIR.mkdir(parents=True, exist_ok=True)
            (BRIEFINGS_DIR / f"{termo_id}.md").write_text(
                briefing_to_markdown(briefing, keyword=keyword),
                encoding="utf-8",
            )

        return AnalyzeGapsReport(
            termo_id=termo_id,
            ok=True,
            skipped_cache=False,
            briefing=briefing,
            cost_brl=cost,
            error=None,
            json_retries=retries,
            suspicious_price_alerts=sus,
        )

    err_final = last_err or "JSON inválido após retentativas"
    cost_fail = _estimate_cost_brl_sonnet(
        input_tokens=tin, output_tokens=tout, settings=settings
    )
    if sb and not dry_run:
        _persist_llm_log(
            sb,
            termo_id=termo_id,
            model=model,
            prompt_version=bundle.version,
            tin=tin,
            tout=tout,
            cost_brl=cost_fail,
            latency_ms=latency_ms,
            payload={
                "keyword": keyword,
                "parse_error": err_final[:2000],
                "json_attempts": retries + 1,
            },
        )
        _mark_falha_briefing(sb, termo_id, err_final)
        _log_metricas_parse_error(sb, termo_id, err_final)

    return AnalyzeGapsReport(
        termo_id=termo_id,
        ok=False,
        skipped_cache=False,
        briefing=None,
        cost_brl=cost_fail,
        error=err_final,
        json_retries=retries,
        suspicious_price_alerts=[],
    )
