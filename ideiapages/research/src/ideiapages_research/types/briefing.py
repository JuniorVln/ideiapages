"""Schema do briefing SEO (analyze-gaps)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

EvidenceTipo = Literal["estatistica", "case", "cita"]


class H2Block(BaseModel):
    """Um bloco H2 com sub-H3."""

    model_config = ConfigDict(extra="forbid")

    h2: str = Field(..., min_length=1, max_length=300)
    h3s: list[str] = Field(default_factory=list)


class FAQItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pergunta: str = Field(..., min_length=1, max_length=500)
    resposta_curta: str = Field(..., min_length=1, max_length=800)


class EvidenciaExterna(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo: EvidenceTipo
    descricao: str = Field(..., min_length=1, max_length=600)


class InformationGainBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topicos_unicos_que_concorrentes_nao_tem: list[str] = Field(default_factory=list)
    angulo_diferenciado: str = Field(..., min_length=1, max_length=1200)


class BriefingSEO(BaseModel):
    """JSON raiz exigido do modelo (v1). Campos LSI/PAA/gancho: enriquecimento v2 do prompt."""

    model_config = ConfigDict(extra="forbid")

    version: Literal[1] = 1
    title_seo: str = Field(..., min_length=1, max_length=60)
    meta_description: str = Field(..., min_length=1, max_length=155)
    h1_sugerido: str = Field(..., min_length=1, max_length=200)
    estrutura_h2_h3: list[H2Block] = Field(..., min_length=1)
    topicos_obrigatorios: list[str] = Field(..., min_length=1)
    information_gain: InformationGainBlock
    faq_sugerida: list[FAQItem] = Field(default_factory=list)
    cta_principal: str = Field(..., min_length=1, max_length=400)
    cta_secundario: str | None = Field(default=None, max_length=400)
    evidencias_externas_sugeridas: list[EvidenciaExterna] = Field(default_factory=list)
    schema_org_recomendados: list[str] = Field(default_factory=list)
    word_count_alvo: int = Field(..., ge=300, le=50_000)
    tom_de_voz: str = Field(..., min_length=1, max_length=400)
    alertas_para_humano: list[str] = Field(default_factory=list)
    # —— SEO/GEO: termos semânticos, PAA, gancho comercial (não texto genérico de enciclopédia)
    keywords_semanticas_lsi: list[str] = Field(
        default_factory=list,
        description="8–25 termos/n-grams do nicho; incluir jargão que aparece nos concorrentes.",
    )
    perguntas_tipo_paa: list[str] = Field(
        default_factory=list,
        description="Perguntas estilo PAA/People Also Ask a cobrir (mesmo que inventadas, "
        "devem soar como dúvidas reais de compra).",
    )
    gancho_vendas: str = Field(
        ...,
        min_length=40,
        max_length=700,
        description="1º parágrafo: intenção de busca + por que Ideia Chat (fatos de product_facts).",
    )
    gaps_conteudo_top3: str = Field(
        ...,
        min_length=20,
        max_length=1500,
        description="O que os 3 primeiros resultados não explicam bem ou deixam superficial.",
    )

    @field_validator("title_seo", "meta_description", "h1_sugerido", mode="before")
    @classmethod
    def strip_and_cap_titles_meta_h1(cls, v: str, info: ValidationInfo) -> str:
        """O LLM por vezes excede 60/155/200 chars; truncar em vez de falhar a pipeline."""
        if not isinstance(v, str):
            return v
        s = v.strip()
        limits = {"title_seo": 60, "meta_description": 155, "h1_sugerido": 200}
        n = limits.get(str(info.field_name), 9_999)
        if len(s) > n:
            s = s[:n]
        return s

    @field_validator("gancho_vendas", mode="before")
    @classmethod
    def cap_gancho_vendas(cls, v: str) -> str:
        if not isinstance(v, str):
            return v
        s = v.strip()
        if len(s) > 700:
            s = s[:700]
        return s

    @field_validator("keywords_semanticas_lsi", mode="after")
    @classmethod
    def min_lsi_count(cls, v: list[str]) -> list[str]:
        out = [x.strip() for x in v if isinstance(x, str) and x.strip()]
        if len(out) < 8:
            raise ValueError("keywords_semanticas_lsi: forneça ao menos 8 termos semânticos.")
        return out[:40]

    @field_validator("perguntas_tipo_paa", mode="after")
    @classmethod
    def min_paa_count(cls, v: list[str]) -> list[str]:
        out = [x.strip() for x in v if isinstance(x, str) and x.strip()]
        if len(out) < 4:
            raise ValueError("perguntas_tipo_paa: forneça ao menos 4 perguntas.")
        return out[:35]


class CompetitorContent(BaseModel):
    """Entrada do summarizer (SERP + conteúdo raspado)."""

    model_config = ConfigDict(extra="forbid")

    url: str
    titulo: str | None = None
    posicao: int = Field(..., ge=1, le=50)
    markdown: str
    word_count: int = Field(..., ge=0)
    headings_h2: list[str] = Field(default_factory=list)
    headings_h3: list[str] = Field(default_factory=list)
    tem_faq: bool = False
    tem_tabela: bool = False
    thin: bool = False
    paywalled: bool = False


class CompetitorSummary(BaseModel):
    """Resumo extrativo enviado ao LLM."""

    model_config = ConfigDict(extra="forbid")

    url: str
    titulo: str | None = None
    posicao: int
    word_count: int
    headings_h2: list[str] = Field(default_factory=list)
    headings_h3: list[str] = Field(default_factory=list)
    trecho_inicio: str = Field(..., max_length=520)
    tem_faq: bool = False
    tem_tabela: bool = False
