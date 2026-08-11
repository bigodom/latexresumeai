import { createClient } from 'npm:@supabase/supabase-js@2';
import { configurationFor, secretNameFor } from '../_shared/ai/configuration.ts';
import { buildSystemPrompt, buildUserData, PROMPT_VERSION } from '../_shared/ai/prompt.ts';
import { adapterFor } from '../_shared/ai/providers/index.ts';
import { renderLatex, validateContent } from '../_shared/ai/resume.ts';

const MAX_PROFILE_LENGTH = 50_000;
const MAX_JOB_LENGTH = 30_000;
const REQUEST_TIMEOUT_MS = 75_000;
const MODES = new Set(['faithful', 'strategic', 'gap_analysis']);

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:3000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  });

const cleanString = (value: unknown, max = 1_000) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, max);
};

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405, origin);
  if (origin && !allowedOrigins.includes(origin)) return json({ error: 'Origem não permitida.' }, 403, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('generate-resume: required Supabase secret missing');
    return json({ error: 'Serviço temporariamente indisponível.' }, 503, origin);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Faça login novamente.' }, 401, origin);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Sessão inválida ou expirada.' }, 401, origin);

  let configuration;
  try {
    configuration = configurationFor(Deno.env.get('AI_PROVIDER'));
  } catch {
    console.error('generate-resume: invalid AI_PROVIDER');
    return json({ error: 'Provedor de IA inválido.' }, 503, origin);
  }
  const apiKey = Deno.env.get(secretNameFor(configuration.provider));
  if (!apiKey) {
    console.error('generate-resume: active provider secret missing', { provider: configuration.provider });
    return json({ error: 'Serviço de IA temporariamente indisponível.' }, 503, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corpo da requisição inválido.' }, 400, origin);
  }

  const profileText = cleanString(body.profileText, MAX_PROFILE_LENGTH + 1);
  const jobDescription = cleanString(body.jobDescription, MAX_JOB_LENGTH + 1);
  const adaptationMode = cleanString(body.adaptationMode, 30);
  const idempotencyKey = cleanString(body.idempotencyKey, 100);
  if (!profileText || profileText.length > MAX_PROFILE_LENGTH ||
      !jobDescription || jobDescription.length > MAX_JOB_LENGTH ||
      !MODES.has(adaptationMode) || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
    return json({ error: 'Revise o currículo, a vaga e o modo selecionado.' }, 400, origin);
  }

  const { data: reservedRows, error: reserveError } = await userClient.rpc('reserve_generation', {
    p_idempotency_key: idempotencyKey,
    p_adaptation_mode: adaptationMode,
    p_job_description: jobDescription,
    p_job_title: cleanString(body.jobTitle, 200) || null,
    p_company: cleanString(body.company, 200) || null,
  });
  if (reserveError) {
    const insufficient = reserveError.message.includes('insufficient_credits');
    const limited = reserveError.message.includes('daily_limit');
    return json({ error: insufficient ? 'Você não possui créditos.' : limited ? 'Limite diário atingido.' : 'Não foi possível reservar a geração.' }, insufficient ? 402 : limited ? 429 : 400, origin);
  }

  const reservation = reservedRows?.[0];
  if (!reservation) return json({ error: 'Não foi possível iniciar a geração.' }, 500, origin);
  const generationId = reservation.generation_id as string;
  const remainingCredits = Number(reservation.remaining_credits);
  if (reservation.is_replay && reservation.status === 'succeeded') {
    const { data: existing } = await userClient.from('resume_versions')
      .select('*').eq('generation_id', generationId).single();
    if (existing) return json({ generationId, resumeVersion: existing, remainingCredits }, 200, origin);
  }
  if (reservation.is_replay) {
    return json({ error: 'Esta geração ainda está em processamento.', generationId }, 409, origin);
  }

  try {
    const { data: snapshot, error: snapshotError } = await admin
      .from('generation_requests')
      .update({ model: configuration.model, prompt_version: PROMPT_VERSION })
      .eq('id', generationId)
      .eq('user_id', authData.user.id)
      .eq('status', 'reserved')
      .select('id')
      .single();
    if (snapshotError || !snapshot) throw new Error('generation_metadata_failed');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let providerResult;
    try {
      providerResult = await adapterFor(configuration.provider)({
        apiKey,
        configuration,
        systemPrompt: buildSystemPrompt(adaptationMode),
        userData: buildUserData(profileText, jobDescription),
        userId: authData.user.id,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const content = validateContent(providerResult.rawContent);
    const latex = renderLatex(content);
    const { data: completed, error: completeError } = await admin.rpc('complete_generation', {
      p_generation_id: generationId,
      p_user_id: authData.user.id,
      p_profile_snapshot: profileText,
      p_generated_content: content,
      p_latex: latex,
      p_model: configuration.model,
      p_input_tokens: providerResult.inputTokens,
      p_output_tokens: providerResult.outputTokens,
    });
    if (completeError || !completed?.[0]) throw new Error('persistence_failed');
    const row = completed[0];
    return json({
      generationId,
      resumeVersion: row.resume_version,
      remainingCredits: Number(row.remaining_credits),
    }, 200, origin);
  } catch (error) {
    const code = error instanceof DOMException && error.name === 'AbortError'
      ? 'timeout'
      : error instanceof Error ? error.message.slice(0, 100) : 'internal_error';
    console.error('generate-resume failed', { generationId, code });
    await admin.rpc('refund_generation', {
      p_generation_id: generationId,
      p_user_id: authData.user.id,
      p_error_code: code,
    });
    return json({ error: 'A geração falhou e o crédito foi devolvido.', generationId }, 502, origin);
  }
});
