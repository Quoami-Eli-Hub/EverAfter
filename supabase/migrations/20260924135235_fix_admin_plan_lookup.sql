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
  if new.theme_key in ('cinematic','minimalist') and (new.plan_code<>'premium' or not new.plan_paid) then
    raise exception 'This template requires an active Premium plan';
  end if;
  return new;
end $$;

