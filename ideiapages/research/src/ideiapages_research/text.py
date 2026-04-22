"""Normalização de texto compartilhada entre behaviors."""

from __future__ import annotations

import re
import unicodedata


def normalize_keyword(s: str) -> str:
    s = s.strip().lower()
    nk = unicodedata.normalize("NFKD", s)
    ascii_like = "".join(ch for ch in nk if not unicodedata.combining(ch))
    ascii_like = re.sub(r"\s+", " ", ascii_like).strip()
    return ascii_like
