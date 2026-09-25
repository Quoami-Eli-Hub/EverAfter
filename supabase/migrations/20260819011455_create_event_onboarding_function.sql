
create or replace function public.create_event(
  p_event_type text,
  p_title text,
  p_slug text,
  p_event_date date default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := (select auth.uid());
  v_event_id bigint;
  v_sections text[];
begin
  if v_owner_id is null then
    raise exception 'Authentication required';
  end if;
  if p_event_type not in ('wedding', 'memorial') then
    raise exception 'Invalid event type';
  end if;

  insert into public.events (owner_id, event_type, title, slug, event_date)
  values (v_owner_id, p_event_type, trim(p_title), lower(trim(p_slug)), p_event_date)
  returning id into v_event_id;

  v_sections := case
    when p_event_type = 'wedding' then
      array['announcement','countdown','our_story','ceremony','reception','schedule','venues','dress_code','wedding_party','accommodation','travel','gift_registry','mobile_money','rsvp','gallery','videos','livestream','contact','faq']
    else
      array['announcement','profile','biography','obituary','family','wake','burial','thanksgiving','reception','schedule','venues','directions','dress_code','tributes','condolences','gallery','videos','livestream','donations','mobile_money','funeral_program','posters','contact']
  end;

  insert into public.event_sections (event_id, section_key, sort_order)
  select v_event_id, section_key, ordinality::smallint
  from unnest(v_sections) with ordinality as section_list(section_key, ordinality);

  update public.profiles set onboarding_complete = true where id = v_owner_id;
  return v_event_id;
end;
$$;

revoke execute on function public.create_event(text, text, text, date) from public, anon;
grant execute on function public.create_event(text, text, text, date) to authenticated;

