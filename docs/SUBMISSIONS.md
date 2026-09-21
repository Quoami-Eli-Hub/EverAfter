# Submission flow and verification

## Destinations

| Submission | Storage or service | Where it is used |
| --- | --- | --- |
| Guest RSVP, phone, party size, note | Supabase `rsvps`, scoped by event | Dashboard Guests, overview count, CSV export |
| Congratulations or tribute | Supabase `tributes`, initially `pending` | Dashboard Messages; public message wall after approval |
| Venue and programme | `venues`, `schedule_items` | Dashboard Schedule and public programme |
| Album, photo, PDF | `albums`, `media`, `documents`, private `event-media` storage | Dashboard Gallery; permitted public content through signed URLs |
| Event settings and invitation | `events`, `event_sections` | Dashboard preview and public event page |
| Team member | Membership RPCs | Dashboard Team; existing-account membership |
| Account and password reset | Supabase Auth | Account session and recovery email |
| Checkout or custom domain | Payment/domain records and external providers | Dashboard Plan; requires provider configuration |

## Fixes in this change

- Private/draft previews explain why submissions are unavailable. RSVP status no longer says open when disabled or in preview.
- Guest actions validate attendance and event availability, use the correct `#messages` destination, and refresh dashboard data after a successful insert.
- Pending buttons prevent repeated clicks while guest submissions are in progress.
- Guest notes are visible in the dashboard and included in CSV export. CSV fields guard against spreadsheet formula execution; export errors do not produce a misleading empty file.
- Message approval checks the updated row and refreshes the public event page.
- Venue, programme and album submissions report database failures. Programme venues must belong to the active event.
- Check-in and moderation validate requested operations and report inaccessible or missing records.
- Settings validate dates/party sizes. Publishing a private event directs its manager to choose a guest visibility setting.
- Password-reset delivery errors are surfaced instead of claiming an email was sent.

## Verification

Run `node scripts/check-submissions.mjs`, `npm run lint`, and `npm run build`.

The action regression checks cover valid submissions, notes, decline party size, invalid input, draft/private/closed events, pending moderation, failure redirects and invalid slugs. Supabase transaction tests also verified anonymous RSVP/message inserts, pending-message privacy, guest-list privacy, rejection of private-event and disabled-RSVP inserts, owner moderation, and approved-message public visibility. All database test records were rolled back.

These tests do not claim an end-to-end checkout, email delivery, file upload, protected-event unlock or authenticated dashboard browser test. Their handlers were inspected; external services and actual credentials are still needed for full live verification. Demo forms intentionally simulate submissions and do not save guest records.

Deploying the app does not publish every event. `/quoamiharry` was private/draft when audited; `/quoami-harry` was a separate published/public event with RSVP disabled. No event visibility or RSVP preference was changed by this audit.
