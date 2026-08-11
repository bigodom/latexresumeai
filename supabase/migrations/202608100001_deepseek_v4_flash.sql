-- Identifica corretamente as gerações criadas após a troca do provedor/modelo.
alter table public.generation_requests
  alter column prompt_version set default 'alpha-v2-deepseek-v4';
