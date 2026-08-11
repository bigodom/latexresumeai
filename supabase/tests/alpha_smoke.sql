-- Execute against the local stack. Everything is rolled back.
begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alpha-a@example.invalid', '', now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'alpha-b@example.invalid', '', now(), now());

set local role service_role;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000000","role":"service_role"}';
select public.grant_credits('11111111-1111-4111-8111-111111111111', 2, 'smoke_test');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
begin
  if (select credits from public.profiles where id = auth.uid()) <> 2 then
    raise exception 'grant or own-profile RLS failed';
  end if;
end $$;

select * from public.reserve_generation(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'faithful', 'Synthetic job', null, null
);
-- Replay must not consume another credit.
select * from public.reserve_generation(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'faithful', 'Synthetic job', null, null
);

do $$
begin
  if (select credits from public.profiles where id = auth.uid()) <> 1 then
    raise exception 'idempotent debit failed';
  end if;
  if (select count(*) from public.credit_ledger where user_id = auth.uid() and amount = -1) <> 1 then
    raise exception 'ledger debit failed';
  end if;
  if (select ai_provider from public.generation_requests where user_id = auth.uid()) <> 'deepseek'
     or (select prompt_version from public.generation_requests where user_id = auth.uid()) <> 'resume-alpha-v1'
     or (select ai_configuration_id from public.generation_requests where user_id = auth.uid()) is null then
    raise exception 'AI configuration snapshot failed';
  end if;
  if has_table_privilege('authenticated', 'public.ai_configurations', 'select')
     or has_table_privilege('authenticated', 'public.ai_prompt_versions', 'select') then
    raise exception 'AI admin tables leaked to authenticated role';
  end if;
end $$;

-- User B must not see user A's rows.
set local "request.jwt.claims" = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$
begin
  if exists (select 1 from public.profiles where id = '11111111-1111-4111-8111-111111111111')
     or exists (select 1 from public.generation_requests where user_id = '11111111-1111-4111-8111-111111111111') then
    raise exception 'cross-user RLS failed';
  end if;
end $$;

set local role service_role;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000000","role":"service_role"}';
do $$
declare v_gemini uuid; v_deepseek uuid;
begin
  select id into v_gemini from public.ai_configurations where provider = 'gemini';
  select id into v_deepseek from public.ai_configurations where provider = 'deepseek';
  perform public.activate_ai_configuration(v_gemini);
  if (select count(*) from public.ai_configurations where is_active) <> 1
     or not (select is_active from public.ai_configurations where id = v_gemini) then
    raise exception 'atomic AI configuration activation failed';
  end if;
  perform public.activate_ai_configuration(v_deepseek);
end $$;
select * from public.complete_generation(
  (select id from public.generation_requests where user_id = '11111111-1111-4111-8111-111111111111'),
  '11111111-1111-4111-8111-111111111111',
  'Synthetic profile',
  '{"name":"Synthetic Candidate"}'::jsonb,
  '\\documentclass{article}\\begin{document}Synthetic\\end{document}',
  'test-model', 100, 50
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$
begin
  if (select count(*) from public.resume_versions where user_id = auth.uid()) <> 1 then
    raise exception 'completion or resume RLS failed';
  end if;
end $$;

rollback;
