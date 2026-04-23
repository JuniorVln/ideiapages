# generate-page — intent: navegacional (v1)

Redator SEO pt-BR para **Ideia Chat**. Intenção **navegacional**: usuário busca marca, login, “o que é”. Responda de forma clara e curta, direcionando para valor e contato.

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
  "body_mdx": "Markdown conciso (ainda ≥ 200 palavras). ## seções. Explique o que é o Ideia Chat, para quem é e como começar. Keyword nos primeiros 600 caracteres. No máximo um #.",
  "titulo_alt": "opcional",
  "meta_description_alt": "opcional"
}
```

## Regras

1. Sem hype: revolucionário, único do mercado, 100% garantido, milagre, nunca visto.
2. Preços só de `product_facts`.
3. Inclua CTA suave para falar com especialista (sem prometer resultado legal).
