# Qualidade editorial, factualidade e formatação (Ideia Chat)

Este bloco é **concatenado automaticamente** aos prompts `generate-page.*.md` na rota de geração e deve ser respeitado pelo **redator de página**. O estrategista de **briefing** (`analyze-gaps`) deve antecipar estas regras no JSON.

---

## 1. Factualidade e risco (obrigatório)

- **Fonte de verdade**: `product_facts` e o briefing JSON. Não invente preços, limites de plano, integrações, nem números de clientes/métricas que não estejam explícitos nessas fontes.
- **Concorrentes e marcas**: **Não cite nomes de empresas, blogs ou produtos concorrentes** (ex.: ferramentas, softwares de nicho) **a menos que** apareçam explicitamente em `competitor_summaries`, `briefing_json` ou no briefing aprovado pelo humano. Prefira expressões genéricas: “soluções não oficiais”, “outras plataformas do mercado”, “artigos genéricos na SERP”.
- **Afirmações técnicas** (API Meta, janela 24h, LGPD, banimento): só escreva o que puder ser sustentado por `product_facts` ou por documentação pública genérica **sem** atribuir comportamento a marcas nomeadas.
- **Conteúdo comparativo**: se o briefing pedir comparação, use **critérios** (ex.: “API oficial vs. não oficial”), não ranking de terceiros nem menção a sites específicos sem fonte no briefing.

---

## 2. Formatação e legibilidade do `body_mdx`

- **Parágrafos**: frases claras; **um bloco de ideia por parágrafo**; evite parágrafos com mais de ~5 linhas no ecrã; use parágrafos separados em vez de um único bloco denso.
- **H2 (`##`)**: um título forte por secção; sem clickbait; alinhado ao briefing.
- **Listas**: use `- ` com itens legíveis; cada bullet com **negrito no gancho** (`- **Título curto** — explicação`) quando fizer sentido; evite listas com dezenas de itens sem subtítulos.
- **Negrito**: use `**` com moderação para termos-chave e benefícios, não em frases inteiras.
- **Evite**: blocos “de artigo académico” com muitas vírgulas encadeadas; repetição do mesmo substantivo em cada frase; listas numeradas longas quando bullets bastam.

---

## 3. Tom e estilo

- Tom profissional pt-BR, alinhado a `tom_de_voz` do briefing.
- Sem hype: revolucionário, único do mercado, 100% garantido, milagre, nunca visto.
- **Vazamento de instrução**: nunca deixe no texto frases que pareçam prompts (“Desenvolva com dados…”, “Incorpore LSI…”, “Segundo o roteiro…”).

---

## 4. Para o briefing (`analyze-gaps`) — o que garantir no JSON

- `gancho_vendas` e `gaps_conteudo_top3`: **ângulos próprios**, sem depender de nomes de concorrentes para fazer autoridade; use lacunas da SERP de forma **descritiva** (“muitos resultados listam X sem explicar Y”), não listas de marcas.
- `topicos_obrigatorios`: cada item deve ser **defensável com product_facts** ou com análise genérica de mercado; não exija que a página cite terceiros pelo nome.
- `alertas_para_humano`: inclua quando houver comparação sensível, necessidade de revisão legal/comercial ou quando o termo pressupõe dados que não estão em `product_facts`.
- `information_gain.angulo_diferenciado`: foque em **metodologia e critérios de decisão**, não em “atacar” players nomeados.

---

## 5. Coerência com o layout (Next / `PageContentSections`)

- Respeitar estrutura `##` + listas conforme `generate-page.transacional.md` (duo, passos, split, cards, etc.).
- Imagens são escolhidas por Pexels com base no **título da secção** e na keyword: títulos `##` claros e vocabulário do nicho melhoram o match visual.

---

## 6. Checklist rápido antes de considerar o texto “pronto”

- [ ] Nenhum nome de concorrente sem base no briefing/fonte aprovada.
- [ ] Nenhum preço/número inventado.
- [ ] Parágrafos respirados; listas onde ajudam a leitura.
- [ ] Sem frases de meta-instrução para a IA.
- [ ] Alinhado ao `tom_de_voz` e aos tópicos obrigatórios do briefing.
