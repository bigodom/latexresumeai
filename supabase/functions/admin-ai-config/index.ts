import { createClient } from 'npm:@supabase/supabase-js@2';
import { normalizeParameters, PROVIDER_MODELS, secretNameFor } from '../_shared/ai/configuration.ts';
import type { AIProviderName } from '../_shared/ai/types.ts';

const localOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
const headers = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && localOrigins.has(origin) ? origin : 'http://localhost:3000',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
  'Vary': 'Origin',
});
const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: headers(origin) });

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
  if (Deno.env.get('LOCAL_ADMIN_ENABLED') !== 'true') {
    return json({ error: 'Função administrativa local desativada.' }, 404, origin);
  }
  if (!origin || !localOrigins.has(origin)) return json({ error: 'Painel disponível somente em localhost.' }, 403, origin);
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Método não permitido.' }, 405, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceKey || !authorization?.startsWith('Bearer ')) {
    return json({ error: 'Configuração ou sessão ausente.' }, 401, origin);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return json({ error: 'Sessão inválida ou expirada.' }, 401, origin);
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const loadState = async () => {
    const [{ data: configurations, error: configError }, { data: prompts, error: promptError }] = await Promise.all([
      admin.from('ai_configurations').select('*').order('created_at', { ascending: false }),
      admin.from('ai_prompt_versions').select('id,prompt_key,version,prompt_text,created_at').order('created_at', { ascending: false }),
    ]);
    if (configError || promptError) throw new Error('configuration_load_failed');
    return {
      configurations,
      prompts,
      availableSecrets: {
        deepseek: Boolean(Deno.env.get('DEEPSEEK_API_KEY')),
        gemini: Boolean(Deno.env.get('GEMINI_API_KEY')),
        openai: Boolean(Deno.env.get('OPENAI_API_KEY')),
      },
    };
  };

  if (request.method === 'GET') {
    try {
      return json(await loadState(), 200, origin);
    } catch {
      return json({ error: 'Não foi possível carregar as configurações.' }, 500, origin);
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corpo inválido.' }, 400, origin);
  }

  if (body.action === 'list') {
    try {
      return json(await loadState(), 200, origin);
    } catch {
      return json({ error: 'Não foi possível carregar as configurações.' }, 500, origin);
    }
  }

  if (body.action === 'create_prompt') {
    const version = typeof body.version === 'string' ? body.version.trim().toLowerCase() : '';
    const promptText = typeof body.promptText === 'string' ? body.promptText.trim() : '';
    if (!/^[a-z0-9._-]{1,80}$/.test(version) || promptText.length < 20 || promptText.length > 12_000) {
      return json({ error: 'Versão ou conteúdo do prompt inválido.' }, 400, origin);
    }
    const { data, error } = await admin.from('ai_prompt_versions').insert({
      prompt_key: 'resume', version, prompt_text: promptText, created_by: authData.user.id,
    }).select().single();
    if (error) return json({ error: error.code === '23505' ? 'Essa versão já existe.' : 'Não foi possível criar o prompt.' }, 400, origin);
    return json({ prompt: data }, 201, origin);
  }

  if (body.action === 'create_configuration') {
    const provider = body.provider as AIProviderName;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const promptVersionId = typeof body.promptVersionId === 'string' ? body.promptVersionId : '';
    if (!Object.hasOwn(PROVIDER_MODELS, provider) || name.length < 3 || name.length > 100 || !/^[0-9a-f-]{36}$/i.test(promptVersionId)) {
      return json({ error: 'Configuração inválida.' }, 400, origin);
    }
    const parameters = normalizeParameters(provider, body.parameters);
    const { data, error } = await admin.from('ai_configurations').insert({
      name,
      provider,
      model: PROVIDER_MODELS[provider],
      parameters,
      prompt_version_id: promptVersionId,
      created_by: authData.user.id,
    }).select().single();
    if (error) return json({ error: 'Não foi possível criar a configuração.' }, 400, origin);
    return json({ configuration: data }, 201, origin);
  }

  if (body.action === 'activate_configuration') {
    const configurationId = typeof body.configurationId === 'string' ? body.configurationId : '';
    const { data: configuration } = await admin.from('ai_configurations')
      .select('provider').eq('id', configurationId).single();
    if (!configuration) return json({ error: 'Configuração não encontrada.' }, 404, origin);
    const provider = configuration.provider as AIProviderName;
    if (!Deno.env.get(secretNameFor(provider))) {
      return json({ error: `Configure ${secretNameFor(provider)} antes de ativar.` }, 409, origin);
    }
    const { error } = await admin.rpc('activate_ai_configuration', { p_configuration_id: configurationId });
    if (error) return json({ error: 'Não foi possível ativar a configuração.' }, 400, origin);
    return json({ activated: configurationId }, 200, origin);
  }

  return json({ error: 'Ação desconhecida.' }, 400, origin);
});
