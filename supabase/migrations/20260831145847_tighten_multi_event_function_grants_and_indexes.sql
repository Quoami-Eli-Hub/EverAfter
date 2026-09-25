
revoke execute on function public.add_event_member(bigint, text, text) from anon;
revoke execute on function public.add_event_member(bigint, text, text) from public;
grant execute on function public.add_event_member(bigint, text, text) to authenticated;

revoke execute on function public.remove_event_member(bigint, uuid) from anon;
revoke execute on function public.remove_event_member(bigint, uuid) from public;
grant execute on function public.remove_event_member(bigint, uuid) to authenticated;

revoke execute on function public.create_payment_order(bigint, text, text, text, text) from anon;
revoke execute on function public.create_payment_order(bigint, text, text, text, text) from public;
grant execute on function public.create_payment_order(bigint, text, text, text, text) to authenticated;

create index if not exists events_owner_id_idx on public.events(owner_id);
create index if not exists event_memberships_invited_by_idx on public.event_memberships(invited_by);

