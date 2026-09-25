alter table public.events
  add constraint events_theme_key_check check (theme_key in ('classic','garden','editorial')) not valid,
  add constraint events_color_key_check check (color_key in ('rose','sage','midnight')) not valid,
  add constraint events_font_key_check check (font_key in ('editorial','modern','romantic')) not valid;
alter table public.events validate constraint events_theme_key_check;
alter table public.events validate constraint events_color_key_check;
alter table public.events validate constraint events_font_key_check;
