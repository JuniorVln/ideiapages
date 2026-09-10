/**
 * Ferramenta-isca: gerador de mensagens automáticas de WhatsApp.
 *
 * Autorizada pelo Victor em 12/08/2026 ("se tu acha que vai ajudar, pode criar").
 * Motivo estratégico (GATE de 10/09): "mensagem automática whatsapp" e variações somam ~100 mil
 * buscas/mês no Brasil — é o maior cluster informacional do nicho, e é intenção de *configurar*,
 * não de comprar. Página que só explica não ganha link; ferramenta que entrega o texto pronto, sim.
 *
 * Tudo roda no cliente: nenhum dado do visitante sai da página.
 */

export type CategoriaId =
  | "saudacao"
  | "fora-horario"
  | "ausencia"
  | "menu-setores"
  | "confirmacao"
  | "lembrete"
  | "pos-venda"
  | "orcamento";

export type SegmentoId =
  | "geral"
  | "contabilidade"
  | "clinica"
  | "imobiliaria"
  | "loja"
  | "servicos"
  | "restaurante"
  | "escola";

export type Categoria = { id: CategoriaId; nome: string; descricao: string };
export type Segmento = { id: SegmentoId; nome: string };

export const CATEGORIAS: Categoria[] = [
  { id: "saudacao", nome: "Saudação (primeira mensagem)", descricao: "Dispara quando o cliente manda a primeira mensagem do dia." },
  { id: "menu-setores", nome: "Menu de setores", descricao: "Direciona a conversa para o time certo antes de alguém responder." },
  { id: "fora-horario", nome: "Fora do horário", descricao: "Responde à noite, no fim de semana e no feriado, sem deixar no vácuo." },
  { id: "ausencia", nome: "Ausência / demora", descricao: "Quando a equipe está em atendimento e o cliente vai esperar." },
  { id: "confirmacao", nome: "Confirmação de agendamento", descricao: "Confirma horário, reunião ou visita — reduz falta." },
  { id: "lembrete", nome: "Lembrete e cobrança", descricao: "Lembra do compromisso, do documento ou do vencimento." },
  { id: "orcamento", nome: "Orçamento e proposta", descricao: "Recebe o pedido, dá prazo e não deixa a conversa morrer." },
  { id: "pos-venda", nome: "Pós-atendimento", descricao: "Fecha o ciclo e abre espaço para avaliação e indicação." },
];

export const SEGMENTOS: Segmento[] = [
  { id: "geral", nome: "Geral (qualquer empresa)" },
  { id: "contabilidade", nome: "Contabilidade" },
  { id: "clinica", nome: "Clínica / consultório" },
  { id: "imobiliaria", nome: "Imobiliária" },
  { id: "loja", nome: "Loja / e-commerce" },
  { id: "servicos", nome: "Prestador de serviço" },
  { id: "restaurante", nome: "Restaurante / delivery" },
  { id: "escola", nome: "Escola / curso" },
];

/** Substituições que o usuário troca depois; ficam visíveis no texto gerado. */
export const VARIAVEIS = ["{nome}", "{empresa}", "{horario}", "{atendente}"] as const;

type Banco = Record<CategoriaId, Partial<Record<SegmentoId, string[]>>>;

