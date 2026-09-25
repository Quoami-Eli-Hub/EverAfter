
create table if not exists private.event_access_tokens (
  token_hash bytea primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists event_access_tokens_event_expiry_idx on private.event_access_tokens(event_id, expires_at);

create or replace function private.has_event_access(p_event_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.event_access_tokens t
    where t.event_id = p_event_id
      and t.expires_at > now()
      and t.token_hash = extensions.digest(
        coalesce((current_setting('request.headers', true)::jsonb ->> 'x-event-access-token'), ''),
        'sha256'
      )
  );
$$;
revoke all on function private.has_event_access(bigint) from public;
grant execute on function private.has_event_access(bigint) to anon, authenticated;

create or replace function public.get_event_gate(p_slug text)
returns table(title text, event_type text, visibility text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.title, e.event_type, e.visibility
  from public.events e
  where e.slug = p_slug
    and e.status = 'published'
    and e.visibility in ('public','protected')
  limit 1;
$$;
revoke all on function public.get_event_gate(text) from public;
grant execute on function public.get_event_gate(text) to anon, authenticated;

create or replace function public.unlock_event(p_slug text, p_password text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
  v_hash text;
  v_token text;
begin
  if char_length(p_password) < 8 or char_length(p_password) > 128 then
    return null;
  end if;
  select e.id, s.password_hash into v_event_id, v_hash
  from public.events e
  join private.event_secrets s on s.event_id = e.id
  where e.slug = p_slug and e.status = 'published' and e.visibility = 'protected';
  if v_event_id is null or v_hash is null or extensions.crypt(p_password, v_hash) <> v_hash then
    return null;
  end if;
  delete from private.event_access_tokens where expires_at <= now();
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.event_access_tokens(token_hash,event_id,expires_at)
  values (extensions.digest(v_token,'sha256'), v_event_id, now() + interval '24 hours');
  return v_token;
end;
$$;
revoke all on function public.unlock_event(text,text) from public;
grant execute on function public.unlock_event(text,text) to anon, authenticated;

create or replace function public.set_event_password(p_event_id bigint, p_password text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.events e where e.id = p_event_id and e.owner_id = (select auth.uid())
  ) then raise exception 'not authorized'; end if;
  if char_length(p_password) < 8 or char_length(p_password) > 128 then
    raise exception 'password must contain 8 to 128 characters';
  end if;
  insert into private.event_secrets(event_id,password_hash,updated_at)
  values (p_event_id, extensions.crypt(p_password, extensions.gen_salt('bf',12)), now())
  on conflict (event_id) do update set password_hash=excluded.password_hash, updated_at=now();
  delete from private.event_access_tokens where event_id=p_event_id;
end;
$$;
revoke all on function public.set_event_password(bigint,text) from public;
grant execute on function public.set_event_password(bigint,text) to authenticated;

create or replace function public.clear_event_password(p_event_id bigint)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.events e where e.id = p_event_id and e.owner_id = (select auth.uid())
  ) then raise exception 'not authorized'; end if;
  delete from private.event_secrets where event_id=p_event_id;
  delete from private.event_access_tokens where event_id=p_event_id;
end;
$$;
revoke all on function public.clear_event_password(bigint) from public;
grant execute on function public.clear_event_password(bigint) to authenticated;

drop policy if exists events_anon_protected_select on public.events;
create policy events_anon_protected_select on public.events for select to anon
using (status='published' and visibility='protected' and private.has_event_access(id));
drop policy if exists events_authenticated_protected_select on public.events;
create policy events_authenticated_protected_select on public.events for select to authenticated
using (status='published' and visibility='protected' and private.has_event_access(id));

drop policy if exists sections_protected_select on public.event_sections;
create policy sections_protected_select on public.event_sections for select to anon, authenticated
using (is_visible and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists schedules_protected_select on public.schedule_items;
create policy schedules_protected_select on public.schedule_items for select to anon, authenticated
using (is_public and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists venues_protected_select on public.venues;
create policy venues_protected_select on public.venues for select to anon, authenticated
using (is_public and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists albums_protected_select on public.albums;
create policy albums_protected_select on public.albums for select to anon, authenticated
using (is_public and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists media_protected_select on public.media;
create policy media_protected_select on public.media for select to anon, authenticated
using (is_public and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists documents_protected_select on public.documents;
create policy documents_protected_select on public.documents for select to anon, authenticated
using (is_public and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists tributes_protected_select on public.tributes;
create policy tributes_protected_select on public.tributes for select to anon, authenticated
using (status='approved' and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));
drop policy if exists rsvps_protected_insert on public.rsvps;
create policy rsvps_protected_insert on public.rsvps for insert to anon, authenticated
with check (party_size <= (select e.max_party_size from public.events e where e.id=event_id) and exists(select 1 from public.events e where e.id=event_id and e.status='published' and e.visibility='protected' and e.rsvp_enabled and (e.rsvp_deadline is null or e.rsvp_deadline>=now()) and private.has_event_access(e.id)));
drop policy if exists tributes_protected_insert on public.tributes;
create policy tributes_protected_insert on public.tributes for insert to anon, authenticated
with check (status='pending' and exists(select 1 from public.events e where e.id=event_id and e.event_type='memorial' and e.status='published' and e.visibility='protected' and private.has_event_access(e.id)));

drop policy if exists event_media_protected_select on storage.objects;
create policy event_media_protected_select on storage.objects for select to anon, authenticated
using (
  bucket_id='event-media'
  and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
  and (
    exists(select 1 from public.media m join public.events e on e.id=m.event_id where m.storage_path=name and m.is_public and e.status='published' and e.visibility='protected' and private.has_event_access(e.id))
    or exists(select 1 from public.documents d join public.events e on e.id=d.event_id where d.storage_path=name and d.is_public and d.allow_download and e.status='published' and e.visibility='protected' and private.has_event_access(e.id))
  )
);

