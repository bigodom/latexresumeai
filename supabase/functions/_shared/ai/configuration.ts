import type { AIConfiguration, AIParameters, AIProviderName } from './types.ts';

export const PROVIDER_MODELS: Record<AIProviderName, string> = {
  deepseek: 'deepseek-v4-flash',
  gemini: 'gemini-3.6-flash',
  openai: 'gpt-5.6-luna',
};

const isNumberBetween = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export const normalizeParameters = (provider: AIProviderName, raw: unknown): AIParameters => {
  const value = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const maxOutputTokens = isNumberBetween(value.maxOutputTokens, 500, 20_000)
    ? Math.floor(value.maxOutputTokens as number)
    : 5000;

  if (provider === 'deepseek') {
    const thinking = value.thinking === 'enabled' ? 'enabled' : 'disabled';
    const effort = ['low', 'high', 'max'].includes(String(value.reasoningEffort))
      ? value.reasoningEffort as 'low' | 'high' | 'max'
      : 'low';
    const sampling = ['default', 'temperature', 'top_p'].includes(String(value.sampling))
      ? value.sampling as 'default' | 'temperature' | 'top_p'
      : 'default';
    return {
      maxOutputTokens,
      thinking,
      reasoningEffort: effort,
      sampling: thinking === 'enabled' ? 'default' : sampling,
      temperature: isNumberBetween(value.temperature, 0, 2) ? value.temperature as number : 1,
      topP: isNumberBetween(value.topP, 0, 1) ? value.topP as number : 1,
    };
  }

  if (provider === 'gemini') {
    return {
      maxOutputTokens,
      thinkingLevel: ['low', 'medium', 'high'].includes(String(value.thinkingLevel))
        ? value.thinkingLevel as 'low' | 'medium' | 'high'
        : 'medium',
    };
  }

  return {
    maxOutputTokens,
    reasoningEffort: ['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(String(value.reasoningEffort))
      ? value.reasoningEffort as AIParameters['reasoningEffort']
      : 'low',
    reasoningMode: value.reasoningMode === 'pro' ? 'pro' : 'standard',
    verbosity: ['low', 'medium', 'high'].includes(String(value.verbosity))
      ? value.verbosity as 'low' | 'medium' | 'high'
      : 'low',
  };
};

export const normalizeConfiguration = (row: Record<string, any>): AIConfiguration => {
  const provider = row.provider as AIProviderName;
  if (!Object.hasOwn(PROVIDER_MODELS, provider) || row.model !== PROVIDER_MODELS[provider]) {
    throw new Error('invalid_ai_configuration');
  }
  const prompt = Array.isArray(row.ai_prompt_versions)
    ? row.ai_prompt_versions[0]
    : row.ai_prompt_versions;
  if (!prompt?.version || !prompt?.prompt_text) throw new Error('invalid_prompt_configuration');
  return {
    id: String(row.id),
    name: String(row.name),
    provider,
    model: row.model,
    parameters: normalizeParameters(provider, row.parameters),
    promptVersion: String(prompt.version),
    promptText: String(prompt.prompt_text),
  };
};

export const secretNameFor = (provider: AIProviderName) => ({
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
})[provider];