const B: Banco = {
  saudacao: {
    geral: [
      "Olá, {nome}! Aqui é a {empresa}. 👋\nRecebemos sua mensagem e já estamos com ela na fila.\nMe conta em uma linha o que você precisa que eu já direciono para a pessoa certa.",
      "Oi! Que bom falar com você. 😊\nSou o atendimento da {empresa}. Para adiantar: seu contato é sobre um serviço novo ou algo que já está em andamento com a gente?",
      "Olá! Você chegou na {empresa}.\nNosso horário de atendimento é {horario}. Se você mandar já o que precisa, respondemos assim que um atendente ficar livre.",
    ],
    contabilidade: [
      "Olá, {nome}! Aqui é a {empresa}, seu escritório contábil. 👋\nPara agilizar, me diz qual é o assunto:\n• Documento ou guia\n• Folha e funcionários\n• Imposto / declaração\n• Abertura ou alteração de empresa\n• Outro assunto",
      "Oi, {nome}! Recebemos sua mensagem aqui na {empresa}.\nSe for envio de documento, pode mandar o arquivo direto por aqui que já registramos no seu processo.",
    ],
    clinica: [
      "Olá! Aqui é a {empresa}. 👋\nVocê quer agendar, remarcar ou tirar uma dúvida sobre um atendimento?\nSe já tem preferência de dia e turno, me manda que eu já verifico a agenda.",
      "Oi, {nome}! Que bom te ver por aqui.\nMe conta: é primeira consulta ou retorno? Assim já separo o horário certo para você.",
    ],
    imobiliaria: [
      "Olá! Aqui é a {empresa}. 🏡\nVocê está procurando para alugar ou para comprar? E em qual bairro?\nCom isso eu já separo as opções que fazem sentido antes de te ligar.",
      "Oi, {nome}! Recebi seu contato sobre o imóvel.\nEle ainda está disponível — me diz se você prefere visitar durante a semana ou no fim de semana.",
    ],
    loja: [
      "Olá! Bem-vindo à {empresa}. 🛍️\nMe diz qual produto você viu que eu confirmo disponibilidade, cor e prazo de entrega para o seu CEP.",
      "Oi, {nome}! Obrigado pelo contato.\nSe for sobre um pedido que você já fez, me manda o número do pedido que eu consulto o status agora.",
    ],
    servicos: [
      "Olá! Aqui é a {empresa}. 👋\nPara montar seu orçamento eu preciso de duas informações: o que você precisa e a região do serviço. Pode mandar por texto ou áudio.",
      "Oi, {nome}! Recebi sua mensagem.\nMe conta rapidinho o que está acontecendo que eu já vejo a melhor data para atender você.",
    ],
    restaurante: [
      "Olá! Aqui é o {empresa}. 🍽️\nEstamos atendendo {horario}. Quer ver o cardápio, fazer um pedido ou reservar uma mesa?",
      "Oi! Obrigado pelo contato.\nPedidos para entrega saem em média em 40 minutos. Me manda seu pedido e o endereço que eu já confirmo o valor.",
    ],
    escola: [
      "Olá! Aqui é a {empresa}. 👋\nVocê quer informação sobre matrícula, sobre um aluno já matriculado ou sobre valores e turmas?",
      "Oi, {nome}! Obrigado por procurar a {empresa}.\nMe diz a idade/série do aluno que eu te passo as turmas com vaga e os horários.",
    ],
  },
  "menu-setores": {
    geral: [
      "Olá! Você chegou na {empresa}. Para falar com a pessoa certa, responda com o número:\n\n1️⃣ Comercial — quero contratar ou pedir orçamento\n2️⃣ Financeiro — boleto, nota fiscal, pagamento\n3️⃣ Suporte — já sou cliente e preciso de ajuda\n4️⃣ Outro assunto",
      "Oi! Para agilizar seu atendimento, escolha uma opção:\n\n1 · Falar com vendas\n2 · Segunda via / financeiro\n3 · Suporte técnico\n4 · Falar com um atendente\n\nÉ só responder com o número.",
    ],
    contabilidade: [
      "Olá! Aqui é a {empresa}. Escolha o setor:\n\n1️⃣ Fiscal — notas, impostos e guias\n2️⃣ Pessoal — folha, admissão e demissão\n3️⃣ Contábil — balanços e relatórios\n4️⃣ Societário — abertura e alteração\n5️⃣ Financeiro do escritório",
    ],
    clinica: [
      "Olá! Aqui é a {empresa}. Como posso ajudar?\n\n1️⃣ Agendar consulta\n2️⃣ Remarcar ou cancelar\n3️⃣ Resultado de exame\n4️⃣ Convênio e valores\n5️⃣ Falar com a recepção",
    ],
  },
  "fora-horario": {
    geral: [
      "Oi! Obrigado pela mensagem. 🌙\nNosso atendimento é {horario} e agora estamos fora desse horário.\nPode deixar sua mensagem aqui — assim que abrirmos, ela é a primeira da fila.",
      "Olá! Recebemos seu contato fora do horário de atendimento.\nA equipe volta {horario}. Se for urgente, escreva URGENTE nesta conversa que priorizamos na abertura.",
      "Boa noite! 🌙 A {empresa} está fechada no momento.\nDeixe aqui o que você precisa (pode mandar documentos e fotos também) que respondemos no próximo dia útil.",
    ],
    contabilidade: [
      "Olá! O escritório está fechado agora — atendemos {horario}.\nSe for envio de documento ou nota, pode mandar por aqui mesmo: fica registrado e a equipe processa na abertura.",
    ],
    clinica: [
      "Olá! A {empresa} está fora do horário de atendimento ({horario}).\nSe for emergência, procure o pronto atendimento mais próximo. Para agendar ou remarcar, deixe sua mensagem que retornamos na abertura.",
    ],
    restaurante: [
      "Oi! No momento estamos fechados. 🌙\nAtendemos {horario} e os pedidos voltam a ser aceitos na abertura. Se quiser, já deixe seu pedido registrado aqui.",
    ],
  },
  ausencia: {
    geral: [
      "Oi, {nome}! Sua mensagem chegou. ✅\nNossos atendentes estão em conversa neste momento — você é o próximo na fila.\nAssim que liberar, {atendente} continua com você por aqui.",
      "Recebemos seu contato! No momento o time está com alta demanda.\nRetornamos ainda hoje, dentro do horário {horario}. Se puder adiantar o assunto, é só escrever aqui embaixo.",
      "Olá! Estou te colocando na fila de atendimento agora. ⏳\nNão precisa reenviar a mensagem — quando o atendente entrar, ele já vê tudo o que você escreveu.",
    ],
  },
  confirmacao: {
    geral: [
      "Oi, {nome}! Confirmando nosso compromisso: {horario}.\nSe precisar remarcar, responda REMARCAR que eu já abro a agenda para você.",
      "Olá, {nome}! Está tudo certo para {horario}?\nResponda com 1 para confirmar ou 2 se precisar de outro dia.",
    ],
    clinica: [
      "Olá, {nome}! Passando para confirmar sua consulta na {empresa}: {horario}.\nChegue 10 minutos antes e traga documento e carteirinha do convênio.\nResponda 1 para confirmar ou 2 para remarcar.",
    ],
    imobiliaria: [
      "Oi, {nome}! Confirmando a visita ao imóvel: {horario}.\n{atendente} encontra você no local. Responda 1 para confirmar ou 2 se precisar de outro horário.",
    ],
    escola: [
      "Olá! Confirmando a visita à {empresa}: {horario}.\nVocê conhece a estrutura, fala com a coordenação e tira dúvidas sobre a turma. Responda 1 para confirmar.",
    ],
  },
  lembrete: {
    geral: [
      "Oi, {nome}! Lembrete rápido: {horario} é o nosso compromisso.\nQualquer imprevisto, me avisa por aqui que a gente ajusta.",
      "Olá, {nome}! Ainda estamos aguardando o que combinamos.\nSe já tiver enviado, pode ignorar esta mensagem — se não, é só mandar por aqui.",
    ],
    contabilidade: [
      "Olá, {nome}! Lembrete da {empresa}: ainda não recebemos os documentos deste mês.\nPara não perder o prazo, pode mandar por aqui mesmo até {horario}. Se já enviou, desconsidere. 🙂",
      "Oi, {nome}! A guia deste mês vence em breve.\nEla já está disponível — quer que eu reenvie o boleto por aqui?",
    ],
    servicos: [
      "Oi, {nome}! Passando para lembrar do atendimento marcado para {horario}.\nSe precisar remarcar, me avisa com antecedência que eu ajusto sem custo.",
    ],
  },
  orcamento: {
    geral: [
      "Recebi seu pedido de orçamento, {nome}! 📋\nVou levantar os valores e te respondo até {horario}.\nSe tiver alguma foto ou detalhe que ajude, pode mandar agora.",
      "Oi, {nome}! Seu orçamento está sendo preparado.\nPara fechar o valor certo, me confirma: prazo desejado e quantidade. Assim que tiver, mando aqui mesmo.",
    ],
    servicos: [
      "Oi, {nome}! Para montar o orçamento eu preciso de três coisas:\n• O que precisa ser feito\n• Endereço ou região\n• Prazo que você gostaria\n\nCom isso eu te respondo com valor e data disponível.",
    ],
    imobiliaria: [
      "Oi, {nome}! Separei as opções que combinam com o que você procura.\nMe diz qual chamou sua atenção que eu já te passo valores, condições e agendo a visita.",
    ],
  },
  "pos-venda": {
    geral: [
      "Oi, {nome}! Conseguimos resolver o que você precisava? ✅\nSe ficou alguma dúvida, é só responder aqui — a conversa continua com o mesmo atendente.",
      "Olá, {nome}! Obrigado por falar com a {empresa}.\nDe 0 a 10, o quanto você recomendaria nosso atendimento? Sua resposta ajuda a melhorar. 🙏",
    ],
    clinica: [
      "Oi, {nome}! Como você está depois do atendimento na {empresa}?\nSe precisar de retorno ou tiver dúvida sobre a orientação, é só responder por aqui.",
    ],
    loja: [
      "Oi, {nome}! Seu pedido já chegou? 📦\nSe estiver tudo certo, adoraríamos sua avaliação. Se algo não saiu como esperado, me avisa que a gente resolve.",
    ],
  },
};

/** Mensagens da categoria + segmento, com fallback para o texto geral. */
export function gerar(categoria: CategoriaId, segmento: SegmentoId): string[] {
  const porCategoria = B[categoria] ?? {};
  const especificas = porCategoria[segmento] ?? [];
  const gerais = porCategoria.geral ?? [];
  const todas = segmento === "geral" ? gerais : [...especificas, ...gerais];
  return todas.length > 0 ? todas : gerais;
}

export function aplicarVariaveis(
  texto: string,
  valores: Partial<Record<"nome" | "empresa" | "horario" | "atendente", string>>,
): string {
  return texto
    .replace(/\{nome\}/g, valores.nome?.trim() || "{nome}")
    .replace(/\{empresa\}/g, valores.empresa?.trim() || "{empresa}")
    .replace(/\{horario\}/g, valores.horario?.trim() || "{horario}")
    .replace(/\{atendente\}/g, valores.atendente?.trim() || "{atendente}");
}
