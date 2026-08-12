import { supabase } from './supabaseClient';

export const MAX_BASE_RESUME_LENGTH = 50_000;

export interface BaseResume {
  text: string;
  updatedAt: string | null;
}

export const loadBaseResume = async (): Promise<BaseResume> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('base_resume_text, base_resume_updated_at')
    .single();

  if (error) throw new Error('Não foi possível carregar seu currículo salvo.');

  return {
    text: typeof data?.base_resume_text === 'string' ? data.base_resume_text : '',
    updatedAt: typeof data?.base_resume_updated_at === 'string'
      ? data.base_resume_updated_at
      : null,
  };
};

export const saveBaseResume = async (text: string): Promise<BaseResume> => {
  const normalizedText = text.trim();
  if (!normalizedText || normalizedText.length > MAX_BASE_RESUME_LENGTH) {
    throw new Error('O currículo deve ter entre 1 e 50.000 caracteres.');
  }

  const { data, error } = await supabase
    .rpc('save_base_resume', { p_resume_text: normalizedText })
    .single();

  if (error || !data) throw new Error('Não foi possível salvar seu currículo. Tente novamente.');
  const row = data as Record<string, unknown>;

  return {
    text: String(row.base_resume_text ?? normalizedText),
    updatedAt: typeof row.base_resume_updated_at === 'string'
      ? row.base_resume_updated_at
      : new Date().toISOString(),
  };
};
