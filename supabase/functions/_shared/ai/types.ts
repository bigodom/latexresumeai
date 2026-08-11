export type AIProviderName = 'deepseek' | 'gemini' | 'openai';

export type AIParameters = {
  maxOutputTokens: number;
  thinking?: 'enabled' | 'disabled';
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  reasoningMode?: 'standard' | 'pro';
  thinkingLevel?: 'low' | 'medium' | 'high';
  verbosity?: 'low' | 'medium' | 'high';
  sampling?: 'default' | 'temperature' | 'top_p';
  temperature?: number;
  topP?: number;
};

export type AIConfiguration = {
  id: string;
  name: string;
  provider: AIProviderName;
  model: string;
  parameters: AIParameters;
  promptVersion: string;
  promptText: string;
};

export type ResumeContent = {
  name: string;
  contactLines: string[];
  summary: string;
  experiences: Array<{ heading: string; dates: string; bullets: string[] }>;
  skills: string[];
  education: Array<{ heading: string; details: string }>;
  gaps: string[];
};

export type ProviderInput = {
  apiKey: string;
  configuration: AIConfiguration;
  systemPrompt: string;
  userData: string;
  userId: string;
  signal: AbortSignal;
};

export type ProviderResult = {
  rawContent: unknown;
  inputTokens: number;
  outputTokens: number;
};

export type AIProviderAdapter = (input: ProviderInput) => Promise<ProviderResult>;
