import { AdaptationMode, ResumeVersion } from '../types';
import { supabase } from './supabaseClient';

interface GenerateResumeResponse {
  generationId?: string;
  generation_id?: string;
  remainingCredits?: number;
  remaining_credits?: number;
  resumeVersion?: Record<string, unknown>;
  resume_version?: Record<string, unknown>;
}

export interface GenerateResumeResult {
  generationId: string;
  resumeVersion: ResumeVersion;
  remainingCredits: number;
}

const normalizeResumeVersion = (raw: Record<string, unknown>): ResumeVersion => {
  const latex = raw.latex;
  if (typeof latex !== 'string' || !latex.trim()) {
    throw new Error('O backend concluiu a geração, mas não retornou um documento LaTeX válido.');
  }

  return {
    id: String(raw.id ?? ''),
    latex,
    generatedContent: raw.generatedContent ?? raw.generated_content,
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    jobTitle: (raw.jobTitle ?? raw.job_title ?? null) as string | null,
    company: (raw.company ?? null) as string | null,
    adaptationMode: (raw.adaptationMode ?? raw.adaptation_mode) as AdaptationMode | undefined,
  };
};

export const generateResumeLatex = async (
  profileText: string,
  jobDescription: string,
  adaptationMode: AdaptationMode = AdaptationMode.FAITHFUL
): Promise<GenerateResumeResult> => {
  const idempotencyKey = crypto.randomUUID();
  const { data, error } = await supabase.functions.invoke<GenerateResumeResponse>(
    'generate-resume',
    {
      body: { profileText, jobDescription, adaptationMode, idempotencyKey },
    }
  );

  if (error) {
    let message = error.message;
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const body = await response.clone().json() as { error?: string; message?: string };
        message = body.error ?? body.message ?? message;
      } catch {
        // O erro padrão do cliente continua útil quando o corpo não é JSON.
      }
    }
    throw new Error(message || 'Não foi possível gerar o currículo.');
  }

  if (!data) throw new Error('O backend não retornou os dados da geração.');
  const rawVersion = data.resumeVersion ?? data.resume_version;
  const remainingCredits = data.remainingCredits ?? data.remaining_credits;
  const generationId = data.generationId ?? data.generation_id;

  if (!rawVersion || typeof remainingCredits !== 'number' || !generationId) {
    throw new Error('A resposta do backend está incompleta. Tente novamente.');
  }

  return {
    generationId,
    resumeVersion: normalizeResumeVersion(rawVersion),
    remainingCredits,
  };
};

export const listResumeVersions = async (limit = 8): Promise<ResumeVersion[]> => {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('id, latex, generated_content, adaptation_mode, created_at, jobs(title, company)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const relation = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    const job = (relation ?? {}) as Record<string, unknown>;
    return normalizeResumeVersion({
      ...row,
      job_title: job.title,
      company: job.company,
    });
  });
};
