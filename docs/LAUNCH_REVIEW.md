# Launch review — 25 September 2026

Production address: https://ever-after-beta.vercel.app

## Verified locally

- Next.js upgraded to 16.3.6; dependency audit reports zero known vulnerabilities.
- Lint and production build pass.
- Payment verification checks the provider reference, amount, currency, success state and Paystack live/test domain before granting access.
- Production rejects Paystack test keys. Preview environments can use explicitly selected test mode.
- Payment webhooks validate authentication and request a retry when verification is unavailable.
- Login callback destinations are restricted to paths on this site.
- Guest forms now include the honeypot field already checked by submission handlers; this is not a substitute for rate limiting.
- Security response headers added, and GitHub checks run lint, tests, dependency audit and build.
- Terms describe individual refund review, free drafting, paid publishing and public support details.
- Repository migrations now match all 19 migrations recorded by the deployed database. Restoring these files does not apply them again.

## External checks still required

- Restore Chrome dashboard control; current browser connection cannot attach to the settings pages.
- Reauthorize the Vercel connection for `gilbert-oforiboyes-projects`; its API returns 403 for the current connection.
- Confirm merchant activation, configure Paystack callback and webhook URLs, and install server credentials securely in Vercel.
- Perform a genuine Paystack sandbox checkout, verify webhook delivery and confirm plan activation in the database. Local mocked tests are not a provider checkout test.
- Confirm hosting eligibility for commercial use before enabling paid launch; the reviewed Vercel team was on Hobby.
- Verify production signup, email delivery, password recovery, guest submissions and music upload end to end.
- Finish mobile visual checks across templates and audit public submission abuse controls.

Do not describe payments as connected or launch as complete until these checks pass. Keep PAYMENTS_ENABLED disabled until the production prerequisites are satisfied. Never commit provider or Supabase server keys.

Refund decision: requests are reviewed individually. Existing web address retained at the owner's request.

## Payment dashboard settings

- Callback: `https://ever-after-beta.vercel.app/api/payments/paystack/callback`
- Webhook: `https://ever-after-beta.vercel.app/api/payments/paystack/webhook`
- Production requires `SUPABASE_SECRET_KEY`, a live `PAYSTACK_SECRET_KEY`, `PAYSTACK_MODE=live` and, after verification, `PAYMENTS_ENABLED=true`.
- Isolated test deployments must use test credentials, `PAYSTACK_MODE=test`, and a callback/webhook for that deployment. Do not use the production database for test purchases.
- Provider guidance: [webhook verification and retries](https://paystack.com/docs/payments/webhooks/) and [payment verification](https://paystack.com/docs/payments/verify-payments/).

Supabase advisors still flag intentionally exposed access-controlled functions and disabled [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No new database schema was applied during this review.
