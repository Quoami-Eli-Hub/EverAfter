
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.event_plans (
  code text primary key check (code in ('starter','premium')),
  name text not null,
  price_ghs numeric(12,2) not null check (price_ghs >= 0),
  price_usd numeric(12,2) not null check (price_usd >= 0),
  storage_bytes bigint not null check (storage_bytes > 0),
  template_limit integer,
  custom_domain_enabled boolean not null default false,
  branding_removed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.event_plans enable row level security;

insert into public.event_plans (code,name,price_ghs,price_usd,storage_bytes,template_limit,custom_domain_enabled,branding_removed)
values
 ('starter','Starter',0,0,5368709120,3,false,false),
 ('premium','Premium',0,0,21474836480,null,true,true)
on conflict (code) do update set name=excluded.name, storage_bytes=excluded.storage_bytes,
 template_limit=excluded.template_limit, custom_domain_enabled=excluded.custom_domain_enabled,
 branding_removed=excluded.branding_removed;

alter table public.events
  add column if not exists plan_code text not null default 'starter' references public.event_plans(code),
  add column if not exists branding_removed boolean not null default false;

create table if not exists public.payment_orders (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('event_plan','storage_addon')),
  provider text check (provider in ('paystack','flutterwave','manual')),
  provider_reference text unique,
  currency text not null check (currency in ('GHS','USD')),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payment_orders enable row level security;
create index if not exists payment_orders_owner_id_idx on public.payment_orders(owner_id);
create index if not exists payment_orders_event_id_idx on public.payment_orders(event_id);
create index if not exists payment_orders_status_idx on public.payment_orders(status);

create table if not exists public.custom_domains (
  id bigint generated always as identity primary key,
  event_id bigint not null unique references public.events(id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname)),
  status text not null default 'pending' check (status in ('pending','verified','active','failed')),
  verification_token text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.custom_domains enable row level security;
create index if not exists custom_domains_event_id_idx on public.custom_domains(event_id);

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false) $$;
revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

drop policy if exists "plans are publicly readable" on public.event_plans;
create policy "plans are publicly readable" on public.event_plans for select using (active = true);

drop policy if exists "owners read payment orders" on public.payment_orders;
create policy "owners read payment orders" on public.payment_orders for select to authenticated
using (owner_id = (select auth.uid()) or (select private.is_platform_admin()));

drop policy if exists "owners read custom domains" on public.custom_domains;
create policy "owners read custom domains" on public.custom_domains for select to authenticated
using (exists (select 1 from public.events e where e.id = custom_domains.event_id and (e.owner_id = (select auth.uid()) or (select private.is_platform_admin()))));

drop policy if exists "owners create custom domains" on public.custom_domains;
create policy "owners create custom domains" on public.custom_domains for insert to authenticated
with check (exists (select 1 from public.events e where e.id = custom_domains.event_id and e.owner_id = (select auth.uid()) and e.plan_code = 'premium'));

drop policy if exists "owners update custom domains" on public.custom_domains;
create policy "owners update custom domains" on public.custom_domains for update to authenticated
using (exists (select 1 from public.events e where e.id = custom_domains.event_id and e.owner_id = (select auth.uid()) and e.plan_code = 'premium'))
with check (exists (select 1 from public.events e where e.id = custom_domains.event_id and e.owner_id = (select auth.uid()) and e.plan_code = 'premium'));

grant select on public.event_plans to anon, authenticated;
grant select on public.payment_orders to authenticated;
grant select, insert, update on public.custom_domains to authenticated;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles for select to authenticated using ((select private.is_platform_admin()));
drop policy if exists "admins read all events" on public.events;
create policy "admins read all events" on public.events for select to authenticated using ((select private.is_platform_admin()));
drop policy if exists "admins read all rsvps" on public.rsvps;
create policy "admins read all rsvps" on public.rsvps for select to authenticated using ((select private.is_platform_admin()));

