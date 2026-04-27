# IDeiaPages — fluxo do projeto (Mermaid)

Documento de referência com os mesmos diagramas exibidos no Canvas do Cursor
(`canvases/fluxo-ideiapages.canvas.tsx` na pasta do projeto no Cursor).

## Diagrama principal

```mermaid
flowchart TB
  subgraph entrada["Fase 0 — Pesquisa"]
    A1["Coleta e análise de termos"] --> A2["Briefing por termo"]
    A2 --> A4[("Termos: briefing pronto")]
  end
  subgraph criacao["Criação da página"]
    B1["Rascunho a partir do briefing"] --> B2["Conteúdo + FAQ + CTAs"]
    B2 --> B3[("Página: status rascunho")]
  end
  subgraph publica["Publicação"]
    C1["Revisão"] --> C2["Status: publicado"]
    C2 --> C3["Sitemap e indexação"]
  end
  subgraph visita["Visitante"]
    D1["Google ou link"] --> D2["/blog/..."] --> D3["Clica no WhatsApp"]
  end
  subgraph conversao["Conversão"]
    E1["Formulário"] --> E2["Grava lead + UTMs"]
    E2 --> E3["Redireciona p/ WhatsApp"]
  end
  subgraph evolui["Evolução"]
    F1["Testes A/B"] --> F2["Vencedor + métricas"] --> F3["Autocura / escala"]
  end
  A4 --> B1
  B3 --> C1
  C3 --> D1
  D3 --> E1
  B2 -.-> F1
```

## Camadas técnicas

```mermaid
flowchart LR
  subgraph ferramentas["Pesquisa / automação"]
    P1["Python / coletores"]
    P2["Apify, Firecrawl, IAs"]
  end
  subgraph app["Next.js na Vercel"]
    W1["/blog público"]
    W2["Admin"]
    W3["APIs: leads, geração"]
  end
  subgraph dados["Supabase"]
    S1[("Dados centralizados")]
  end
  subgraph medicao["Medição"]
    M1["GA4"]
    M2["Search Console"]
  end
  P1 --> S1
  P2 --> S1
  W1 --> S1
  W2 --> S1
  W3 --> S1
  W1 --> M1
```

---

*Atualizado em 23/04/2026. Alinhado a `ideiapages/README.md` e às specs de fase.*
