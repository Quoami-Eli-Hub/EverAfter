# EverAfter V0

A navigable product and design prototype for a multi-tenant wedding and funeral/memorial event-page platform.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. The V0 product decisions and route inventory are documented in `docs/V0_PRODUCT_FOUNDATION.md`.

## Current status

V1 is connected to the Supabase project `event-platform` and includes:

- Email/password and Google OAuth application flows
- Cookie-based SSR sessions and protected owner routes
- One-account/one-event database enforcement
- Atomic event onboarding with wedding or memorial section creation
- Live owner dashboard data
- Dynamic public event URLs and RSVP persistence
- Row-Level Security on every exposed application table
- Private, owner-scoped event media storage

Google OAuth still requires valid Google provider credentials and redirect URLs in the Supabase dashboard before it can complete external sign-in.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
