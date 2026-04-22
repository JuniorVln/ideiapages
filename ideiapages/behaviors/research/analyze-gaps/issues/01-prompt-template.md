---

## issue: 01-prompt-template
behavior: research/analyze-gaps
fase: fase-0-research-pipeline
status: pending
depends_on: [research/scrape-competitors/04-cli-command, research/classify-terms/03-cli-command]

# Issue 01 — Template de prompt versionado para análise de gaps + briefing SEO

## Objetivo

Criar o prompt v1 que recebe (a) termo + classificação, (b) resumos de N concorrentes, (c) product_facts, e produz um briefing SEO completo em JSON.

## Critérios de aceitação

- Arquivo `references/prompts/analyze-gaps.md` criado com versão `v1`
- Frontmatter: `name`, `version: 1`, `model_recomendado: claude-sonnet`, `temperature: 0.3`, `max_tokens_output: 8000`
- System prompt define persona (estrategista SEO sênior em pt-BR), critérios de Information Gain, regras E-E-A-T, e regras anti-alucinação (proibir features/preços não em product_facts)
- User prompt com placeholders: `{{product_facts}}`, `{{term_data}}` (keyword + intencao + score + cluster), `{{competitor_summaries}}` (lista pré-resumida de até 10 concorrentes)
- Schema JSON do output documentado e completo:
  ```json
  {
    "version": 1,
    "title_seo": "string ≤ 60 chars",
    "meta_description": "string ≤ 155 chars",
    "h1_sugerido": "string",
    "estrutura_h2_h3": [{"h2": "...", "h3s": ["..."]}],
    "topicos_obrigatorios": ["..."],
    "information_gain": {
      "topicos_unicos_que_concorrentes_nao_tem": ["..."],
      "angulo_diferenciado": "string"
    },
    "faq_sugerida": [{"pergunta": "...", "resposta_curta": "..."}],
    "cta_principal": "string",
    "cta_secundario": "string|null",
    "evidencias_externas_sugeridas": [{"tipo": "estatistica|case|cita", "descricao": "..."}],
    "schema_org_recomendados": ["FAQPage", "Article", ...],
    "word_count_alvo": int,
    "tom_de_voz": "string",
    "alertas_para_humano": ["..."]
  }
  ```
- Inclui 2 few-shot examples completos (1 transacional, 1 informacional comparativo)
- Documenta como é gerado o `competitor_summaries` (extractive summarization simples — feito no Python, não pelo LLM, para baratear)

## Notas para o agente

- Path: `references/prompts/analyze-gaps.md`
- Agente especialista: `prompt-engineer`
- Validar mentalmente: rodar com termo "atendimento whatsapp empresa" e 5 concorrentes mockados, checar que o briefing faz sentido
- Custo estimado: R$ 0,30-0,80 por briefing com Sonnet — registrar em `briefings_seo.custo_brl`

## Não fazer aqui

- Implementação Python do summarizer ou analyzer — issues 02 e 03
- CLI command — issue 04

