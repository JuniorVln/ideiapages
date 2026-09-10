/**
 * Ferramenta-isca 2: gerador de link do WhatsApp (wa.me).
 *
 * Motivo estratégico (GATE rodada 4, 10/09/2026): é a MAIOR fonte de tráfego orgânico do nicho no
 * Brasil. "link whatsapp" tem 301.000 buscas/mês; somando as variações, a família passa de 350 mil.
 * chatPro é 1º lugar e tira ~40 mil visitas/mês só disso; DigiSac, ~18 mil. É o tipo de página que
 * outros sites citam — exatamente o que falta para a autoridade do domínio.
 *
 * Diferencial nosso: o link já sai com a mensagem pronta (reaproveitando o gerador de mensagens
 * automáticas) e com QR code — nenhum concorrente entrega os três juntos.
 *
 * Tudo roda no cliente: nenhum número digitado sai da página.
 */

export type ModeloMensagem = { id: string; nome: string; texto: string };

/** Sugestões de primeira mensagem, por tipo de uso do link. */
export const MODELOS: ModeloMensagem[] = [
  { id: "vazio", nome: "Sem mensagem", texto: "" },
  {
    id: "geral",
    nome: "Contato geral",
    texto: "Olá! Vim pelo site e gostaria de mais informações.",
  },
  {
    id: "orcamento",
    nome: "Pedir orçamento",
    texto: "Olá! Gostaria de um orçamento. Pode me passar os valores e o prazo?",
  },
  {
    id: "produto",
    nome: "Dúvida sobre produto",
    texto: "Olá! Tenho uma dúvida sobre um produto de vocês, pode me ajudar?",
  },
  {
    id: "agendamento",
    nome: "Agendar horário",
    texto: "Olá! Gostaria de agendar um horário. Quais dias vocês têm disponíveis?",
  },
  {
    id: "instagram",
    nome: "Veio do Instagram",
    texto: "Oi! Vim pelo Instagram e quero saber mais.",
  },
  {
    id: "catalogo",
    nome: "Pedir catálogo",
    texto: "Olá! Vocês podem me enviar o catálogo e a tabela de preços?",
  },
  {
    id: "suporte",
    nome: "Suporte",
    texto: "Olá! Preciso de ajuda com um atendimento que já está em andamento.",
  },
];

/** Só dígitos. */
export function apenasDigitos(v: string): string {
  return (v || "").replace(/\D+/g, "");
}

/**
 * Monta o número no formato que o WhatsApp exige: DDI + DDD + número, sem símbolo.
 * Assume Brasil (55) quando o usuário digita só DDD + número.
 */
export function normalizarNumero(bruto: string, ddiPadrao = "55"): string {
  let n = apenasDigitos(bruto);
  if (!n) return "";
  // 0800 e afins não funcionam no WhatsApp; devolve como veio para a validação avisar.
  if (n.startsWith("0")) n = n.replace(/^0+/, "");
  // já veio com DDI do Brasil
  if (n.startsWith(ddiPadrao) && n.length >= 12) return n;
  // DDD + número (10 ou 11 dígitos)
  if (n.length === 10 || n.length === 11) return ddiPadrao + n;
  return n;
}

export type Validacao = { ok: boolean; aviso: string | null };

export function validarNumero(bruto: string): Validacao {
  const n = apenasDigitos(bruto);
  if (!n) return { ok: false, aviso: null };
  if (n.length < 10) return { ok: false, aviso: "Faltam dígitos — inclua o DDD." };
  const cheio = normalizarNumero(bruto);
  if (cheio.length < 12) return { ok: false, aviso: "Número incompleto para o formato internacional." };
  if (cheio.length > 15) return { ok: false, aviso: "Número longo demais — confira se não repetiu o DDI." };
  return { ok: true, aviso: null };
}

/** Formata para leitura: +55 (51) 99868-1452 */
export function formatarVisual(bruto: string): string {
  const n = normalizarNumero(bruto);
  if (n.length < 12) return bruto;
  const ddi = n.slice(0, n.length - 11 > 0 ? n.length - 11 : 2);
  const resto = n.slice(ddi.length);
  const ddd = resto.slice(0, 2);
  const corpo = resto.slice(2);
  const meio = corpo.length === 9 ? `${corpo.slice(0, 5)}-${corpo.slice(5)}` : `${corpo.slice(0, 4)}-${corpo.slice(4)}`;
  return `+${ddi} (${ddd}) ${meio}`;
}

/** O link wa.me — com a mensagem já codificada, se houver. */
export function montarLink(numero: string, mensagem: string): string {
  const n = normalizarNumero(numero);
  if (!n) return "";
  const base = `https://wa.me/${n}`;
  const texto = (mensagem || "").trim();
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** URL de QR code (serviço público, gerado só no navegador de quem usa). */
export function urlQrCode(link: string, tamanho = 320): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&margin=8&data=${encodeURIComponent(link)}`;
}

/** Snippet de botão para colar no site. */
export function snippetBotao(link: string, rotulo = "Falar no WhatsApp"): string {
  return `<a href="${link}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;
          padding:12px 20px;border-radius:8px;font-weight:600;text-decoration:none">
  ${rotulo}
</a>`;
}
