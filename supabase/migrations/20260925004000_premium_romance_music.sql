alter table public.events add column music_path text;
alter table public.events drop constraint events_theme_key_check;
alter table public.events add constraint events_theme_key_check check (theme_key in ('classic','garden','editorial','cinematic','minimalist','romance'));
alter table public.events add constraint events_music_path_check check (music_path is null or music_path=id::text||'/track.mp3');
create or replace function private.enforce_event_plan() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_op='INSERT' then
      if new.plan_paid or new.plan_code<>'starter' or new.branding_removed or new.storage_limit_bytes<>5368709120 or new.storage_used_bytes<>0 then
        raise exception 'Plan access is managed by verified payments';
      end if;
    else
      if new.plan_paid is distinct from old.plan_paid or new.plan_code is distinct from old.plan_code
        or new.branding_removed is distinct from old.branding_removed or new.storage_limit_bytes is distinct from old.storage_limit_bytes then
        raise exception 'Plan access is managed by verified payments';
      end if;
      if new.storage_used_bytes is distinct from old.storage_used_bytes and pg_trigger_depth()=1 then
        raise exception 'Storage usage is managed by uploads';
      end if;
    end if;
  end if;
  if tg_op='INSERT' and new.owner_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=new.owner_id and p.is_admin) then
    new.plan_code:='premium';
    new.plan_paid:=true;
    new.branding_removed:=true;
    select storage_bytes into new.storage_limit_bytes from public.event_plans where code='premium';
  end if;
  if new.status='published' and not new.plan_paid then raise exception 'Purchase a plan before publishing'; end if;
  if new.theme_key in ('cinematic','minimalist','romance') and (new.plan_code<>'premium' or not new.plan_paid) then
    raise exception 'This template requires an active Premium plan';
  end if;
  if new.music_path is not null and (new.plan_code<>'premium' or not new.plan_paid) then
    raise exception 'Music requires an active Premium plan';
  end if;
  return new;
end $$;

-- One replaceable soundtrack per event, capped at 20 MB, in a private bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('event-music','event-music',false,20971520,array['audio/mpeg']);
create policy music_editor_insert on storage.objects for insert to authenticated with check (
 bucket_id='event-music' and exists(select 1 from public.events e
 where name=e.id::text||'/track.mp3' and e.plan_code='premium' and e.plan_paid
 and private.has_event_role(e.id,array['owner','planner'])));
create policy music_editor_update on storage.objects for update to authenticated using (
 bucket_id='event-music' and exists(select 1 from public.events e
 where name=e.id::text||'/track.mp3' and e.plan_code='premium' and e.plan_paid
 and private.has_event_role(e.id,array['owner','planner']))) with check (
 bucket_id='event-music' and exists(select 1 from public.events e
 where name=e.id::text||'/track.mp3' and e.plan_code='premium' and e.plan_paid
 and private.has_event_role(e.id,array['owner','planner'])));
create policy music_editor_delete on storage.objects for delete to authenticated using (
 bucket_id='event-music' and exists(select 1 from public.events e
 where name=e.id::text||'/track.mp3' and private.has_event_role(e.id,array['owner','planner'])));
create policy music_editor_read on storage.objects for select to authenticated using (
 bucket_id='event-music' and exists(select 1 from public.events e
 where name=e.id::text||'/track.mp3' and private.has_event_role(e.id,array['owner','planner'])));
-- The events table RLS also applies here, including protected-event access tokens.
create policy music_guest_read on storage.objects for select to anon,authenticated using (
 bucket_id='event-music' and exists(select 1 from public.events e
 where e.music_path=name and e.plan_paid and e.plan_code='premium'
 and e.status='published' and (e.visibility='public' or
 (e.visibility='protected' and private.has_event_access(e.id)))));
