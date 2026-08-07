create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  company text,
  description text not null check (char_length(description) between 1 and 30000),
  created_at timestamptz not null default now()
);

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  idempotency_key uuid not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'succeeded', 'failed')),
  adaptation_mode text not null
    check (adaptation_mode in ('faithful', 'strategic', 'gap_analysis')),
  model text,
  prompt_version text not null default 'alpha-v1',
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, idempotency_key)
);

create table public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  generation_id uuid not null unique references public.generation_requests(id) on delete cascade,
  profile_snapshot text not null check (char_length(profile_snapshot) between 1 and 50000),
  generated_content jsonb not null,
  latex text not null check (char_length(latex) between 1 and 100000),
  adaptation_mode text not null
    check (adaptation_mode in ('faithful', 'strategic', 'gap_analysis')),
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.generation_requests(id) on delete set null,
  amount integer not null check (amount <> 0),
  reason text not null check (char_length(reason) between 1 and 100),
  created_at timestamptz not null default now()
);

create unique index credit_ledger_generation_reason_idx
  on public.credit_ledger (generation_id, reason)
  where generation_id is not null;
create index jobs_user_created_idx on public.jobs (user_id, created_at desc);
create index generations_user_created_idx on public.generation_requests (user_id, created_at desc);
create index resumes_user_created_idx on public.resume_versions (user_id, created_at desc);
create index ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, credits)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.generation_requests enable row level security;
alter table public.resume_versions enable row level security;
alter table public.credit_ledger enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy jobs_select_own on public.jobs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy generations_select_own on public.generation_requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy resumes_select_own on public.resume_versions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ledger_select_own on public.credit_ledger
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.jobs, public.generation_requests,
  public.resume_versions, public.credit_ledger from anon, authenticated;
grant select on public.profiles, public.jobs, public.generation_requests,
  public.resume_versions, public.credit_ledger to authenticated;
grant all on public.profiles, public.jobs, public.generation_requests,
  public.resume_versions, public.credit_ledger to service_role;

