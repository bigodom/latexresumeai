import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.VITE_API_KEY || process.argv[2];

if (!API_KEY) {
  console.error("❌ Informe a API key: node test-gemini.mjs SUA_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

console.log("🔄 Testando conexão com Gemini 3.5 Flash...\n");

try {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: "Responda apenas: API funcionando.",
  });

  console.log("✅ Conexão OK!");
  console.log("📨 Resposta:", response.text.trim());
} catch (err) {
  console.error("❌ Erro:", err.message);
}
