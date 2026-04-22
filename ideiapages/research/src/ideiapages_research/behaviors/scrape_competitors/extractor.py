"""Extracao estrutural a partir de markdown (headings, FAQ, word count)."""

from __future__ import annotations

import re
from ideiapages_research.types.competitor import ExtractedStructure

_H2 = re.compile(r"^## (?![#])(.+)$", re.MULTILINE)
_H3 = re.compile(r"^### (?![#])(.+)$", re.MULTILINE)
_FAQ_HEADING = re.compile(
    r"(faq|perguntas frequentes|d[uú]vidas comuns|perguntas e respostas)",
    re.IGNORECASE,
)


def _strip_for_wordcount(markdown: str) -> str:
    s = re.sub(r"```[\s\S]*?```", " ", markdown)
    s = re.sub(r"`[^`\n]+`", " ", s)
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", s)
    s = re.sub(r"<img[^>]+>", " ", s, flags=re.IGNORECASE)
    return s


def _word_count(markdown: str) -> int:
    body = _strip_for_wordcount(markdown)
    parts = re.findall(r"[\wÀ-ÿ]+", body, flags=re.UNICODE)
    return len(parts)


def _detect_lang(text: str) -> str | None:
    sample = text.strip()[:3000]
    if len(sample) < 40:
        return None
    try:
        from langdetect import detect

        code = detect(sample)
        return code[:5] if code else None
    except Exception:
        return None


def _tem_faq(markdown: str, h2: list[str], h3: list[str]) -> bool:
    for h in h2 + h3:
        if _FAQ_HEADING.search(h):
            return True
    return bool(_FAQ_HEADING.search(markdown[:8000]))


def extract_structure(markdown: str, url: str | None = None) -> ExtractedStructure:
    """Extrai metadados estruturais para persistir em ``conteudo_concorrente``."""
    _ = url
    h2 = [m.strip() for m in _H2.findall(markdown)]
    h3 = [m.strip() for m in _H3.findall(markdown)]
    wc = _word_count(markdown)
    low = markdown.lower()
    tem_tabela = "|---|" in markdown or "<table" in low
    tem_imagem = bool(re.search(r"!\[[^\]]*\]\(|<img", markdown, re.IGNORECASE))
    idioma = _detect_lang(markdown)
    tem_faq = _tem_faq(markdown, h2, h3)
    thin = wc < 200
    return ExtractedStructure(
        headings_h2=h2,
        headings_h3=h3,
        word_count=wc,
        tem_faq=tem_faq,
        tem_tabela=tem_tabela,
        tem_imagem=tem_imagem,
        idioma_detectado=idioma,
        thin=thin,
    )
