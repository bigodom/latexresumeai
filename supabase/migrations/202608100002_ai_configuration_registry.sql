create table public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null default 'resume' check (prompt_key ~ '^[a-z0-9_-]{1,50}$'),
  version text not null check (version ~ '^[a-z0-9._-]{1,80}$'),
  prompt_text text not null check (char_length(prompt_text) between 20 and 12000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (prompt_key, version)
);

create table public.ai_configurations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 100),
  provider text not null check (provider in ('deepseek', 'gemini', 'openai')),
  model text not null check (
    (provider = 'deepseek' and model = 'deepseek-v4-flash') or
    (provider = 'gemini' and model = 'gemini-3.6-flash') or
    (provider = 'openai' and model = 'gpt-5.6-luna')
  ),
  parameters jsonb not null default '{}'::jsonb check (jsonb_typeof(parameters) = 'object'),
  prompt_version_id uuid not null references public.ai_prompt_versions(id),
  is_active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index ai_configurations_one_active_idx
  on public.ai_configurations (is_active) where is_active;

alter table public.generation_requests
  add column ai_provider text check (ai_provider is null or ai_provider in ('deepseek', 'gemini', 'openai')),
  add column ai_configuration_id uuid references public.ai_configurations(id) on delete restrict;

alter table public.resume_versions
  add column ai_provider text check (ai_provider is null or ai_provider in ('deepseek', 'gemini', 'openai')),
  add column ai_configuration_id uuid references public.ai_configurations(id) on delete restrict;

alter table public.ai_prompt_versions enable row level security;
alter table public.ai_configurations enable row level security;
revoke all on public.ai_prompt_versions, public.ai_configurations from public, anon, authenticated;
grant all on public.ai_prompt_versions, public.ai_configurations to service_role;

create or replace function public.protect_ai_prompt_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'prompt_versions_are_immutable' using errcode = '55000';
end;
$$;

create trigger ai_prompt_versions_immutable
before update or delete on public.ai_prompt_versions
for each row execute function public.protect_ai_prompt_version();

create or replace function public.protect_ai_configuration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'ai_configurations_are_immutable' using errcode = '55000';
  end if;
  if new.id is distinct from old.id
     or new.name is distinct from old.name
     or new.provider is distinct from old.provider
     or new.model is distinct from old.model
     or new.parameters is distinct from old.parameters
     or new.prompt_version_id is distinct from old.prompt_version_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'ai_configurations_are_immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger ai_configurations_immutable
before update or delete on public.ai_configurations
for each row execute function public.protect_ai_configuration();

do $$
declare v_prompt_id uuid;
begin
  insert into public.ai_prompt_versions (prompt_key, version, prompt_text)
  values (
    'resume',
    'resume-alpha-v1',
    'Priorize clareza, concisão e termos relevantes para a vaga quando eles já estiverem explicitamente comprovados no perfil. Organize as experiências da mais recente para a mais antiga. Use bullets orientados a ação sem adicionar resultados, números ou responsabilidades não informados.'
  ) returning id into v_prompt_id;

  insert into public.ai_configurations
    (name, provider, model, parameters, prompt_version_id, is_active)
  values
    ('DeepSeek V4 Flash — econômico', 'deepseek', 'deepseek-v4-flash',
      '{"thinking":"disabled","reasoningEffort":"low","sampling":"temperature","temperature":0.2,"topP":1,"maxOutputTokens":5000}'::jsonb,
      v_prompt_id, true),
    ('Gemini 3.6 Flash — padrão', 'gemini', 'gemini-3.6-flash',
      '{"thinkingLevel":"medium","maxOutputTokens":5000}'::jsonb,
      v_prompt_id, false),
    ('GPT-5.6 Luna — econômico', 'openai', 'gpt-5.6-luna',
      '{"reasoningEffort":"low","reasoningMode":"standard","verbosity":"low","maxOutputTokens":5000}'::jsonb,
      v_prompt_id, false);
end $$;

create or replace function public.snapshot_generation_ai_configuration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.ai_configurations%rowtype;
  v_prompt public.ai_prompt_versions%rowtype;
begin
  select * into v_config from public.ai_configurations where is_active limit 1;
  if not found then raise exception 'active_ai_configuration_not_found' using errcode = 'P0002'; end if;
  select * into v_prompt from public.ai_prompt_versions where id = v_config.prompt_version_id;

  new.ai_configuration_id := v_config.id;
  new.ai_provider := v_config.provider;
  new.model := v_config.model;
  new.prompt_version := v_prompt.version;
  return new;
end;
$$;

create trigger generation_snapshot_ai_configuration
before insert on public.generation_requests
for each row execute function public.snapshot_generation_ai_configuration();

create or replace function public.snapshot_resume_ai_configuration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_request public.generation_requests%rowtype;
begin
  select * into v_request from public.generation_requests where id = new.generation_id;
  if not found then raise exception 'generation_not_found' using errcode = 'P0002'; end if;
  new.ai_configuration_id := v_request.ai_configuration_id;
  new.ai_provider := v_request.ai_provider;
  return new;
end;
$$;

create trigger resume_snapshot_ai_configuration
before insert on public.resume_versions
for each row execute function public.snapshot_resume_ai_configuration();

create or replace function public.activate_ai_configuration(p_configuration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.ai_configurations where id = p_configuration_id) then
    raise exception 'configuration_not_found' using errcode = 'P0002';
  end if;
  update public.ai_configurations set is_active = false where is_active;
  update public.ai_configurations set is_active = true where id = p_configuration_id;
end;
$$;

revoke all on function public.activate_ai_configuration(uuid) from public, anon, authenticated;
grant execute on function public.activate_ai_configuration(uuid) to service_role;
revoke all on function public.snapshot_generation_ai_configuration() from public, anon, authenticated;
revoke all on function public.snapshot_resume_ai_configuration() from public, anon, authenticated;
revoke all on function public.protect_ai_prompt_version() from public, anon, authenticated;
revoke all on function public.protect_ai_configuration() from public, anon, authenticated;
