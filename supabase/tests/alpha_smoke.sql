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
