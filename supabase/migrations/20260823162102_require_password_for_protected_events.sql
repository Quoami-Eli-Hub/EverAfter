create or replace function private.require_protected_event_password()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.visibility='protected' and not exists(select 1 from private.event_secrets s where s.event_id=new.id and s.password_hash is not null) then
    raise exception 'Set an event password before enabling protected access';
  end if;
  return new;
end; $$;
drop trigger if exists require_protected_event_password on public.events;
create trigger require_protected_event_password before insert or update of visibility on public.events for each row execute function private.require_protected_event_password();
