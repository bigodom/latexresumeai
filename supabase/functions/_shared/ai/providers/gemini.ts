import { RESUME_JSON_SCHEMA } from '../resume.ts';
import type { AIProviderAdapter } from '../types.ts';

export const generateWithGemini: AIProviderAdapter = async ({
  apiKey, configuration, systemPrompt, userData, signal,
}) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configuration.model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userData }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: RESUME_JSON_SCHEMA,
          thinkingConfig: { thinkingLevel: configuration.parameters.thinkingLevel },
          maxOutputTokens: configuration.parameters.maxOutputTokens,
        },
      }),
      signal,
    },
  );
  if (!response.ok) throw new Error(`provider_${response.status}`);
  const result = await response.json() as Record<string, any>;
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') throw new Error('truncated_model_output');
  const text = candidate?.content?.parts?.find((part: Record<string, unknown>) => !part.thought)?.text;
  if (typeof text !== 'string' || !text.trim()) throw new Error('empty_model_output');
  return {
    rawContent: JSON.parse(text),
    inputTokens: Number(result.usageMetadata?.promptTokenCount ?? 0),
    outputTokens: Number(result.usageMetadata?.candidatesTokenCount ?? 0),
  };
};
