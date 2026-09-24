# Event plans

New events are free drafts. Publishing requires a verified one-time plan purchase; existing published examples retain access. The database enforces this rule even for direct API requests.

| | Starter | Premium |
| --- | --- | --- |
| Price per event | GH₵250 / US$20 | GH₵600 / US$45 |
| Included storage | 5 GB | 20 GB |
| Layouts | Classic, Garden, Editorial | Starter layouts plus Cinematic and Minimalist |
| Workflow | Details, design, sharing | Signature design, gallery, custom domain |
| Footer | EverAfter branding | Branding removed |
| Domain | EverAfter event link | Connect a separately owned domain |

All plans include invitations, RSVP, programme, messages, team collaboration and privacy controls. Prices displayed in billing come from the database catalogue. Premium upgrades currently charge the full displayed Premium price. Extra storage survives upgrades. Repeated payment notifications do not add storage twice, and delayed Starter activation cannot downgrade Premium.

## Production setup

Checkout remains unavailable until `PAYMENTS_ENABLED=true`, `SUPABASE_SECRET_KEY`, and the selected provider secret are configured in Vercel. GHS uses `PAYSTACK_SECRET_KEY`; USD uses `FLUTTERWAVE_SECRET_KEY`. Use the production site URL in `NEXT_PUBLIC_SITE_URL`.

Configure Paystack's webhook at `/api/payments/paystack/webhook`. Flutterwave Standard uses v3: configure `/api/payments/flutterwave/webhook` and a matching `FLUTTERWAVE_WEBHOOK_SECRET` secret hash (`verif-hash` header). Both providers are queried independently before activation; browser return parameters alone cannot activate plans. Verification outages return 503 for webhook retry.

Custom-domain writes are server-only after owner and paid Premium checks. TXT ownership verification is separate from hosting readiness. Automatic hosting checks need `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` and, for a team, `VERCEL_TEAM_ID`. An address becomes active only after ownership and hosting configuration checks succeed. Otherwise its status remains verified awaiting hosting configuration.

## Verification

Run `node scripts/check-plans.mjs`, `node scripts/check-submissions.mjs`, `npm run lint`, and `npm run build`. Database integration checks run inside a rolled-back transaction; no real charges or paid test events are retained. A real provider sandbox checkout and production credential validation are still required before enabling live payments.
