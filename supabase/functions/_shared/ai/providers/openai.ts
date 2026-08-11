import { RESUME_JSON_SCHEMA } from '../resume.ts';
import type { AIProviderAdapter } from '../types.ts';

const privacyPreservingIdentifier = async (userId: string) => {
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const responseText = (body: Record<string, any>) => {
  if (typeof body.output_text === 'string') return body.output_text;
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return null;
};

export const generateWithOpenAI: AIProviderAdapter = async ({
  apiKey, configuration, systemPrompt, userData, userId, signal,
}) => {
  const parameters = configuration.parameters;
  const reasoning: Record<string, string> = { effort: String(parameters.reasoningEffort) };
  if (parameters.reasoningMode === 'pro') reasoning.mode = 'pro';

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: configuration.model,
      instructions: systemPrompt,
      input: userData,
      reasoning,
      text: {
        verbosity: parameters.verbosity,
        format: {
          type: 'json_schema',
          name: 'resume_content',
          strict: true,
          schema: RESUME_JSON_SCHEMA,
        },
      },
      max_output_tokens: parameters.maxOutputTokens,
      safety_identifier: await privacyPreservingIdentifier(userId),
      store: false,
    }),
    signal,
  });
  if (!response.ok) throw new Error(`provider_${response.status}`);
  const result = await response.json() as Record<string, any>;
  if (result.status === 'incomplete') throw new Error('truncated_model_output');
  const text = responseText(result);
  if (!text?.trim()) throw new Error('empty_model_output');
  return {
    rawContent: JSON.parse(text),
    inputTokens: Number(result.usage?.input_tokens ?? 0),
    outputTokens: Number(result.usage?.output_tokens ?? 0),
  };
};
