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
- `topicos_obrigatorios`: cada item deve ser **defensível com product_facts** ou com análise genérica de mercado; não exija que a página cite terceiros pelo nome. **Não** exija secção de tabela de preços no corpo do artigo: preços e planos visíveis vêm do **template fixo** (secção 5.1) e de `product_facts`.
- `alertas_para_humano`: inclua quando houver comparação sensível, necessidade de revisão legal/comercial ou quando o termo pressupõe dados que não estão em `product_facts`.
- `information_gain.angulo_diferenciado`: foque em **metodologia e critérios de decisão**, não em “atacar” players nomeados.
- `cta_principal` / `cta_secundario` (quando usados no site): alinhe a **demonstração** ou **especialista**; o fluxo conduz a `#demonstracao-gratuita` / `#secao-valores` (ver secção 5.1).
- `title_seo` / `meta_description`: podem falar em planos/valores de forma **genérica**; não listar preços se não estiverem explícitos em `product_facts`.

---

## 5. Coerência com o layout (Next / `PageContentSections`)

- Respeitar estrutura `##` + listas conforme `generate-page.transacional.md` (duo, passos, split, cards, etc.).
- Imagens são escolhidas por Pexels com base no **título da secção** e na keyword: títulos `##` claros e vocabulário do nicho melhoram o match visual.

---

## 5.1 Template público corrigido (todas as gerações) — leitura obrigatória

Esta é a **ordem real** no front (não depende do redator inventar secções extra de preço no MDX):

1. **Hero + metadados** (CMS): título, subtítulo, CTA que rola para a âncora de valores/demo.
2. **Corpo** = `body_mdx` mapeado em blocos (duo, passos, split, cards do 5.º `##`, etc.) — ver `generate-page.transacional.md`.
3. **Faixa de estatísticas** (`StatsStrip`), quando aplicável.
4. **FAQ** = `faq_sugerida` do briefing (não duplicar no MDX).
5. **Valores e demonstração** = componente fixo **`PricingAndDemoCta`** (não é markdown):
   - Fundo **claro** (`bg-slate-50`, borda suave); conteúdo **centralizado** (título, texto introdutório, toggle **Mensal / Anual**, grelha de cartões).
   - Cartões **Essencial** e **Elite** com preços e bullets alinhados a **`product_facts`** (e nota de referência ao ficheiro de fatos); CTAs **WhatsApp** para demonstração.
   - **Sem** coluna lateral de imagem nem bloco escuro “hero” ao lado dos preços — esse layout está descontinuado.
6. **Âncoras estáveis** para CTAs do site: `#demonstracao-gratuita` (secção inteira) e `#secao-valores` (grelha de planos). O redator **não** precisa criar esses IDs no MDX; já vêm do React.

**O que o briefing (`analyze-gaps`) e o `body_mdx` NÃO devem fazer**

- Não exigir nem escrever **tabela de preços**, **lista de valores em reais** ou **secção `## Preços`** no artigo — isso duplicaria o componente e pode gerar conflito com `product_facts`.
- Não descrever no JSON um “layout de pricing” (imagem à esquerda, coluna escura, etc.); o template acima é único.
- Pode (e deve) falar de **intenção de compra**, **próximo passo** e **custo como “consulte a tabela / a demonstração”** sem inventar números.

**O que o briefing DEVE antecipar para casar com o template**

- `cta_principal` / `cta_secundario` alinhados a **demonstração** ou **falar com especialista** (os botões de WhatsApp e o hero apontam para a mesma jornada).
- `meta_description` e `title_seo` podem mencionar “valores” ou “planos” de forma **genérica** (“veja tabela no site”, “condições comerciais na demo”), desde que **não listem preços** que não estejam em `product_facts`.
- `topicos_obrigatorios` e `gancho_vendas` reforçam **argumento de venda e critérios de decisão**, não a reprodução de uma tabela no texto.

---

## 6. Checklist rápido antes de considerar o texto “pronto”

- [ ] Nenhum nome de concorrente sem base no briefing/fonte aprovada.
- [ ] Nenhum preço/número inventado.
- [ ] Parágrafos respirados; listas onde ajudam a leitura.
- [ ] Sem frases de meta-instrução para a IA.
- [ ] Alinhado ao `tom_de_voz` e aos tópicos obrigatórios do briefing.
- [ ] Nenhuma tabela ou secção de preços no MDX — pricing vem do template + `product_facts`.
