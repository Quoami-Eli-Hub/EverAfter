# EverAfter project status

## Implemented baseline

- One authenticated owner per event, email/password and Google OAuth flow.
- Wedding and memorial onboarding, public slug pages, editable content, schedules and venues.
- RSVP collection with phone, party size, notes, deadlines, check-in and CSV endpoint.
- Owner-only image uploads, albums, per-photo/album download controls and private storage.
- Memorial PDF/poster uploads and moderated public tribute submissions.
- Classic, Garden and Editorial presentation choices with colour palettes.
- Public-only search indexing, robots rules and dynamic sitemap.
- Password recovery and secure password update flow.
- Admin page protected by a database-backed administrator flag.
- Starter/Premium plan records plus payment-order and custom-domain schema for later activation.
- V3 commercial dashboard with one-time Starter/Premium plans, GHS Paystack checkout, USD Flutterwave checkout, signed and re-verified webhooks, storage add-ons, payment history, Premium-only templates, branding removal and DNS-verified custom-domain requests.
- Password-protected visitor pages with bcrypt password hashes, 24-hour opaque access tokens and no search indexing.
- Original local placeholder photography for the landing page and both event demonstrations.

## External activation required

1. Configure Google OAuth credentials and production redirect URLs in Supabase.
2. Configure custom SMTP for reliable branded authentication mail.
3. Enable leaked-password protection in Supabase Auth.
4. Add Paystack and Flutterwave merchant credentials, configure both webhook URLs, and set `PAYMENTS_ENABLED=true`.
5. Connect a production domain and set `NEXT_PUBLIC_SITE_URL` in Vercel.
6. Grant the first administrator only after confirming the intended account and access scope.

## Environment-gated production activation

- Payment collection: the full provider flow is implemented but live charges remain locked until merchant secrets are configured.
- Custom domains: DNS ownership verification is implemented; automatic activation requires Vercel project credentials and a production CNAME target.
- Anti-spam provider: public forms validate input but production launch should add Turnstile and rate limiting.

## Local verification

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` from the project directory.

Last verified on 23 August 2026: ESLint, TypeScript and the optimized Next.js production build all pass. Protected-access RLS was tested with rejected and accepted tokens inside a rolled-back database transaction.
