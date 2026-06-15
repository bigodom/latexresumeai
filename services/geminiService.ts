import { GoogleGenAI } from "@google/genai";
import { LieLevel } from "../types";

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const apiKey = import.meta.env.VITE_API_KEY;

const getClient = () => {
  if (!apiKey) throw new Error("VITE_API_KEY não encontrada.");
  return new GoogleGenAI({ apiKey });
};

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const SHARED_LATEX_RULES = `
REGRAS OBRIGATÓRIAS DE LATEX:
- Use \\documentclass{article} com os pacotes: geometry, titlesec, enumitem, hyperref, fontenc (T1), inputenc (utf8).
- Layout clean e profissional: margens de 1.5cm nos lados, 1.8cm em cima e baixo.
- Escape TODOS os caracteres especiais do LaTeX no conteúdo textual:
    & → \\&    % → \\%    $ → \\$    # → \\#    _ → \\_
    { → \\{    } → \\}    ~ → \\textasciitilde{}    ^ → \\textasciicircum{}
- Seções: Cabeçalho, Resumo Profissional, Experiência, Habilidades, Formação.
- Use bullet points com \\item e ambientes itemize/enumerate do pacote enumitem.
- SAÍDA: apenas código LaTeX bruto. Sem blocos markdown. Comece com \\documentclass.
`;

const getPrompt = (
  profileText: string,
  jobDescription: string,
  lieLevel: LieLevel
): string => {
  const context = `
PERFIL DO CANDIDATO:
${profileText}

DESCRIÇÃO DA VAGA ALVO:
${jobDescription}
`;

  switch (lieLevel) {
    // ── NÍVEL 0: HONESTO ──────────────────────────────────────────────────────
    case LieLevel.HONEST:
      return `
Você é um especialista em currículos e otimização para sistemas ATS (Applicant Tracking Systems).

MISSÃO: Gerar um currículo LaTeX completo e compilável que maximize a pontuação em algoritmos ATS usando EXCLUSIVAMENTE as informações reais do candidato.

${context}

REGRAS DE CONTEÚDO — NÍVEL HONESTO:
1. Use SOMENTE o que está descrito no Perfil do Candidato. Não invente nada.
2. Reescreva as experiências e habilidades existentes incorporando as palavras-chave exatas da vaga de forma natural e honesta.
3. Reorganize as seções priorizando o que é mais relevante para esta vaga específica.
4. Quantifique conquistas já existentes no perfil quando possível (ex: "reduziu tempo de entrega" → "reduziu tempo de entrega em X%", mas só se o dado existir).
5. Se o candidato não tem uma habilidade exigida, NÃO a adicione. Enfatize habilidades transferíveis que ele realmente possui.
6. Resumo profissional: 3 linhas, direto, com as 2–3 palavras-chave mais críticas da vaga.
7. Idioma: detecte o idioma dominante do perfil/vaga e escreva o currículo inteiro nele.

${SHARED_LATEX_RULES}
`.trim();

    // ── NÍVEL 1: ADAPTADO ─────────────────────────────────────────────────────
    case LieLevel.ADAPTED:
      return `
Você é um especialista sênior em currículos, carreira e sistemas ATS.

MISSÃO: Gerar um currículo LaTeX completo e compilável que faça uma ponte inteligente entre as habilidades reais do candidato e os requisitos da vaga, usando transferência de conhecimento plausível.

${context}

REGRAS DE CONTEÚDO — NÍVEL ADAPTADO:
1. Use o Perfil do Candidato como base sólida, mas aplique bridging inteligente de habilidades transferíveis:
   - Experiência com Java REST API → apresentar como "Desenvolvimento de APIs RESTful" (cobrindo Node.js/TypeScript contextualmente)
   - MySQL → "gerenciamento de bancos de dados relacionais" (cobre PostgreSQL)
   - jQuery/JS puro → "desenvolvimento front-end JavaScript" (abrange React básico)
   - 1 ano e 8 meses → "2+ anos" se contextualmente razoável
   - Conhecimento teórico sólido em X → apresentar como habilidade aplicada em contexto profissional
2. Expanda as descrições de skills para serem mais abrangentes, sem ser explicitamente falso.
3. Adicione soft skills e metodologias padrão da área (Agile, Scrum, Git, CI/CD) se forem plausíveis para o perfil.
4. Reformule títulos de cargos sutilmente se aproximar da vaga for plausível (ex: "Estagiário Dev" → "Desenvolvedor Júnior").
5. Resumo profissional: posicione o candidato como alguém em transição natural e bem qualificado para esta vaga.
6. Idioma: detecte o idioma dominante do perfil/vaga e escreva o currículo inteiro nele.

${SHARED_LATEX_RULES}
`.trim();

    // ── NÍVEL 2: AUDACIOSO ────────────────────────────────────────────────────
    case LieLevel.AUDACIOUS:
      return `
Você é um estrategista de carreira especializado em criar currículos de alto impacto para sistemas ATS.

MISSÃO: Gerar um currículo LaTeX completo e compilável que seja 100% alinhado com a vaga, indistinguível de um candidato plenamente qualificado quando analisado por algoritmos ATS e recrutadores.

${context}

REGRAS DE CONTEÚDO — NÍVEL AUDACIOSO:
1. Use o Perfil do Candidato para: nome, contato, formação acadêmica base e contexto de background.
2. ADICIONE todas as tecnologias, ferramentas, frameworks e skills técnicas listadas na vaga como se o candidato as dominasse.
3. CRIE experiências profissionais plausíveis com:
   - Empresas com nomes realistas e genéricos (evite nomes famosos facilmente verificáveis)
   - Datas e períodos coerentes com a idade/formação do candidato
   - Responsabilidades que espelhem exatamente o que a vaga pede
   - Conquistas quantificadas e críveis (ex: "reduziu latência em 35%", "liderou equipe de 4 engenheiros", "aumentou cobertura de testes de 40% para 85%")
4. Resumo profissional: escreva como se fosse o candidato ideal descrito na própria vaga.
5. Skills: organize em categorias técnicas, incluindo TODOS os requisitos da vaga como proficiências.
6. O resultado deve passar em 100% dos filtros ATS e convencer um recrutador técnico a agendar entrevista.
7. Idioma: detecte o idioma dominante do perfil/vaga e escreva o currículo inteiro nele.

${SHARED_LATEX_RULES}
`.trim();
  }
};

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────

export const generateResumeLatex = async (
  profileText: string,
  jobDescription: string,
  lieLevel: LieLevel = LieLevel.HONEST
): Promise<string> => {
  const ai = getClient();
  const prompt = getPrompt(profileText, jobDescription, lieLevel);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let latexCode = response.text ?? "";

    // Remove fences de markdown caso o modelo adicione mesmo sendo instruído a não fazer
    latexCode = latexCode
      .replace(/^```latex\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return latexCode;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar o currículo. Tente novamente.");
  }
};
