import { supabase } from './supabaseClient';

export type AdminProvider = 'deepseek' | 'gemini' | 'openai';

export interface PromptVersion {
  id: string;
  prompt_key: string;
  version: string;
  prompt_text: string;
  created_at: string;
}

export interface AIConfigurationRow {
  id: string;
  name: string;
  provider: AdminProvider;
  model: string;
  parameters: Record<string, unknown>;
  prompt_version_id: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminAIState {
  configurations: AIConfigurationRow[];
  prompts: PromptVersion[];
  availableSecrets: Record<AdminProvider, boolean>;
}

const invokeAdmin = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<T>('admin-ai-config', { body });
  if (error) {
    let message = error.message;
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const parsed = await response.clone().json() as { error?: string };
        message = parsed.error ?? message;
      } catch {
        // Mantém a mensagem segura retornada pelo cliente.
      }
    }
    throw new Error(message);
  }
  if (!data) throw new Error('O painel não recebeu resposta do backend.');
  return data;
};

export const loadAdminAIState = () => invokeAdmin<AdminAIState>({ action: 'list' });
export const createPromptVersion = (version: string, promptText: string) =>
  invokeAdmin({ action: 'create_prompt', version, promptText });
export const createAIConfiguration = (input: {
  name: string;
  provider: AdminProvider;
  promptVersionId: string;
  parameters: Record<string, unknown>;
}) => invokeAdmin({ action: 'create_configuration', ...input });
export const activateAIConfiguration = (configurationId: string) =>
  invokeAdmin({ action: 'activate_configuration', configurationId });
