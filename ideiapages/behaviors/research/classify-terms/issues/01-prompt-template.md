---
issue: 01-prompt-template
behavior: research/classify-terms
fase: fase-0-research-pipeline
status: pending
depends_on: [research/data-model/05-shared-triggers-rls-types]
---

# Issue 01 — Template de prompt versionado para classificação

## Objetivo
Criar o primeiro template de prompt para classificação de termos, seguindo as regras de `references/prompts_engineering.md`. Esse template será consumido pelo classifier (issue 02).

## Critérios de aceitação
- [ ] Arquivo `references/prompts/classify-terms.md` criado com versão `v1`
- [ ] Frontmatter YAML: `name`, `version: 1`, `model_recomendado: claude-haiku`, `temperature: 0.2`, `max_tokens_output: 4000`
- [ ] System prompt define persona (analista SEO especializado em pt-BR), schema JSON exato esperado, e regras anti-alucinação (proibir mencionar features/preços não presentes em `product_facts.md`)
- [ ] User prompt template tem placeholders: `{{product_facts}}`, `{{keywords_batch}}`
- [ ] Schema JSON do output documentado:
  ```json
  {
    "classifications": [
      {
        "keyword": "...",
        "intencao": "informacional|transacional|comparativa|navegacional",
        "score_conversao": 1-10,
        "tipo_pagina_recomendado": "landing|blog|comparison|faq|guide",
        "cluster": "...",
        "justificativa": "..."
      }
    ]
  }
  ```
- [ ] Inclui 3 few-shot examples (1 transacional fundo-funil, 1 informacional topo-funil, 1 navegacional concorrente)
- [ ] Nota sobre limite de 50 keywords por batch (input) para garantir qualidade do output

## Notas para o agente
- Path exato: `references/prompts/classify-terms.md` (a pasta `references/prompts/` já existe)
- Agente especialista responsável: `prompt-engineer`
- Validar empiricamente: rodar mentalmente com 5 keywords de exemplo do `seeds/ideia_chat.json` e confirmar que o output esperado faz sentido
- Documentar no template: como bumpar versão (v2, v3) sem quebrar consumidores

## Não fazer aqui
- Implementação do classifier Python — issue 02
- Lógica de validação do JSON retornado — issue 02
- Custo / tokens estimados — issue 02 calcula em runtime
