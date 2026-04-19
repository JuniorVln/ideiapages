# Prompts Engineering — IDeiaPages

> Padrões para prompts enviados a Claude/GPT/Gemini. Lido por `prompt-engineer`.

---

## Princípios

1. **Output JSON sempre que possível** — facilita parsing e validação.
2. **Schema explícito** — informar estrutura esperada no prompt.
3. **Few-shot quando possível** — 1-2 exemplos curtos elevam qualidade.
4. **Temperatura baixa para fatos** (0.2-0.4), alta para criatividade (0.7-0.9).
5. **System prompt versionado** — alterações ficam em git.

---

## Estrutura padrão de prompt

```
SYSTEM:
Você é um especialista em [domínio] para o produto Ideia Chat.
Seu output será [JSON | Markdown | etc].
Não invente fatos. Use apenas as informações fornecidas.
Se faltar informação, marque o campo como null.

USER:
[Contexto: dados do produto, termo-alvo, intent, etc.]

[Tarefa específica clara]

[Schema esperado]

[Restrições]
```

---

## Templates por behavior

### `classify-terms` (Script 5 — Python)

```
SYSTEM:
Você é especialista em SEO programático.
Vai receber lista de keywords e classificar cada uma.
Output: JSON array, um objeto por keyword.

Schema por item:
{
  "keyword": string,
  "intencao": "informacional" | "transacional" | "comparativa" | "navegacional",
  "score_conversao": int (1-10),
  "tipo_pagina_recomendado": "landing" | "blog" | "comparison" | "faq" | "guide",
  "cluster": string (tema agrupador),
  "justificativa": string (1 frase)
}

Critérios para score_conversao:
- 9-10: termo de fundo de funil, comprador ativo (ex: "comprar X", "preço Y")
- 7-8: avaliação ativa (ex: "X vs Y", "melhor X")
- 5-6: problema definido (ex: "como resolver Z")
- 3-4: pesquisa exploratória (ex: "o que é W")
- 1-2: navegacional ou irrelevante

USER:
Produto: Ideia Chat (SaaS de atendimento WhatsApp multi-atendentes)
Público: empresas, escritórios contábeis
Keywords:
[lista]
```

Modelo recomendado: **Claude Haiku** (rápido, barato, bom para classificação).

### `generate-page` (Fase 2 — Web)

Template em `references/prompts/landing-page.md`, `blog-post.md`, etc. Cada um:

- System prompt com persona + restrições
- Variáveis: `{{termo}}`, `{{tipo}}`, `{{intent}}`, `{{produto_facts}}`, `{{competitors_summary}}`
- Output JSON estruturado:

```json
{
  "h1": "...",
  "subtitle": "...",
  "meta_description": "...",
  "sections": [
    { "h2": "...", "body_markdown": "...", "cta": "..." }
  ],
  "faq": [
    { "question": "...", "answer": "..." }
  ],
  "cta_primary": "...",
  "cta_secondary": "..."
}
```

Modelo recomendado: **Claude Sonnet** (Variação A — preciso), **GPT-4o** (Variação B — criativo), **Gemini Pro** (Variação C — atual).

### `quality-gate` (Fase 2)

Não é um prompt LLM — é validação programática. Mas se precisarmos de revisão semântica:

```
SYSTEM:
Você é revisor de conteúdo SEO.
Receberá um JSON de página e dirá se passa nos critérios.

USER:
Critérios:
[lista de regras de seo_rules.md - Quality Gate]

Página:
[JSON]

Output:
{
  "passou": boolean,
  "score": int (0-100),
  "problemas": [string],
  "sugestoes": [string]
}
```

Modelo recomendado: **Claude Sonnet** (raciocínio + factualidade).

---

## Anti-alucinação

- Sempre injetar `references/product_facts.md` como contexto quando o prompt envolver fatos do Ideia Chat.
- Forçar o LLM a citar a fonte: "Para cada afirmação sobre planos/preços, cite o nome do plano exato em `product_facts.md`".
- Validar output: se o LLM mencionou um plano que não existe, rejeitar.

---

## Versionamento de prompts

Cada template em `references/prompts/<nome>.md` tem header:

```yaml
---
behavior: generation/claude-generator
version: 1
last_updated: 2026-04-16
model: claude-sonnet-4
temperature: 0.4
max_tokens: 4096
---
```

Ao alterar prompt, **incrementar version** e documentar mudança no commit. Variações antigas ficam no git history.
