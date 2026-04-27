import { generateForProvider } from "./providers";

export async function writeFullPageWithAI({
  briefingJson,
  keyword,
  productFacts,
}: {
  briefingJson: any;
  keyword: string;
  productFacts: string;
}): Promise<string> {
  const system = `Você é um Redator SEO Senior e Especialista em Conversão (pt-BR).
Sua tarefa é transformar um ROTEIRO (briefing) em um ARTIGO COMPLETO, PERSUASIVO e OTIMIZADO.

REGRAS CRÍTICAS:
1. NÃO use linguajar genérico ("No mundo de hoje", "É fundamental").
2. FOCO EM SOLUÇÃO: Use os fatos do produto (Ideia Chat) para ancorar promessas. Fonte de verdade: product_facts e briefing; não invente preços, limites, integrações ou métricas.
3. CONCORRENTES: Não cite marcas, blogs ou produtos de concorrentes por nome salvo se estiverem explicitamente no briefing — prefira "soluções não oficiais", "outras plataformas".
4. ESTRUTURA: Siga os H2s e H3s do briefing. Parágrafos curtos; um H2 por secção; listas com bullets legíveis e **negrito** no gancho de cada item quando fizer sentido.
5. Se o roteiro tiver seções com listas que viram grelha no site: no **primeiro** H2 com bullets, use **4 ou 6** itens (grelha 2 col); no **segundo** H2 com bullets, use **3 ou 6** (grelha 3 col) quando houver dois blocos de lista encadeados.
6. TOM: profissional pt-BR (tom_de_voz do briefing), sem hype; sem frases de meta-instrução ("Incorpore LSI", "Desenvolva com dados...").
7. INFORMATION GAIN: Inclua os pontos únicos do briefing; afirmações técnicas só com suporte em product_facts.
8. FORMATO: Retorne APENAS o Markdown (sem título H1, pois ele é inserido pelo sistema).`;

  const user = `
### ROTEIRO (BRIEFING)
${JSON.stringify(briefingJson, null, 2)}

### FATOS DO PRODUTO (ÚNICA FONTE DE VERDADE)
${productFacts}

### PALAVRA-CHAVE ALVO
${keyword}

### INSTRUÇÃO
Escreva o corpo do artigo em Markdown seguindo a estrutura de H2/H3 do briefing. 
Desenvolva cada parágrafo com profundidade, mas mantendo a clareza. 
Incorpore as palavras-chave LSI de forma natural.
O tom deve ser: ${briefingJson.tom_de_voz || 'profissional e direto'}.
`;

  const response = await generateForProvider("anthropic", {
    system,
    user,
    temperature: 0.7,
  });

  return response.text.trim();
}
