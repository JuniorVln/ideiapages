---
behavior: web/conversion
status: draft
created: 2026-04-23
owner: junior
---

# Contract — Web Conversion (Fase 1)

## Objetivo

Implementar **captura de lead + UTMs + redirecionamento WhatsApp** de ponta a ponta: thin client, validação dupla (UX + servidor), idempotência e sem vazamento de segredos.

## Escopo deste domínio

| Sub-entrega | Descrição |
|-------------|-----------|
| `utm-tracking` | Cookie first-touch `__utm` (90d, SameSite=Lax), leitura de querystring; hook `useUtmTracking()` + `getStoredUtms()` |
| `lead-form-submit` | `POST /api/leads`: Zod, dedup 5 min, hash IP/UA, insert service_role, resposta &lt; 500ms p95 local |
| `whatsapp-modal` | Modal + form; sucesso → API lead → redirect `wa.me` com texto pré-preenchido (keyword/slug) |

## Triggers

1. Visitante chega com `?utm_*` → cookie gravado se ainda não houver first-touch.
2. Clicou CTA WhatsApp → abre modal.
3. Submeteu formulário válido → API grava lead → cliente redireciona para WhatsApp.
4. Reenvio duplicado &lt; 5s / mesma chave na janela → **não** cria segundo registro (resposta 200 idempotente).

## Regras de negócio

1. **Thin client**: browser nunca grava direto no Supabase; só chama route handler.
2. **Validação**: Zod no servidor (email, telefone BR 10–11 dígitos normalizados, nome ≥ 2 chars).
3. **UTMs**: replicar no payload do lead o que estiver no cookie first-touch + override explícito da sessão se spec permitir (default: cookie vence após primeiro set).
4. **LGPD**: não persistir IP/UA cru; apenas hash SHA-256.
5. **Redirect WhatsApp**: somente após resposta de sucesso da API.
6. **`NEXT_PUBLIC_WHATSAPP_NUMBER`**: apenas número público; segredos só server env.

## API contract (mínimo)

**Request JSON** (`POST /api/leads`):

```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "pagina_id": "uuid",
  "variacao_id": "uuid | null",
  "utm_source": "string | null",
  "utm_medium": "string | null",
  "utm_campaign": "string | null",
  "utm_content": "string | null",
  "utm_term": "string | null"
}
```

**Response** (sucesso):

```json
{
  "success": true,
  "redirect_url": "https://wa.me/..."
}
```

Erros: `400` validação, `429` opcional rate limit, `500` genérico sem stack trace.

## Entradas / saídas

**Entradas**: ids de página/variação no contexto da página; variáveis env; `references/conversion_principles.md`.

**Saídas**: linhas em `leads`; eventos GA4 disparados pelo domínio `monitoring` (não duplicar lógica inconsistente).

## Critérios de aceitação

- [ ] Cookie UTMs com TTL e path corretos; SSR não quebra (só client).
- [ ] API valida e rejeita payload inválido com mensagens seguras.
- [ ] Dedup por `(email, telefone, pagina_id)` em 5 min documentado e testado.
- [ ] Nenhuma `service_role` key no bundle cliente (auditoria).
- [ ] Redirect `wa.me` inclui mensagem com identificação mínima da página (keyword ou título).

## Não-objetivos

- CRM externo, webhooks Zapier.
- OTP ou login do visitante.
- Consentimento granular cookies (banner CMP) — documentar se apenas cookie técnico UTM.

## Referências

- Spec: `specs/fase-1-paginas-piloto.md`
- Break: `specs/fase-1-paginas-piloto.break.md` (conversion/*)
