# Mubeen Akhtar — Creator Hub

Phase 1 of a personal creator + AI platform: public profile, social hub, photo
gallery, video hub, ratings, reviews, contact form, an "AI Zone — Coming
Soon" page, and a protected admin dashboard — built on Next.js 15 (App
Router, TypeScript) + Supabase (Postgres, Auth, Storage) + Tailwind CSS.

---

## 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (for hosting)

---

## 2. Supabase project setup (do this first)

1. Create a new project at supabase.com. Note your **Project URL** and
   **anon public key** (Project Settings → API) — you'll need them in step 4.
2. Open **SQL Editor** in Supabase Studio, paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   every table, index, RLS policy and the `is_admin()` helper function.
3. Go to **Storage** and create three buckets, each with **Public bucket: ON**:
   - `photos`
   - `videos`
   - `avatars`
4. Back in **SQL Editor**, run [`supabase/storage_policies.sql`](./supabase/storage_policies.sql).
   This locks storage writes/deletes to admins only, while keeping reads public.

### Creating your admin account

There is no public sign-up in Phase 1 — by design, this is a single-owner
platform. To create yourself as admin:

1. In Supabase Studio, go to **Authentication → Users → Add user** (or
   **Invite**) and create a user with your email + a password.
2. Copy that user's **UUID** (shown in the users table).
3. In **SQL Editor**, run:
   ```sql
   insert into public.user_roles (user_id, role) values ('PASTE-THE-UUID-HERE', 'admin');
   ```
4. You can now log in at `/admin/login` with that email/password.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | Yes (safe — protected by RLS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API | Yes (safe — protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role | **No — server-only, never commit** |
| `NEXT_PUBLIC_SITE_URL` | Your production domain | Yes |

The service-role key is not actually required for anything in Phase 1 as
shipped (see `src/lib/supabase/admin.ts` for why) — it's wired up for
Phase 2/3 background jobs. You can leave it blank locally if you want, but
set it in Vercel for when it's needed later.

---

## 4. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Admin dashboard: `http://localhost:3000/admin/login`.

**A note on this build:** this codebase was written and reviewed in an
environment without network/npm access, so `npm install` / `npm run build`
have not actually been executed here. The code has been carefully
hand-reviewed for consistency (types, imports, Next.js 15 conventions), but
you should run `npm install && npm run build` yourself as the real
first-run check, and treat any errors that surface as normal first-run
issues to fix, not a sign the whole approach is wrong.

---

## 5. Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the four environment variables from step 3 in Vercel's project settings.
4. Deploy. Vercel will run `npm run build` automatically.

---

## What was built (Phase 1)

**Public pages:** Home, About, Social Hub, Photos (albums, lightbox, ratings,
likes, share), Videos (storage-hosted or external links, categories,
ratings/likes/share), Ratings & Reviews, Contact, AI Zone (coming soon).

**Admin dashboard** (`/admin`, protected): Overview (real stats), Photos
(upload/edit/delete), Albums, Videos (upload or external link), Social
Accounts, Reviews (approve/hide/feature/delete), Ratings (aggregate view),
Contact Messages (private inbox), Website Settings (profile content + site
config).

**Supabase tables:** `user_roles`, `site_profile`, `site_settings`,
`social_accounts`, `albums`, `photos`, `videos`, `ratings`, `content_likes`,
`reviews`, `contact_messages` — all with RLS policies (public reads only
what should be public; all writes/deletes require the authenticated user to
have an `admin` row in `user_roles`).

**Storage buckets:** `photos`, `videos`, `avatars` — public read, admin-only
write/delete.

**Security implemented:** Supabase Auth (email/password) for the single
admin account; Row Level Security on every table; storage policies; admin
routes gated twice (Next.js middleware for session presence, plus the
`/admin/(protected)/layout.tsx` server component for the actual `is_admin()`
role check — the real boundary is enforced again at the database level via
RLS, so both checks are UX conveniences on top of a DB that would refuse
the operation anyway); zod validation on every form; a honeypot field plus
basic link-count throttling on public forms (contact, reviews) as spam
friction; anonymous session IDs (random UUID in localStorage) with unique
DB constraints to stop duplicate ratings/likes/reviews from the same
browser.

**What is honestly NOT done:**
- `npm install` / `npm run build` / `npm run typecheck` have not been run
  against a real Node environment (no network access in the environment
  this was built in) — see the note in section 4.
- No automated tests were written or run.
- The `maintenance_mode` toggle in Website Settings is stored in the
  database but not yet enforced anywhere (no middleware check reads it).
  It's there so Phase 2 can wire it up without a schema change.
- Image optimization relies entirely on `next/image` (responsive `sizes`,
  lazy loading, automatic AVIF/WebP) — there is no separate
  server-side image compression/resizing pipeline before upload. For
  Phase 1's scope this is normal and sufficient, but very large source
  photos will still take longer to upload (the 8MB cap keeps this bounded).
- Custom video thumbnail hosts beyond YouTube need to be added to
  `next.config.mjs`'s `images.remotePatterns`, or `next/image` will refuse
  to render them (this is a deliberate Next.js security feature, not a bug).

---

## How Phase 2 can be added

The schema and code are already shaped for this:
- `user_roles.role` already accepts `'creator'` and `'student'`, not just
  `'admin'` — Phase 2 accounts slot into the same table.
- Every data-access function lives in `src/lib/data/*` and every mutation in
  `src/lib/actions/*`, separate from UI — new dashboards/analytics can reuse
  these or add siblings without touching page components.
- `src/lib/supabase/admin.ts` (the service-role client) is already wired up,
  guarded by the `server-only` package, and unused until Phase 2 actually
  needs to bypass RLS (e.g. scheduled analytics rollups).
- Add new tables (e.g. `content_analytics_events`, `moderation_flags`,
  `notifications`) following the same pattern in `schema.sql`: RLS enabled
  immediately, `is_admin()` reused where relevant.

## How Phase 3 AI tools can later be connected

- The AI Zone page (`/ai-zone`) already exists as the landing surface; wire
  real tools in by adding routes under it (e.g. `/ai-zone/caption-generator`)
  without touching anything else.
- `site_settings.ai_zone_enabled` already exists as a feature flag to soft-
  launch tools without a deploy.
- Recommended shape for Phase 3 (not built, to keep Phase 1 lightweight/free):
  an `ai_usage_logs` table (user_id, tool, tokens_used, created_at) plus a
  single server-only AI abstraction module (e.g. `src/lib/ai/client.ts`)
  that all tool routes call through — this keeps API keys server-only (same
  `server-only` pattern as `admin.ts`) and gives one place to add rate
  limiting, usage caps, and later a subscription/credits check before
  calling any paid AI API.
