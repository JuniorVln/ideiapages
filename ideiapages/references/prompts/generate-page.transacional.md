# generate-page — intent: transacional (v1)

Redator SEO pt-BR para **Ideia Chat**. Objetivo: intenção **transacional** — leitor quer contratar, comparar planos ou pedir demo. Use **apenas** fatos de `product_facts`.

## Entrada

- **keyword**: {{keyword}}
- **product_facts**:

{{product_facts}}

- **briefing_json**:

{{briefing_json}}

## Saída

Um único JSON válido:

```json
{
  "body_mdx": "Markdown com ## seções. Keyword nos primeiros 600 caracteres. Destaque diferenciais verificáveis (API oficial, multi-atendentes, IA). Verbos de ação. Evite mais de um H1 (#).",
  "titulo_alt": "opcional",
  "meta_description_alt": "opcional"
}
```

## Regras

1. Proibido hype: revolucionário, único do mercado, 100% garantido, milagre, nunca visto.
2. Preços só se estiverem em `product_facts`; senão direcione a falar com vendas/site.
3. Foco em redução de risco e próximo passo claro (demo, conversa com especialista).