create or replace function public.reserve_generation(
  p_idempotency_key uuid,
  p_adaptation_mode text,
  p_job_description text,
  p_job_title text default null,
  p_company text default null
)
returns table (
  generation_id uuid,
  job_id uuid,
  status text,
  remaining_credits integer,
  is_replay boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_existing public.generation_requests%rowtype;
  v_job_id uuid;
  v_generation_id uuid;
  v_daily_count integer;
begin
  if v_user_id is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_adaptation_mode not in ('faithful', 'strategic', 'gap_analysis') then
    raise exception 'invalid_adaptation_mode' using errcode = '22023';
  end if;
  if char_length(trim(p_job_description)) not between 1 and 30000 then
    raise exception 'invalid_job_description' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then raise exception 'profile_not_found' using errcode = 'P0002'; end if;

  select * into v_existing
  from public.generation_requests
  where user_id = v_user_id and idempotency_key = p_idempotency_key;

  if found then
    return query select v_existing.id, v_existing.job_id, v_existing.status,
      v_profile.credits, true;
    return;
  end if;

  select count(*) into v_daily_count
  from public.generation_requests as request
  where request.user_id = v_user_id
    and request.created_at >= date_trunc('day', now());
  if v_daily_count >= 5 then raise exception 'daily_limit' using errcode = 'P0001'; end if;

  if v_profile.credits <= 0 then raise exception 'insufficient_credits' using errcode = 'P0001'; end if;

  insert into public.jobs (user_id, title, company, description)
  values (v_user_id, nullif(trim(p_job_title), ''), nullif(trim(p_company), ''), trim(p_job_description))
  returning id into v_job_id;

  insert into public.generation_requests
    (user_id, job_id, idempotency_key, adaptation_mode)
  values (v_user_id, v_job_id, p_idempotency_key, p_adaptation_mode)
  returning id into v_generation_id;

  update public.profiles set credits = credits - 1 where id = v_user_id;
  insert into public.credit_ledger (user_id, generation_id, amount, reason)
  values (v_user_id, v_generation_id, -1, 'generation_reserved');

  return query select v_generation_id, v_job_id, 'reserved'::text,
    v_profile.credits - 1, false;
end;
$$;

create or replace function public.complete_generation(
  p_generation_id uuid,
  p_user_id uuid,
  p_profile_snapshot text,
  p_generated_content jsonb,
  p_latex text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer
)
returns table (resume_version public.resume_versions, remaining_credits integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.generation_requests%rowtype;
  v_resume public.resume_versions%rowtype;
  v_credits integer;
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if char_length(trim(p_profile_snapshot)) not between 1 and 50000
     or char_length(trim(p_latex)) not between 1 and 100000 then
    raise exception 'invalid_generated_document' using errcode = '22023';
  end if;

  select * into v_request from public.generation_requests
  where id = p_generation_id and user_id = p_user_id for update;
  if not found then raise exception 'generation_not_found' using errcode = 'P0002'; end if;

  if v_request.status = 'succeeded' then
    select * into v_resume from public.resume_versions where generation_id = p_generation_id;
  elsif v_request.status = 'reserved' then
    insert into public.resume_versions
      (user_id, job_id, generation_id, profile_snapshot, generated_content, latex,
       adaptation_mode, model, prompt_version)
    values
      (p_user_id, v_request.job_id, v_request.id, trim(p_profile_snapshot),
       p_generated_content, trim(p_latex), v_request.adaptation_mode, p_model,
       v_request.prompt_version)
    returning * into v_resume;

    update public.generation_requests
    set status = 'succeeded', model = p_model,
        input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
        output_tokens = greatest(coalesce(p_output_tokens, 0), 0),
        completed_at = now(), error_code = null
    where id = p_generation_id;
  else
    raise exception 'generation_already_failed' using errcode = 'P0001';
  end if;

  select credits into v_credits from public.profiles where id = p_user_id;
  return query select v_resume, v_credits;
end;
$$;

create or replace function public.refund_generation(
  p_generation_id uuid,
  p_user_id uuid,
  p_error_code text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_credits integer;
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;

  perform 1 from public.generation_requests
  where id = p_generation_id and user_id = p_user_id and status = 'reserved' for update;

  if found then
    update public.generation_requests
    set status = 'failed', error_code = left(coalesce(p_error_code, 'internal_error'), 100),
        completed_at = now()
    where id = p_generation_id;
    update public.profiles set credits = credits + 1 where id = p_user_id;
    insert into public.credit_ledger (user_id, generation_id, amount, reason)
    values (p_user_id, p_generation_id, 1, 'generation_refunded')
    on conflict do nothing;
  end if;

  select credits into v_credits from public.profiles where id = p_user_id;
  return v_credits;
end;
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default 'alpha_invite'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_credits integer;
begin
  if auth.role() <> 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_amount <= 0 or p_amount > 1000 then raise exception 'invalid_amount' using errcode = '22023'; end if;
  update public.profiles set credits = credits + p_amount where id = p_user_id
  returning credits into v_credits;
  if not found then raise exception 'profile_not_found' using errcode = 'P0002'; end if;
  insert into public.credit_ledger (user_id, amount, reason)
  values (p_user_id, p_amount, left(coalesce(nullif(trim(p_reason), ''), 'alpha_invite'), 100));
  return v_credits;
end;
$$;

revoke all on function public.reserve_generation(uuid, text, text, text, text) from public, anon;
grant execute on function public.reserve_generation(uuid, text, text, text, text) to authenticated;
revoke all on function public.complete_generation(uuid, uuid, text, jsonb, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.complete_generation(uuid, uuid, text, jsonb, text, text, integer, integer) to service_role;
revoke all on function public.refund_generation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.refund_generation(uuid, uuid, text) to service_role;
revoke all on function public.grant_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, text) to service_role;
