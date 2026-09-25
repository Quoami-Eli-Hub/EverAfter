
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id bigint generated always as identity primary key,
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('wedding','memorial')),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  status text not null default 'draft' check (status in ('draft','published','unpublished','suspended')),
  visibility text not null default 'private' check (visibility in ('public','protected','private')),
  event_date date,
  timezone text not null default 'Africa/Accra',
  excerpt text,
  cover_path text,
  theme_key text not null default 'classic',
  color_key text not null default 'sage',
  font_key text not null default 'editorial',
  allow_photo_downloads boolean not null default false,
  rsvp_enabled boolean not null default true,
  rsvp_deadline timestamptz,
  max_party_size smallint not null default 5 check (max_party_size between 1 and 20),
  storage_limit_bytes bigint not null default 5368709120 check (storage_limit_bytes > 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table private.event_secrets (
  event_id bigint primary key references public.events(id) on delete cascade,
  password_hash text,
  updated_at timestamptz not null default now()
);
alter table private.event_secrets enable row level security;
alter table private.event_secrets force row level security;

create table public.event_sections (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  section_key text not null,
  heading text,
  body jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, section_key)
);

create table public.schedule_items (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_id bigint,
  sort_order smallint not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.venues (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  name text not null,
  address text,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  map_url text,
  directions text,
  sort_order smallint not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.schedule_items
  add constraint schedule_items_venue_id_fkey
  foreign key (venue_id) references public.venues(id) on delete set null;

create table public.rsvps (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 7 and 30),
  attending boolean not null,
  party_size smallint not null default 1 check (party_size between 1 and 20),
  checked_in_at timestamptz,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.albums (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  cover_media_id bigint,
  allow_downloads boolean not null default false,
  is_public boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  album_id bigint references public.albums(id) on delete set null,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image','poster')),
  mime_type text not null,
  original_name text not null,
  byte_size bigint not null check (byte_size > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  caption text,
  allow_download boolean not null default false,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.albums
  add constraint albums_cover_media_id_fkey
  foreign key (cover_media_id) references public.media(id) on delete set null;

create table public.documents (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  storage_path text not null unique,
  document_type text not null check (document_type in ('funeral_program','poster','other')),
  title text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  byte_size bigint not null check (byte_size > 0),
  allow_download boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tributes (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  author_name text not null check (char_length(trim(author_name)) between 2 and 120),
  message text not null check (char_length(trim(message)) between 2 and 3000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event_id bigint references public.events(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index event_sections_event_sort_idx on public.event_sections(event_id, sort_order);
create index schedule_items_event_starts_idx on public.schedule_items(event_id, starts_at);
create index schedule_items_venue_id_idx on public.schedule_items(venue_id);
create index venues_event_sort_idx on public.venues(event_id, sort_order);
create index rsvps_event_created_idx on public.rsvps(event_id, created_at desc);
create index rsvps_event_attending_idx on public.rsvps(event_id, attending);
create index albums_event_sort_idx on public.albums(event_id, sort_order);
create index albums_cover_media_id_idx on public.albums(cover_media_id);
create index media_event_sort_idx on public.media(event_id, sort_order);
create index media_album_sort_idx on public.media(album_id, sort_order);
create index documents_event_created_idx on public.documents(event_id, created_at desc);
create index tributes_event_status_created_idx on public.tributes(event_id, status, created_at desc);
create index tributes_pending_idx on public.tributes(event_id, created_at) where status = 'pending';
create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_event_created_idx on public.audit_logs(event_id, created_at desc);
create index events_public_slug_idx on public.events(slug) where status = 'published' and visibility = 'public';

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function private.set_updated_at();
create trigger event_sections_set_updated_at before update on public.event_sections
for each row execute function private.set_updated_at();
create trigger rsvps_set_updated_at before update on public.rsvps
for each row execute function private.set_updated_at();
create trigger albums_set_updated_at before update on public.albums
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_sections enable row level security;
alter table public.schedule_items enable row level security;
alter table public.venues enable row level security;
alter table public.rsvps enable row level security;
alter table public.albums enable row level security;
alter table public.media enable row level security;
alter table public.documents enable row level security;
alter table public.tributes enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_owner_select on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_owner_update on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy events_public_select on public.events for select to anon, authenticated
using (status = 'published' and visibility = 'public');
create policy events_owner_select on public.events for select to authenticated
using ((select auth.uid()) = owner_id);
create policy events_owner_insert on public.events for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy events_owner_update on public.events for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy events_owner_delete on public.events for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy sections_public_select on public.event_sections for select to anon, authenticated
using (is_visible and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy sections_owner_all on public.event_sections for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy schedules_public_select on public.schedule_items for select to anon, authenticated
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy schedules_owner_all on public.schedule_items for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy venues_public_select on public.venues for select to anon, authenticated
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy venues_owner_all on public.venues for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy rsvps_guest_insert on public.rsvps for insert to anon, authenticated
with check (
  party_size <= (select e.max_party_size from public.events e where e.id = event_id)
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.visibility = 'public'
      and e.rsvp_enabled and (e.rsvp_deadline is null or e.rsvp_deadline >= now())
  )
);
create policy rsvps_owner_all on public.rsvps for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy albums_public_select on public.albums for select to anon, authenticated
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy albums_owner_all on public.albums for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy media_public_select on public.media for select to anon, authenticated
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy media_owner_all on public.media for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy documents_public_select on public.documents for select to anon, authenticated
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy documents_owner_all on public.documents for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy tributes_public_select on public.tributes for select to anon, authenticated
using (status = 'approved' and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy tributes_guest_insert on public.tributes for insert to anon, authenticated
with check (
  status = 'pending'
  and exists (select 1 from public.events e where e.id = event_id and e.event_type = 'memorial' and e.status = 'published' and e.visibility = 'public')
);
create policy tributes_owner_all on public.tributes for all to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

create policy audit_owner_select on public.audit_logs for select to authenticated
using (actor_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

grant usage on schema public to anon, authenticated;
grant select on public.events, public.event_sections, public.schedule_items, public.venues, public.albums, public.media, public.documents, public.tributes to anon;
grant insert on public.rsvps, public.tributes to anon;
grant select, insert, update, delete on public.profiles, public.events, public.event_sections, public.schedule_items, public.venues, public.rsvps, public.albums, public.media, public.documents, public.tributes to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  false,
  26214400,
  array['image/jpeg','image/png','image/webp','application/pdf']::text[]
);

create policy event_media_owner_select on storage.objects for select to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy event_media_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy event_media_owner_update on storage.objects for update to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy event_media_owner_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
create policy event_media_public_download on storage.objects for select to anon, authenticated
using (
  bucket_id = 'event-media'
  and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
  and (
    exists (
      select 1 from public.media m
      join public.events e on e.id = m.event_id
      left join public.albums a on a.id = m.album_id
      where m.storage_path = name and m.is_public
        and e.status = 'published' and e.visibility = 'public'
        and (m.allow_download or (a.allow_downloads and e.allow_photo_downloads))
    )
    or exists (
      select 1 from public.documents d
      join public.events e on e.id = d.event_id
      where d.storage_path = name and d.is_public and d.allow_download
        and e.status = 'published' and e.visibility = 'public'
    )
  )
);

