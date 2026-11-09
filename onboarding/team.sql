-- KGEN team accounts: lets a logged-in team member add or list teammates from the onboarding admin.
-- Logins are username@kgen-crm.local (same accounts as the KGEN Lead CRM).
create or replace function public.kgen_create_team_user(p_username text, p_password text, p_display text default null)
returns uuid
language plpgsql security definer
set search_path = public, auth, extensions
as $$
declare uid uuid := gen_random_uuid(); em text;
begin
  if auth.role() <> 'authenticated' then raise exception 'Not allowed'; end if;
  p_username := lower(trim(p_username));
  if p_username !~ '^[a-z0-9._-]{2,32}$' then raise exception 'Username can only use letters, numbers, dots and dashes'; end if;
  if length(coalesce(p_password,'')) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  em := p_username || '@kgen-crm.local';
  if exists (select 1 from auth.users where email = em) then raise exception 'That username already exists'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', coalesce(nullif(trim(p_display), ''), p_username)),
    now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
    'email', now(), now(), now());
  return uid;
end $$;

create or replace function public.kgen_list_team()
returns table (username text, display_name text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'authenticated' then raise exception 'Not allowed'; end if;
  return query
    select split_part(u.email, '@', 1)::text, coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))::text,
           u.created_at, u.last_sign_in_at
    from auth.users u where u.email like '%@kgen-crm.local' order by u.created_at;
end $$;

revoke all on function public.kgen_create_team_user(text, text, text) from public, anon;
revoke all on function public.kgen_list_team() from public, anon;
grant execute on function public.kgen_create_team_user(text, text, text) to authenticated;
grant execute on function public.kgen_list_team() to authenticated;
notify pgrst, 'reload schema';
