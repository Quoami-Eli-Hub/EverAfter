-- Existing published examples retain access; new events start in free draft mode.
alter table public.events add column plan_paid boolean not null default false;
update public.events e set plan_paid=true where status='published' or exists (
  select 1 from public.payment_orders o where o.event_id=e.id and o.purpose='event_plan' and o.status='paid'
);

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
  if new.status='published' and not new.plan_paid then raise exception 'Purchase a plan before publishing'; end if;
  if new.theme_key in ('cinematic','minimalist') and (new.plan_code<>'premium' or not new.plan_paid) then
    raise exception 'This template requires an active Premium plan';
  end if;
  return new;
end $$;
create trigger enforce_event_plan before insert or update on public.events for each row execute function private.enforce_event_plan();

create or replace function public.create_payment_order(p_event_id bigint,p_purpose text,p_product_code text,p_currency text,p_provider text)
returns public.payment_orders language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_event public.events; v_amount numeric(12,2); v_order public.payment_orders;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_currency not in ('GHS','USD') or p_currency is null then raise exception 'Unsupported currency'; end if;
  if p_provider is distinct from (case when p_currency='GHS' then 'paystack' else 'flutterwave' end) then raise exception 'Unsupported provider'; end if;
  select * into v_event from public.events where id=p_event_id and owner_id=v_user for update;
  if not found then raise exception 'Billing access denied'; end if;
  if p_purpose='event_plan' then
    if v_event.plan_paid and (v_event.plan_code=p_product_code or v_event.plan_code='premium') then raise exception 'Plan is already active or purchase would downgrade it'; end if;
    select case when p_currency='GHS' then price_ghs else price_usd end into v_amount from public.event_plans where code=p_product_code and code in('starter','premium') and active;
  elsif p_purpose='storage_addon' then
    if not v_event.plan_paid then raise exception 'Activate a publishing plan before adding storage'; end if;
    select case when p_currency='GHS' then price_ghs else price_usd end into v_amount from public.storage_addons where code=p_product_code and active;
  else raise exception 'Unsupported purchase'; end if;
  if v_amount is null or v_amount<=0 then raise exception 'Product not available'; end if;
  insert into public.payment_orders(event_id,owner_id,purpose,provider,provider_reference,currency,amount,metadata)
  values(v_event.id,v_user,p_purpose,p_provider,'ea_'||replace(gen_random_uuid()::text,'-',''),p_currency,v_amount,jsonb_build_object('product_code',p_product_code)) returning * into v_order;
  return v_order;
end $$;

create or replace function public.activate_payment_order(p_reference text,p_amount numeric,p_currency text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_order public.payment_orders; v_event public.events; v_plan public.event_plans; v_addon public.storage_addons; v_old_base bigint;
begin
  select * into v_order from public.payment_orders where provider_reference=p_reference for update;
  if not found or v_order.amount is distinct from p_amount or v_order.currency is distinct from p_currency then return false; end if;
  if v_order.status='paid' then return true; end if;
  if v_order.status<>'pending' then return false; end if;
  select * into v_event from public.events where id=v_order.event_id for update;
  if not found then return false; end if;
  if v_order.purpose='event_plan' then
    select * into v_plan from public.event_plans where code=v_order.metadata->>'product_code' and active;
    if not found then return false; end if;
    -- A delayed Starter payment must never downgrade an already activated Premium event.
    if not (v_event.plan_paid and v_event.plan_code='premium' and v_plan.code='starter') then
      select storage_bytes into v_old_base from public.event_plans where code=v_event.plan_code;
      update public.events set plan_code=v_plan.code,plan_paid=true,branding_removed=v_plan.branding_removed,
        storage_limit_bytes=storage_limit_bytes+greatest(0,v_plan.storage_bytes-coalesce(v_old_base,0)) where id=v_event.id;
    end if;
  elsif v_order.purpose='storage_addon' then
    if not v_event.plan_paid then return false; end if;
    select * into v_addon from public.storage_addons where code=v_order.metadata->>'product_code' and active;
    if not found then return false; end if;
    update public.events set storage_limit_bytes=storage_limit_bytes+v_addon.storage_bytes where id=v_event.id;
  else return false; end if;
  update public.payment_orders set status='paid',paid_at=now(),updated_at=now() where id=v_order.id;
  insert into public.audit_logs(actor_id,event_id,action,target_type,target_id,metadata)
  values(v_order.owner_id,v_order.event_id,'payment.completed','payment_order',v_order.id::text,jsonb_build_object('reference',p_reference,'purpose',v_order.purpose,'product_code',v_order.metadata->>'product_code'));
  return true;
end $$;
revoke all on function public.activate_payment_order(text,numeric,text) from public,anon,authenticated;
grant execute on function public.activate_payment_order(text,numeric,text) to service_role;
revoke all on function public.create_payment_order(bigint,text,text,text,text) from public,anon;
grant execute on function public.create_payment_order(bigint,text,text,text,text) to authenticated,service_role;
