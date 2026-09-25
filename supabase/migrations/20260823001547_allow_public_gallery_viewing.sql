
drop policy if exists event_media_anon_download on storage.objects;
create policy event_media_anon_download on storage.objects for select to anon
using (
 bucket_id='event-media'
 and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
 and (
  exists(select 1 from public.media m join public.events e on e.id=m.event_id
    where m.storage_path=storage.objects.name and m.is_public and e.status='published' and e.visibility='public')
  or exists(select 1 from public.documents d join public.events e on e.id=d.event_id
    where d.storage_path=storage.objects.name and d.is_public and d.allow_download and e.status='published' and e.visibility='public')
 )
);
drop policy if exists event_media_authenticated_select on storage.objects;
create policy event_media_authenticated_select on storage.objects for select to authenticated
using (
 bucket_id='event-media' and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or (
   storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated'])
   and (
    exists(select 1 from public.media m join public.events e on e.id=m.event_id
      where m.storage_path=storage.objects.name and m.is_public and e.status='published' and e.visibility='public')
    or exists(select 1 from public.documents d join public.events e on e.id=d.event_id
      where d.storage_path=storage.objects.name and d.is_public and d.allow_download and e.status='published' and e.visibility='public')
   )
  )
 )
);
