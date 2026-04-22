# Conversion Principles — IDeiaPages

> UX rules para todo behavior em `conversion/`. Lido por `component-writer`.

---

## Princípio central

> Todo lead capturado vale mais que toda visita perdida.

Capturamos dados **antes** de qualquer ação que possa fazer o usuário sair do site.

---

## Regras invioláveis

### 1. Captura sempre antes do WhatsApp

- Nunca abrir `wa.me/...` direto a partir de um botão.
- Sempre passar por modal que pede nome, email, telefone.
- Após captura: salvar no Supabase E redirecionar para WhatsApp.
- Se o usuário fechar o modal sem submeter, o lead **não foi perdido** — não há captura, mas também não há conversão. OK.
- Se o usuário **submeter e fechar antes de ir pro WhatsApp**, o lead já está salvo. Resgatável por remarketing.

### 2. Form mínimo


| Campo    | Obrigatório | Validação                                    |
| -------- | ----------- | -------------------------------------------- |
| Nome     | sim         | mínimo 2 chars                               |
| Email    | sim         | regex válido + dispostable detection (lista) |
| Telefone | sim         | máscara BR + DDD                             |


Não pedir CNPJ, cargo, empresa, tamanho da empresa **no formulário inicial**. Esses dados vêm na conversa do WhatsApp.

### 3. CTA linguagem

- Usar verbos diretos: "Falar agora", "Receber proposta", "Agendar demonstração"
- Evitar verbos genéricos: "Saiba mais", "Clique aqui", "Veja mais"
- CTA primário sempre referencia a próxima ação concreta

### 4. UTM tracking

Toda página gera/lê UTMs e os salva com o lead:


| UTM            | Origem                                          |
| -------------- | ----------------------------------------------- |
| `utm_source`   | sempre `google` para tráfego orgânico (default) |
| `utm_medium`   | `organic` (default) ou valor da query string    |
| `utm_campaign` | `ideiapages` (default)                          |
| `utm_term`     | termo-alvo da página                            |
| `utm_content`  | id da variação A/B vista                        |


Salvos em cookie no primeiro touch + replicados no lead final.

### 5. Posição dos CTAs

- 1 CTA no header (sticky no mobile)
- 1 CTA no hero (acima da dobra)
- 1 CTA a cada 600 palavras de conteúdo
- 1 CTA fixo flutuante de WhatsApp (mobile)
- 1 CTA grande no final da página

### 6. Single conversion goal por página

Cada página tem UM objetivo de conversão. Não competir entre "preencha o form" e "fale no WhatsApp" — ambos são captura, mas o **canal** preferido é o WhatsApp (faixa do produto). Form é fallback.

### 7. Confirmação visual

- Após submit do form: feedback claro ("Recebemos! Abrindo WhatsApp...") em 100ms
- Após click no CTA WhatsApp e captura: spinner curto + redirecionamento
- Erros: inline no campo, nunca em alert

### 8. Formulário em página vs modal

- **Modal**: para CTAs ao longo do conteúdo ("Falar no WhatsApp")
- **Página**: para landing pages bottom-of-funnel ("/agendar-demo")

---

## Performance da conversão


| Métrica                  | Como medir                                | Alvo MVP |
| ------------------------ | ----------------------------------------- | -------- |
| Lead conversion rate     | leads / sessões                           | > 3%     |
| WhatsApp click rate      | cliques no CTA WhatsApp / sessões         | > 8%     |
| Captura → envio WhatsApp | leads que abriram WhatsApp / leads totais | > 70%    |
| Form abandon             | starts sem submit / starts                | < 50%    |


---

## A/B Testing — princípios

- Sempre testar **uma variável** por vez no mesmo termo (copy do hero, ou cor do CTA, ou imagem)
- Mínimo 100 sessões por variação antes de qualquer leitura
- Vencedor: lift de 20%+ em conversion rate, com p-value < 0.05
- Documentar aprendizado no Supabase: `experiments_log`

---

## Mensagens padrão

### Modal "Falar no WhatsApp"

```
Título: Antes de começarmos, queremos te conhecer

Subtítulo: Preencha rapidinho que abrimos o WhatsApp em seguida

[Form]

Botão: Abrir WhatsApp ➜

Rodapé: Seus dados ficam seguros. Política de Privacidade.
```

### WhatsApp pre-filled message

```
Olá! Vim do site através da página sobre {termo_alvo}. Quero saber mais sobre o Ideia Chat.
```

