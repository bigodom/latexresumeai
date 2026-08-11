import type { AIProviderAdapter, AIProviderName } from '../types.ts';
import { generateWithDeepSeek } from './deepseek.ts';
import { generateWithGemini } from './gemini.ts';
import { generateWithOpenAI } from './openai.ts';

const adapters: Record<AIProviderName, AIProviderAdapter> = {
  deepseek: generateWithDeepSeek,
  gemini: generateWithGemini,
  openai: generateWithOpenAI,
};

export const adapterFor = (provider: AIProviderName) => adapters[provider];
