import type { AIProviderAdapter } from '../types.ts';

export const generateWithDeepSeek: AIProviderAdapter = async ({
  apiKey, configuration, systemPrompt, userData, signal,
}) => {
  const parameters = configuration.parameters;
  const body: Record<string, unknown> = {
    model: configuration.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userData },
    ],
    response_format: { type: 'json_object' },
    thinking: { type: parameters.thinking },
    max_tokens: parameters.maxOutputTokens,
    stream: false,
  };
  if (parameters.thinking === 'enabled') {
    body.reasoning_effort = parameters.reasoningEffort;
  } else if (parameters.sampling === 'temperature') {
    body.temperature = parameters.temperature;
  } else if (parameters.sampling === 'top_p') {
    body.top_p = parameters.topP;
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(`provider_${response.status}`);
  const result = await response.json() as Record<string, any>;
  const choice = result.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('truncated_model_output');
  const text = choice?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('empty_model_output');
  return {
    rawContent: JSON.parse(text),
    inputTokens: Number(result.usage?.prompt_tokens ?? 0),
    outputTokens: Number(result.usage?.completion_tokens ?? 0),
  };
};
