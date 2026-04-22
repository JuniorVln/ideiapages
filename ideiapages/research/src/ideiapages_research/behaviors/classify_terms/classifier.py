"""Classify-terms: prompt versionado, Claude Haiku, Supabase."""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from anthropic import Anthropic, APIStatusError
from pydantic import ValidationError
from supabase import Client
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from ideiapages_research.llm.claude import get_claude
from ideiapages_research.settings import PROJECT_ROOT, Settings, get_settings
from ideiapages_research.types.term import (
    ClassifyBatchResult,
    ClassifyLLMResponse,
    TermClassification,
)

BEHAVIOR = "research/classify-terms"
PROMPT_REL = Path("references") / "prompts" / "classify-terms.md"


@dataclass(frozen=True)
class PromptBundle:
    """Prompt carregado do markdown versionado."""

    version: int
    model_hint: str
    temperature: float
    max_tokens_output: int
    system: str
    user_template: str


def load_product_facts(path: Path | None = None) -> str:
    """Lê ``references/product_facts.md``."""
    p = path or (PROJECT_ROOT / "references" / "product_facts.md")
    if not p.is_file():
        raise FileNotFoundError(f"product_facts não encontrado: {p}")
    return p.read_text(encoding="utf-8")


def _parse_simple_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---\n", 3)
    if end == -1:
        return {}, raw
    block = raw[3:end]
    body = raw[end + 5 :].lstrip("\n")
    meta: dict[str, Any] = {}
    for line in block.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, _, rest = line.partition(":")
        key, rest = key.strip(), rest.strip()
        if key == "version":
            meta[key] = int(rest)
        elif key in ("temperature",):
            meta[key] = float(rest)
        elif key in ("max_tokens_output",):
            meta[key] = int(rest)
        else:
            meta[key] = rest
    return meta, body


def _split_system_user(body: str) -> tuple[str, str]:
    m_sys = re.search(r"^## System\s*\n(.*?)(?=^## User\s*$)", body, re.MULTILINE | re.DOTALL)
    m_user = re.search(r"^## User\s*\n(.*)", body, re.MULTILINE | re.DOTALL)
    if not m_sys or not m_user:
        raise ValueError("Prompt precisa das seções '## System' e '## User'.")
    return m_sys.group(1).strip(), m_user.group(1).strip()


def load_prompt_bundle(
    path: Path | None = None,
    *,
    prompt_version: int | None = None,
) -> PromptBundle:
    p = path or (PROJECT_ROOT / PROMPT_REL)
    raw = p.read_text(encoding="utf-8")
    meta, body = _parse_simple_frontmatter(raw)
    system, user_tpl = _split_system_user(body)
    ver = int(meta.get("version", 1))
    if prompt_version is not None and ver != prompt_version:
        raise ValueError(
            f"Versão do prompt em disco ({ver}) ≠ --prompt-version ({prompt_version})."
        )
    return PromptBundle(
        version=ver,
        model_hint=str(meta.get("model_recomendado", "")),
        temperature=float(meta.get("temperature", 0.2)),
        max_tokens_output=int(meta.get("max_tokens_output", 4000)),
        system=system,
        user_template=user_tpl,
    )


