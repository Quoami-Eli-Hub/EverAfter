# Invitation cover

Added September 2026. Wedding settings now include an optional invitation cover with names/date overrides, message, button label, and initials/flower/no emblem. Blank names and date follow event details. Colours and typography follow the saved event appearance.

The cover defaults off. Owners and planners can save it; the action checks both role and active event ID, and the database retains existing events RLS. Saves apply immediately to the current event page, as other appearance settings do.

Guests see a native modal dialog only after existing page access checks. Opening or Escape dismisses it and focuses the page heading. Reduced motion skips the animation. A sessionStorage marker avoids replay within the same tab; hash links and RSVP/tribute return URLs bypass it. Without JavaScript the event page remains accessible.

Demo: `/demo/invitation`. Open in a new tab/session to replay the guest cover. Dashboard preview includes an explicit Replay opening control.

Remote migration applied: `add_invitation_cover`:

```sql
alter table public.events add column invitation_cover jsonb not null
default '{"enabled":false}'::jsonb
constraint invitation_cover_object check (
  jsonb_typeof(invitation_cover) = 'object'
  and octet_length(invitation_cover::text) <= 2000
);
```

Music, a memorial cover, and independent draft/publish versions are not included.
