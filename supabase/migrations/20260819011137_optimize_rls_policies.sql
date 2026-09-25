
create policy event_secrets_deny_all on private.event_secrets
for all to anon, authenticated using (false) with check (false);

drop policy events_public_select on public.events;
drop policy events_owner_select on public.events;
create policy events_anon_public_select on public.events for select to anon
using (status = 'published' and visibility = 'public');
create policy events_authenticated_select on public.events for select to authenticated
using (owner_id = (select auth.uid()) or (status = 'published' and visibility = 'public'));

drop policy sections_public_select on public.event_sections;
drop policy sections_owner_all on public.event_sections;
create policy sections_anon_public_select on public.event_sections for select to anon
using (is_visible and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy sections_authenticated_select on public.event_sections for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_visible and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy sections_owner_insert on public.event_sections for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy sections_owner_update on public.event_sections for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy sections_owner_delete on public.event_sections for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy schedules_public_select on public.schedule_items;
drop policy schedules_owner_all on public.schedule_items;
create policy schedules_anon_public_select on public.schedule_items for select to anon
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy schedules_authenticated_select on public.schedule_items for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy schedules_owner_insert on public.schedule_items for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy schedules_owner_update on public.schedule_items for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy schedules_owner_delete on public.schedule_items for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy venues_public_select on public.venues;
drop policy venues_owner_all on public.venues;
create policy venues_anon_public_select on public.venues for select to anon
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy venues_authenticated_select on public.venues for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy venues_owner_insert on public.venues for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy venues_owner_update on public.venues for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy venues_owner_delete on public.venues for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy albums_public_select on public.albums;
drop policy albums_owner_all on public.albums;
create policy albums_anon_public_select on public.albums for select to anon
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy albums_authenticated_select on public.albums for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy albums_owner_insert on public.albums for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy albums_owner_update on public.albums for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy albums_owner_delete on public.albums for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy media_public_select on public.media;
drop policy media_owner_all on public.media;
create policy media_anon_public_select on public.media for select to anon
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy media_authenticated_select on public.media for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy media_owner_insert on public.media for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy media_owner_update on public.media for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy media_owner_delete on public.media for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy documents_public_select on public.documents;
drop policy documents_owner_all on public.documents;
create policy documents_anon_public_select on public.documents for select to anon
using (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy documents_authenticated_select on public.documents for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (is_public and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy documents_owner_insert on public.documents for insert to authenticated
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy documents_owner_update on public.documents for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy documents_owner_delete on public.documents for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy rsvps_guest_insert on public.rsvps;
drop policy rsvps_owner_all on public.rsvps;
create policy rsvps_anon_insert on public.rsvps for insert to anon
with check (
  party_size <= (select e.max_party_size from public.events e where e.id = event_id)
  and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public' and e.rsvp_enabled and (e.rsvp_deadline is null or e.rsvp_deadline >= now()))
);
create policy rsvps_owner_select on public.rsvps for select to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy rsvps_authenticated_insert on public.rsvps for insert to authenticated
with check (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (
    party_size <= (select e.max_party_size from public.events e where e.id = event_id)
    and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public' and e.rsvp_enabled and (e.rsvp_deadline is null or e.rsvp_deadline >= now()))
  )
);
create policy rsvps_owner_update on public.rsvps for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy rsvps_owner_delete on public.rsvps for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy tributes_public_select on public.tributes;
drop policy tributes_guest_insert on public.tributes;
drop policy tributes_owner_all on public.tributes;
create policy tributes_anon_select on public.tributes for select to anon
using (status = 'approved' and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'));
create policy tributes_authenticated_select on public.tributes for select to authenticated
using (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (status = 'approved' and exists (select 1 from public.events e where e.id = event_id and e.status = 'published' and e.visibility = 'public'))
);
create policy tributes_anon_insert on public.tributes for insert to anon
with check (status = 'pending' and exists (select 1 from public.events e where e.id = event_id and e.event_type = 'memorial' and e.status = 'published' and e.visibility = 'public'));
create policy tributes_authenticated_insert on public.tributes for insert to authenticated
with check (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid()))
  or (status = 'pending' and exists (select 1 from public.events e where e.id = event_id and e.event_type = 'memorial' and e.status = 'published' and e.visibility = 'public'))
);
create policy tributes_owner_update on public.tributes for update to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())))
with check (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));
create policy tributes_owner_delete on public.tributes for delete to authenticated
using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = (select auth.uid())));

drop policy event_media_owner_select on storage.objects;
drop policy event_media_public_download on storage.objects;
create policy event_media_anon_download on storage.objects for select to anon
using (
  bucket_id = 'event-media'
  and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
  and (
    exists (select 1 from public.media m join public.events e on e.id = m.event_id left join public.albums a on a.id = m.album_id where m.storage_path = name and m.is_public and e.status = 'published' and e.visibility = 'public' and (m.allow_download or (a.allow_downloads and e.allow_photo_downloads)))
    or exists (select 1 from public.documents d join public.events e on e.id = d.event_id where d.storage_path = name and d.is_public and d.allow_download and e.status = 'published' and e.visibility = 'public')
  )
);
create policy event_media_authenticated_select on storage.objects for select to authenticated
using (
  bucket_id = 'event-media'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (
      storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
      and (
        exists (select 1 from public.media m join public.events e on e.id = m.event_id left join public.albums a on a.id = m.album_id where m.storage_path = name and m.is_public and e.status = 'published' and e.visibility = 'public' and (m.allow_download or (a.allow_downloads and e.allow_photo_downloads)))
        or exists (select 1 from public.documents d join public.events e on e.id = d.event_id where d.storage_path = name and d.is_public and d.allow_download and e.status = 'published' and e.visibility = 'public')
      )
    )
  )
);