def _extract_json_object(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    t = t.strip()
    if not t.startswith("{"):
        i = t.find("{")
        j = t.rfind("}")
        if i != -1 and j != -1 and j > i:
            t = t[i : j + 1]
    return t


def _estimate_cost_brl(
    *,
    input_tokens: int,
    output_tokens: int,
    settings: Settings,
) -> float:
    tin = input_tokens / 1_000_000.0 * settings.claude_haiku_input_usd_per_mtok
    tout = output_tokens / 1_000_000.0 * settings.claude_haiku_output_usd_per_mtok
    return round((tin + tout) * settings.usd_to_brl, 4)


def _allowed_price_fragments(facts: str) -> set[str]:
    """Heurística: trechos numéricos citáveis a partir do markdown de fatos."""
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


def _justificativa_suspeita(justificativa: str, facts: str) -> bool:
    low = justificativa.lower()
    if "r$" not in low and "reais" not in low and "real " not in low:
        return False
    frag = _allowed_price_fragments(facts)
    for m in re.finditer(r"R\$\s*[\d.,]+", justificativa, re.IGNORECASE):
        token = m.group(0).replace(" ", "").lower()
        if not any(
            token in a or a in token for a in frag if a.startswith("r$")
        ) and re.search(r"\d", token):
            return True
    return False


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


def fetch_terms_for_classify(
    sb: Client,
    *,
    reclassify: bool,
    limit: int,
) -> list[dict[str, Any]]:
    q = sb.table("termos").select("id,keyword,metadata,intencao,status")
    if reclassify:
        q = q.in_("status", ["coletado", "analisado"])
    else:
        q = q.eq("status", "coletado").is_("intencao", "null")
    r = q.order("created_at", desc=False).limit(limit).execute()
    return cast(list[dict[str, Any]], list(r.data or []))


def classify_batch(
    rows: list[dict[str, Any]],
    *,
    product_facts: str,
    bundle: PromptBundle,
    dry_run: bool,
    sb: Client | None,
    settings: Settings | None = None,
    batch_index: int = 0,
) -> ClassifyBatchResult:
    """Uma chamada Claude + validação + persistência (opcional)."""
    settings = settings or get_settings()
    if not rows:
        return ClassifyBatchResult(
            batch_index=batch_index,
            processed=0,
            succeeded=0,
            failed=0,
            cost_brl=0.0,
        )

    keywords_payload = [str(r["keyword"]) for r in rows]
    user = bundle.user_template.replace("{{product_facts}}", product_facts).replace(
        "{{keywords_batch}}",
        json.dumps(keywords_payload, ensure_ascii=False, indent=2),
    )

    client = get_claude()
    model = settings.classify_model
    max_tokens = min(settings.classify_max_tokens, bundle.max_tokens_output)
    temperature = settings.classify_temperature

    raw_text, tin, tout, latency_ms = _call_claude(
        client,
        model=model,
        system=bundle.system,
        user=user,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    cost = _estimate_cost_brl(input_tokens=tin, output_tokens=tout, settings=settings)

    errors: list[str] = []
    try:
        parsed = ClassifyLLMResponse.model_validate_json(_extract_json_object(raw_text))
    except (json.JSONDecodeError, ValidationError) as e:
        err = f"JSON inválido do modelo: {e}"
        errors.append(err)
        if sb and not dry_run:
            _persist_llm_log(
                sb,
                model=model,
                prompt_version=bundle.version,
                tin=tin,
                tout=tout,
                cost_brl=cost,
                latency_ms=latency_ms,
                payload={
                    "batch_index": batch_index,
                    "parse_error": str(e),
                    "keywords": keywords_payload[:10],
                },
            )
            for r in rows:
                _mark_failure(sb, r, err)
        return ClassifyBatchResult(
            batch_index=batch_index,
            processed=len(rows),
            succeeded=0,
            failed=len(rows),
            cost_brl=cost,
            errors=errors,
        )

    by_kw: dict[str, TermClassification] = {c.keyword: c for c in parsed.classifications}
    if len(by_kw) != len(parsed.classifications):
        err = "keywords duplicadas na resposta do modelo"
        errors.append(err)
        if sb and not dry_run:
            _persist_llm_log(
                sb,
                model=model,
                prompt_version=bundle.version,
                tin=tin,
                tout=tout,
                cost_brl=cost,
                latency_ms=latency_ms,
                payload={
                    "batch_index": batch_index,
                    "duplicate_keywords_in_response": True,
                    "keywords": keywords_payload[:10],
                },
            )
            for r in rows:
                _mark_failure(sb, r, err)
        return ClassifyBatchResult(
            batch_index=batch_index,
            processed=len(rows),
            succeeded=0,
            failed=len(rows),
            cost_brl=cost,
            errors=errors,
        )

    score_hist: dict[int, int] = {}
    cluster_top: dict[str, int] = {}
    ok = 0
    fail = 0

    updates_success: list[tuple[dict[str, Any], TermClassification, bool]] = []

    for r in rows:
        kw = str(r["keyword"])
        c = by_kw.get(kw)
        if c is None:
            fail += 1
            msg = f"keyword ausente na resposta: {kw!r}"
            errors.append(msg)
            if sb and not dry_run:
                _mark_failure(sb, r, msg)
            continue
        suspeita = _justificativa_suspeita(c.justificativa, product_facts)
        updates_success.append((r, c, suspeita))
        ok += 1
        score_hist[c.score_conversao] = score_hist.get(c.score_conversao, 0) + 1
        cluster_top[c.cluster] = cluster_top.get(c.cluster, 0) + 1

    if sb and not dry_run:
        _persist_llm_log(
            sb,
            model=model,
            prompt_version=bundle.version,
            tin=tin,
            tout=tout,
            cost_brl=cost,
            latency_ms=latency_ms,
            payload={
                "batch_index": batch_index,
                "keywords_n": len(rows),
                "succeeded": ok,
                "failed": fail,
                "errors_head": errors[:5],
            },
        )
        for row, c, suspeita in updates_success:
            meta = dict(row.get("metadata") or {})
            meta.pop("falha_classificacao", None)
            meta.pop("falha_classificacao_motivo", None)
            if suspeita:
                meta["justificativa_suspeita"] = True
            else:
                meta.pop("justificativa_suspeita", None)
            sb.table("termos").update(
                {
                    "intencao": c.intencao.value,
                    "score_conversao": c.score_conversao,
                    "tipo_pagina_recomendado": c.tipo_pagina_recomendado.value,
                    "cluster": c.cluster,
                    "justificativa": c.justificativa,
                    "status": "analisado",
                    "metadata": meta,
                }
            ).eq("id", str(row["id"])).execute()

    return ClassifyBatchResult(
        batch_index=batch_index,
        processed=len(rows),
        succeeded=ok,
        failed=fail,
        cost_brl=cost,
        score_histogram=score_hist,
        cluster_top=cluster_top,
        errors=errors,
    )


def _mark_failure(sb: Client, row: dict[str, Any], motivo: str) -> None:
    meta = dict(row.get("metadata") or {})
    meta["falha_classificacao"] = True
    meta["falha_classificacao_motivo"] = motivo[:2000]
    sb.table("termos").update({"metadata": meta}).eq("id", str(row["id"])).execute()


def _persist_llm_log(
    sb: Client,
    *,
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
            "purpose": "classify_batch",
            "model": model,
            "prompt_version": prompt_version,
            "tokens_input": tin,
            "tokens_output": tout,
            "custo_brl": cost_brl,
            "latencia_ms": latency_ms,
            "termo_id": None,
            "payload_resumido_jsonb": payload,
        }
    ).execute()
