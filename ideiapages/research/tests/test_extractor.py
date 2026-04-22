"""Testes do extrator de markdown (scrape-competitors)."""

from __future__ import annotations

from ideiapages_research.behaviors.scrape_competitors.extractor import extract_structure


def test_artigo_bom_tem_h2_h3_e_wordcount() -> None:
    body = " ".join(["conteudo"] * 220)
    md = f"""## Introducao
{body}

### Detalhe
Mais conteudo repetido para ultrapassar o limiar de thin.

## Perguntas frequentes
Algo aqui.
"""
    s = extract_structure(md)
    assert "Introducao" in s.headings_h2
    assert "Detalhe" in s.headings_h3
    assert s.tem_faq is True
    assert s.word_count >= 200
    assert s.thin is False


def test_detecta_faq_por_heading() -> None:
    md = "## FAQ\nAlguma coisa.\n"
    assert extract_structure(md).tem_faq is True


def test_pagina_thin() -> None:
    md = "## X\n" + " ".join(["p"] * 30)
    s = extract_structure(md)
    assert s.thin is True


def test_pagina_inglesa() -> None:
    md = "\n".join(
        [
            "## Overview",
            " ".join(
                [
                    "The",
                    "quick",
                    "brown",
                    "fox",
                    "jumps",
                    "over",
                    "the",
                    "lazy",
                    "dog",
                ]
                * 15
            ),
        ]
    )
    s = extract_structure(md)
    assert s.idioma_detectado in ("en", "unknown", None) or s.idioma_detectado.startswith("en")


def test_paywall_curto_com_padroes() -> None:
    md = "Subscribe now to read the full article."
    s = extract_structure(md)
    assert s.thin is True
    assert s.word_count < 50


def test_tabela_e_imagem() -> None:
    md = """## T
| a | b |
|---|---|
| 1 | 2 |

![](x.png)
"""
    s = extract_structure(md)
    assert s.tem_tabela is True
    assert s.tem_imagem is True
