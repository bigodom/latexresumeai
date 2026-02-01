import { GoogleGenAI } from "@google/genai";

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
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateResumeLatex = async (
  profileText: string, 
  jobDescription: string
): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert Resume Writer and LaTeX developer.
    
    TASK:
    Create a complete, compilable LaTeX resume code based on the provided USER PROFILE and targeted specifically for the JOB DESCRIPTION.
    
    USER PROFILE (Raw Text/PDF extraction):
    ${profileText}
    
    TARGET JOB DESCRIPTION:
    ${jobDescription}
    
    REQUIREMENTS:
    1. **Language**: Detect the language of the User Profile and Job Description (e.g., Portuguese). Generate the resume content in that dominant language.
    2. **Tailoring**: Rephrase skills and experiences from the User Profile to match keywords and requirements in the Job Description. Highlight relevant achievements.
    3. **Format**: Use a clean, modern, professional LaTeX layout (e.g., using 'geometry', 'titlesec', 'enumitem' packages). Avoid complex external dependencies or obscure classes. Use the standard 'article' class or a self-contained definition.
    4. **Content**:
       - Header (Name, Contact - placeholder if missing)
       - Professional Summary (Tailored to the job)
       - Experience (Bulleted achievements, quantified where possible)
       - Skills (Categorized)
       - Education
    5. **Output**: Return ONLY the LaTeX code. Do not wrap it in markdown code blocks (no \`\`\`latex). Start directly with \\documentclass.
    6. **Sanitization**: Ensure special characters (like &, %, $) are properly escaped in the LaTeX content.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let latexCode = response.text || "";

    if (latexCode.startsWith("```latex")) {
      latexCode = latexCode.replace(/^```latex\n/, "").replace(/\n```$/, "");
    } else if (latexCode.startsWith("```")) {
      latexCode = latexCode.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Aplica a regra solicitada: transformar \ em \\
    latexCode = latexCode.replace(/\\/g, '\\\\');

    return latexCode;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate resume. Please try again.");
  }
};