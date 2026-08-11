import type { AIConfiguration, AIProviderName } from './types.ts';

const configurations: Record<AIProviderName, AIConfiguration> = {
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    parameters: {
      thinking: 'disabled',
      reasoningEffort: 'low',
      sampling: 'temperature',
      temperature: 0.2,
      topP: 1,
      maxOutputTokens: 5000,
    },
  },
  gemini: {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    parameters: { thinkingLevel: 'medium', maxOutputTokens: 5000 },
  },
  openai: {
    provider: 'openai',
    model: 'gpt-5.6-luna',
    parameters: {
      reasoningEffort: 'low',
      reasoningMode: 'standard',
      verbosity: 'low',
      maxOutputTokens: 5000,
    },
  },
};

export const configurationFor = (rawProvider: string | undefined): AIConfiguration => {
  const provider = rawProvider || 'deepseek';
  if (provider !== 'deepseek' && provider !== 'gemini' && provider !== 'openai') {
    throw new Error('invalid_ai_provider');
  }
  return configurations[provider];
};

export const secretNameFor = (provider: AIProviderName) => ({
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
})[provider];
