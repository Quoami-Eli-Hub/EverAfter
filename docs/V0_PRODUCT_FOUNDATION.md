# EverAfter — V0 product foundation

> `EverAfter` is a placeholder name. All people, dates, copy, images and statistics in V0 are fictional placeholders.

## Product promise

One registered owner creates and manages one wedding or funeral/memorial event. The owner publishes a distinct, searchable public page at a memorable slug and controls its privacy, content, RSVP records, downloads and storage.

## V0 routes

| Route | Purpose |
| --- | --- |
| `/` | Public product landing page and experience selection |
| `/onboarding` | Event-type and custom-link concept |
| `/dashboard` | Event-owner workspace concept |
| `/demo/wedding` | Complete wedding public-page direction |
| `/demo/memorial` | Complete funeral/memorial public-page direction |
| `/admin` | Platform administration concept |

## Experience principles

1. Wedding pages are warm, editorial and celebratory.
2. Memorial pages are quiet, dignified and reflective.
3. Owner and platform dashboards remain neutral and operational.
4. Customization uses curated templates, palettes and typography—not arbitrary code.
5. Public publishing is explicit. Draft and protected pages are never indexed.
6. Guest phone numbers, RSVP data and moderation queues are never public.

## Proposed production stack

- Next.js App Router, React and TypeScript
- Supabase Auth using email/password and Google OAuth
- Supabase PostgreSQL with Row-Level Security on every exposed table
- Supabase Storage for images, PDFs and posters
- Vercel for application hosting, SEO rendering and premium custom domains
- Tailwind CSS plus product design tokens

Supabase integration begins in V1 after a project and environment credentials are available. V0 intentionally contains no cloud credentials and uses local mock data only.

## Core domain model

- `profiles`: one row per authenticated owner
- `events`: exactly one row per owner; wedding or memorial
- `event_sections`: ordered, configurable public content
- `schedule_items`: ceremony, reception, wake, burial and thanksgiving entries
- `venues`: addresses, coordinates and directions
- `rsvps`: private name, phone, attendance, party size and check-in state
- `albums`: event-owned collections and album download policy
- `media`: object path, type, size, caption and per-file download policy
- `tributes`: moderated funeral/memorial submissions
- `documents`: funeral programmes and posters
- `plans` and `storage_ledger`: future entitlement and upload accounting
- `audit_logs`: security-relevant owner and administrator actions

The database will enforce the one-owner/one-event rule with a unique constraint on `events.owner_id`.

## Security baseline for V1

- Explicit Data API grants and RLS policies for every exposed table
- Ownership checks using `auth.uid()` in both `USING` and `WITH CHECK`
- No authorization decisions based on editable user metadata
- Publishable Supabase key only in the browser; service credentials server-only
- Private storage buckets by default and signed delivery for protected files
- Separate public projections from private RSVP/contact records
- Rate limits and bot protection on authentication, RSVP and tribute submission
- MIME, extension and file-size validation for uploads
- Moderation before visitor tributes become public
- Authenticated pages marked dynamic and non-cacheable
- Audit trail for suspension, unpublishing and other privileged admin actions
- Search indexing only for explicitly published public pages

## V1 handoff criteria

V0 is approved when the navigation, visual direction, information hierarchy and event-type distinction are accepted. V1 then introduces the Supabase schema, authentication, live editing, publication, RSVP persistence, storage policies and automated tests.
