-- Remove o painel/registro dinâmico de IA. Esta migration também limpa projetos
-- onde a versão administrativa anterior chegou a ser aplicada.
drop trigger if exists generation_snapshot_ai_configuration on public.generation_requests;
drop trigger if exists resume_snapshot_ai_configuration on public.resume_versions;

alter table public.resume_versions
  drop column if exists ai_configuration_id,
  drop column if exists ai_provider;

alter table public.generation_requests
  drop column if exists ai_configuration_id,
  drop column if exists ai_provider,
  alter column prompt_version set default 'resume-v1';

drop table if exists public.ai_configurations;
drop table if exists public.ai_prompt_versions;

drop function if exists public.activate_ai_configuration(uuid);
drop function if exists public.snapshot_generation_ai_configuration();
drop function if exists public.snapshot_resume_ai_configuration();
drop function if exists public.protect_ai_prompt_version();
drop function if exists public.protect_ai_configuration();
