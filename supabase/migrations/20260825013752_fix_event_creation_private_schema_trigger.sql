
create or replace function private.require_protected_event_password()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.visibility = 'protected'
     and not exists (
       select 1
       from private.event_secrets s
       where s.event_id = new.id
         and s.password_hash is not null
     )
  then
    raise exception 'Set an event password before enabling protected access'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

revoke all on function private.require_protected_event_password() from public, anon, authenticated;

drop trigger if exists require_protected_event_password on public.events;

create trigger require_protected_event_password
before update of visibility on public.events
for each row
when (new.visibility = 'protected')
execute function private.require_protected_event_password();

