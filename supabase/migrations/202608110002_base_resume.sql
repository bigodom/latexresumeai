alter table public.profiles
  add column base_resume_text text not null default ''
    check (char_length(base_resume_text) <= 50000),
  add column base_resume_updated_at timestamptz;

create or replace function public.save_base_resume(p_resume_text text)
returns table (base_resume_text text, base_resume_updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_resume_text text := trim(coalesce(p_resume_text, ''));
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if char_length(v_resume_text) not between 1 and 50000 then
    raise exception 'invalid_base_resume' using errcode = '22023';
  end if;

  return query
  update public.profiles
  set base_resume_text = v_resume_text,
      base_resume_updated_at = now()
  where id = v_user_id
  returning profiles.base_resume_text, profiles.base_resume_updated_at;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.save_base_resume(text) from public, anon;
grant execute on function public.save_base_resume(text) to authenticated;
