# Vocom CRM

Next.js + Supabase app for tracking Vocom's leads: website form submissions (Framer),
Instantly campaign leads, and manually-logged LinkedIn activity. Built for Hash Brown to
hand over to Vocom's sales team (Victor, Kevin, Cynthia).

## One-time setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign up/sign in, **New project**.
2. Once it's ready: **SQL Editor** → **New query** → paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) → **Run**. This creates all four tables
   (`reps`, `website_leads`, `instantly_leads`, `linkedin_activity`) and seeds Victor,
   Kevin, and Cynthia into `reps`.
3. **Settings → API**: copy the **Project URL**, the **anon public** key, and the
   **service_role** key (click "reveal" — keep this one secret, it bypasses row security).
4. **Authentication → Users → Add user**: create one login per person who needs access
   (Hash Brown + Vocom's sales team). There's no public sign-up page by design — access is
   invite-only, added here one at a time.

### 2. Local environment

```bash
cp .env.local.example .env.local
```

Fill in the six values (Supabase URL/anon key/service role key from above, your Instantly
API key, and make up two random 32+ character strings for `CRON_SECRET` and
`FRAMER_WEBHOOK_SECRET`).

```bash
npm install
npm run dev
```

Visit `localhost:3000` — it'll redirect to `/login`. Sign in with one of the users you
created in step 1.4.

### 3. Deploy to Vercel

1. Push this repo to GitHub, then [vercel.com/new](https://vercel.com/new) → import it.
2. In the Vercel project's **Settings → Environment Variables**, add the same six values
   from `.env.local`.
3. Deploy. `vercel.json` already defines an hourly cron job for the Instantly sync —
   Vercel picks it up automatically and sends the `Authorization: Bearer <CRON_SECRET>`
   header itself once `CRON_SECRET` is set as an env var, matching what
   `/api/cron/instantly-sync` checks for.

### 4. Point Framer's webhook at the deployed app

In Framer's form webhook settings:

- **API**: `https://<your-vercel-domain>/api/webhooks/framer`
- **Secret**: the same value you set for `FRAMER_WEBHOOK_SECRET`

Submit a test entry on the live site and check the Website Leads page. The raw payload is
stored in the `raw_payload` column on `website_leads` if you ever need to check exactly
what Framer sent (e.g. if Name/Email/Company aren't landing where expected — the field
names in `src/app/api/webhooks/framer/route.ts` may need adjusting to match your form's
actual input names).

## What's where

- `src/app/(app)/` — the authenticated pages (dashboard, three lead views, sales team)
- `src/app/login/` — sign-in page, outside the auth-gated group
- `src/app/api/cron/instantly-sync/` — hourly pull from Instantly, run by Vercel Cron
- `src/app/api/webhooks/framer/` — receives Framer form submissions
- `src/app/actions.ts` — server actions for editing rep/status/notes from the UI
- `supabase/schema.sql` — the whole database schema, run once in Supabase's SQL editor
- `src/middleware.ts` — redirects signed-out users to `/login`, keeps sessions fresh

## Local development

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
```

 
