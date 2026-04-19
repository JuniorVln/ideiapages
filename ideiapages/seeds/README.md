# Seeds

Arquivos JSON com termos-semente e contexto de cada nicho/cliente.

Cada arquivo é input para `ideiapages-research run-pipeline --seed-file <arquivo>`.

## Schema

```json
{
  "nicho": "string (slug)",
  "produto": "string",
  "url_produto": "string (URL)",
  "publico_alvo_principal": ["string", "..."],
  "concorrentes_diretos": ["string", "..."],
  "seeds_termos": ["string", "..."],
  "verticais_expansao": ["string", "..."],
  "objetivos_pesquisa": ["string", "..."]
}
```

## Arquivos

- `ideia_chat.json` — primeiro nicho (MVP, foco em escritórios contábeis)

Quando entrar novo cliente/nicho, adicionar novo arquivo aqui.
