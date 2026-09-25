
create or replace function private.track_storage_usage()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_event_id bigint; v_delta bigint; v_limit bigint; v_used bigint;
begin
  v_event_id := coalesce(new.event_id, old.event_id);
  v_delta := case when tg_op='INSERT' then new.byte_size when tg_op='DELETE' then -old.byte_size else new.byte_size-old.byte_size end;
  select storage_limit_bytes, storage_used_bytes into v_limit,v_used from public.events where id=v_event_id for update;
  if v_used+v_delta > v_limit then raise exception 'Event storage limit exceeded'; end if;
  update public.events set storage_used_bytes=greatest(0,storage_used_bytes+v_delta) where id=v_event_id;
  return coalesce(new,old);
end $$;
create trigger media_storage_usage after insert or update of byte_size or delete on public.media for each row execute function private.track_storage_usage();
create trigger document_storage_usage after insert or update of byte_size or delete on public.documents for each row execute function private.track_storage_usage();

