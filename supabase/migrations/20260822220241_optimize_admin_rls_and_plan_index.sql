
create index if not exists events_plan_code_idx on public.events(plan_code);
drop policy if exists "admins read all events" on public.events;
drop policy if exists events_authenticated_select on public.events;
create policy events_authenticated_select on public.events for select to authenticated
using (owner_id = (select auth.uid()) or (status='published' and visibility='public') or (select private.is_platform_admin()));
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_platform_admin()));
drop policy if exists "admins read all rsvps" on public.rsvps;
drop policy if exists rsvps_owner_select on public.rsvps;
create policy rsvps_owner_select on public.rsvps for select to authenticated
using ((select private.is_platform_admin()) or exists(select 1 from public.events e where e.id=rsvps.event_id and e.owner_id=(select auth.uid())));

