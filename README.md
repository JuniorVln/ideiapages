# Rede Ideia — Workspace

Workspace do projeto **IDeiaPages** para a Rede Ideia: SEO programático aplicado ao MVP **Ideia Chat** ([ideiamultichat.com.br](https://ideiamultichat.com.br/)).

---

## Mapa do workspace

```
Rede Ideia/
│
├── ideiapages/             🎯 PROJETO PRINCIPAL (Spec-Driven Development)
│                              Aqui mora todo o código (Python + Next.js).
│                              Veja ideiapages/README.md e ideiapages/docs/sdd-workflow.md.
│
├── SEO-Apresentacao/       📊 Pitch deck React/Vite usado para vender o projeto.
│                              Repo independente, deployável como SPA na Vercel.
│
├── _docs/                  📚 Documentação estratégica e comercial.
│   ├── PLANEJAMENTO_IDEIAPAGES_v2.md   (fonte canônica do projeto)
│   ├── PROPOSTA_IDEIAPAGES_v2.md       (proposta comercial atual)
│   ├── custos.md                        (estimativa de custos mensais)
│   └── inspiracao/
│       └── SEO_Programatico.pdf
│
├── _archive/               🗄️  Documentos antigos preservados como histórico.
│                              Não usar como referência técnica.
│
├── _scratch/               🧪 Sandbox local. Scripts descartáveis, experimentos.
│                              Gitignored.
│
├── temp_repos/             🔍 Clones de repos legados da Rede Ideia (referência).
│                              Não buildar daqui. Veja temp_repos/README.md.
│
├── .firecrawl/, .qwen/     ⚙️  Configurações locais de ferramentas (gitignored).
│
└── README.md               (este arquivo)
```

---

## Por onde começar

Se você é novo no projeto:

1. **Estratégia e contexto comercial** → ler [`_docs/PLANEJAMENTO_IDEIAPAGES_v2.md`](./_docs/PLANEJAMENTO_IDEIAPAGES_v2.md)
2. **Como propomos para o cliente** → ler [`_docs/PROPOSTA_IDEIAPAGES_v2.md`](./_docs/PROPOSTA_IDEIAPAGES_v2.md)
3. **Como o código é organizado** → ler [`ideiapages/docs/sdd-workflow.md`](./ideiapages/docs/sdd-workflow.md)
4. **Stack e regras invioláveis** → ler [`ideiapages/references/architecture.md`](./ideiapages/references/architecture.md)

---

## Metodologia: Spec-Driven Development (SDD)

Todo código do projeto `ideiapages/` segue o pipeline:

```
/spec <behavior>   →  Single Source of Truth (markdown)
/break <behavior>  →  Issues sequenciais (frontend antes de DB)
/plan <issue>      →  RAG + arquivos exatos a tocar
/execute <issue>   →  Agente especialista executa cirurgicamente
```

Cada behavior é isolado em sua pasta. Mudar X não quebra Y. Veja [`ideiapages/docs/sdd-workflow.md`](./ideiapages/docs/sdd-workflow.md) para o manual completo.

---

## Stack resumida

| Camada | Tecnologia |
|--------|------------|
| App web | Next.js 15 (App Router) + TypeScript + Tailwind 4 |
| Banco | Supabase (PostgreSQL + RLS) |
| Hosting | Vercel |
| Pesquisa | Python 3.11+ (Apify, Firecrawl, pytrends) |
| LLMs | Claude (Anthropic), GPT (OpenAI), Gemini (Google) |
| Analytics | GA4 + Search Console |

---

## Deploy na Vercel (app Next.js)

Este repo inclui várias pastas (`SEO-Apresentacao`, `_docs`, etc.). O **site / sistema IDeiaPages** está em **`ideiapages/web`** ([JuniorVln/ideiapages](https://github.com/JuniorVln/ideiapages)).

No projeto Vercel ligado a esse repositório:

1. **Settings → Build & Deployment → Root Directory:** `ideiapages/web` (obrigatório — senão o build tenta Vite na raiz e falha).
2. **Framework:** Next.js (detetado depois de definires o diretório raiz).
3. **Environment Variables:** seguir `ideiapages/.env.example`. Para o middleware reconhecer bypass do admin em produção, incluir `ADMIN_LOCAL_BYPASS=true` nas envs do projeto (ou usar apenas Magic Link + `ADMIN_ALLOWED_EMAILS`).

---

## Status atual

- ✅ **Fase -1**: Bootstrap SDD (estrutura, knowledge base, agentes, comandos)
- ⏳ **Fase 0**: Módulo de pesquisa de termos (em planejamento)
- ⏸️ Fases 1-4: aguardando Fase 0

Acompanhe o plano de execução completo em `c:\Users\junio\.cursor\plans\plano_execução_ideiapages_53ec4b0e.plan.md`.
