# Security Rules — IDeiaPages

> Regras de segurança invioláveis. Lido por todos os agentes, especialmente `model-writer`, `seo-page-writer` e `python-collector-writer`.

---

## Princípios

1. **Defense in depth** — RLS no banco + auth no API + validação no input
2. **Least privilege** — cada token/key tem o mínimo de permissão necessária
3. **Server-side por default** — segredos só no server, nunca expor no client
4. **Sanitização de input** — todo dado externo (form, query string, scraping) é validado e sanitizado

---

## Variáveis de ambiente

### Públicas (prefixo `NEXT_PUBLIC_*`)

Podem ir para o client. NUNCA colocar nada sensível.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     (anon, com RLS)
NEXT_PUBLIC_GA4_MEASUREMENT_ID
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_SITE_URL
```

### Privadas (sem prefixo)

APENAS em route handlers, server components e scripts.

```
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
GOOGLE_AI_API_KEY
APIFY_TOKEN
FIRECRAWL_API_KEY
```

Se um agente tentar usar essas no client, a build deve falhar (Next.js já avisa).

---

## Supabase RLS

### Regras gerais

- **Toda tabela** tem RLS ativada via `enable row level security`.
- **Toda tabela** tem pelo menos uma policy explícita (mesmo que `using (false)` para negar tudo).
- **anon role** tem acesso mínimo: leitura de `paginas` publicadas e nada mais.
- **service_role** é usado apenas em server-side (route handlers, scripts Python).
- **authenticated role** definido quando houver dashboard com login.

### Anti-padrão

```sql
-- NUNCA: tabela sem RLS
create table leads (...);
-- Sem alter table enable row level security

-- NUNCA: policy permissiva sem justificativa
create policy "tudo aberto" on leads for all using (true);
```

### Padrão correto

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  ...
);

alter table leads enable row level security;

create policy "service_role pode tudo" on leads
  for all to service_role using (true) with check (true);

create policy "anon nao pode nada" on leads
  for select to anon using (false);
```

---

## Validação de input

### Forms (web)

- Validação client-side (HTML5 + zod) **e** server-side (zod no route handler)
- Nunca confiar no client. Validar tudo no server.

```ts
import { z } from "zod";

const leadSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(200),
  telefone: z.string().regex(/^\+?\d{10,15}$/),
  utm_source: z.string().max(100).optional(),
  // ...
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }
  // ...
}
```

### Scripts Python (collectors)

- Validar todo dado vindo de API externa (Apify, Firecrawl) com `pydantic`.
- Truncar strings longas para evitar payloads abusivos.
- Rate-limit chamadas para não estourar quota e não sobrecarregar Supabase.

---

## Rate limiting

### Route handlers públicas

- `/api/leads` (POST): 5 req/min por IP
- `/api/track` (POST): 30 req/min por IP

Implementar via middleware Next.js + Upstash Redis (ou simples LRU em memória para MVP).

### Scripts Python

- Apify: respeitar rate dos actors
- Firecrawl: respeitar plano (Hobby = X req/dia)
- LLMs: rate limiter local + retry exponencial

---

## CORS

- Route handlers sem CORS open. Apenas mesmo domínio.
- Se precisar abrir para outros domínios, listar explícito (não `*`).

---

## Logs

- **NUNCA** logar API keys, senhas, dados pessoais completos (PII).
- Telefone/email no log: máscara (ex: `j***@gmail.com`, `+5511*****1234`).
- Logs estruturados (JSON) em produção, legíveis em dev.

---

## Dependências

- Auditar dependências regularmente: `npm audit`, `pip-audit`
- Pinar versões em `package.json` (sem `^` para deps críticas como Supabase, Next.js)
- Atualizar mensalmente, testar em branch antes de merge

---

## Secrets em git

- `.gitignore` cobre `.env`, `.env.local`, `.env.production`
- Nunca commit de chaves, mesmo "para teste"
- Se vazar: revogar IMEDIATAMENTE a chave em todos os providers

---

## Headers de segurança (web)

Em `web/next.config.ts`:

```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
}
```

---

## Lead privacy (LGPD)

- Política de privacidade obrigatória, link no rodapé e no form
- Checkbox de consentimento: opt-in claro (nunca pré-marcado para opt-out)
- Endpoint `/api/me/delete` para usuário pedir remoção dos dados
- Retenção: leads sem conversão deletados após 24 meses (configurável)
