# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Uni Swap — a peer skill-exchange platform for Astana IT University students (registration
restricted to `@astanait.edu.kz`, plus `gmail.com`/`icloud.com` temporarily — see
`ALLOWED_EMAIL_DOMAINS` below). This repo implements the full MVP scope from the BRD (BR1–BR5 plus
admin moderation): domain-restricted signup with consent tracking, skill profiles (offer/want),
matching, session requests, a polling-based chat, reviews on completed sessions, and admin
moderation (block users, resolve reports). The UI is translated into Russian/English/Kazakh via a
cookie-based switcher (no URL routing). A React Native/Expo mobile app is planned later, reusing
this backend — the web app is built responsive/PWA-ready for that reason. Production must be
hosted on a Kazakhstan-based VPS (personal-data residency requirement from the BRD); it currently
runs on Vercel + Neon, which the BRD calls out as fine for development only, not the final home.

Stack: Next.js (App Router, Turbopack) + Prisma + PostgreSQL (Neon in production) + Auth.js v5
(email magic links via Resend) + Tailwind.

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build / run
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `npx prisma generate` — regenerate the Prisma client after editing `prisma/schema.prisma`
- `npx prisma migrate dev --name <name>` — create and apply a migration (needs `DATABASE_URL`)
- `npx prisma studio` — inspect the database
- `npm run seed` (or `npx prisma db seed`) — populate `prisma/seed.ts`'s demo users/skills, so
  `/matches` has something to show. Idempotent (upserts), safe to rerun. It also attaches demo
  skills to whichever user has `DEMO_USER_EMAIL` in `prisma/seed.ts` — update that constant if the
  account you're testing with changes. It also promotes that account to `role: ADMIN` (so you can
  reach `/admin`) and creates one demo `Report` against a seed user, so the admin panel isn't empty.

Copy `.env.example` to `.env.local` before running anything that touches auth or the DB. Required
vars: `DATABASE_URL` (Postgres), `AUTH_SECRET` (`npx auth secret`), `RESEND_API_KEY` + `EMAIL_FROM`,
`ALLOWED_EMAIL_DOMAINS`. **The Prisma CLI only auto-loads `.env`, not `.env.local`** — this repo keeps
both in sync (both gitignored); if you add/change a var, update both files or `prisma migrate`/`generate`/
`prisma db seed` won't see it.

`ALLOWED_EMAIL_DOMAINS` currently includes `gmail.com,icloud.com` alongside `astanait.edu.kz` —
**temporary**, added only because the `astanait.edu.kz` domain isn't yet verified in Resend, so
university addresses can't receive real mail yet (Resend free-tier restriction: unverified-domain
accounts can only send to the account owner's own inbox). Once the domain is verified in Resend
(Domains → add SPF/DKIM), narrow this back to just `astanait.edu.kz` before onboarding real students.

There is no test suite yet.

## Local database (this machine)

PostgreSQL 15 is installed at `/Library/PostgreSQL/15` (not Homebrew, no `psql` on `PATH` by
default — add `/Library/PostgreSQL/15/bin` to use it directly). It's already running on port 5432
with `pg_hba.conf` set to trust local connections, so the `postgres` superuser needs no password:
`DATABASE_URL="postgresql://postgres@localhost:5432/uni_swap"`. The `uni_swap` database already
existed (created outside this project) and now holds the full schema, applied via
`prisma/migrations/20260926124800_init`. To reset it: `npx prisma migrate reset`.

## Version gotchas

This project is on **Next.js 16**, which has real breaking changes from what older training data
assumes — check `node_modules/next/dist/docs/` before relying on remembered Next.js behavior.
The one that already bit this setup: `middleware.ts` is deprecated in favor of `proxy.ts`, and with
the `--src-dir` layout it must live at `src/proxy.ts` (not the repo root) or Next.js silently never
invokes it — routes it's supposed to protect just render unauthenticated instead of redirecting.

Prisma is intentionally pinned to **6.19.x**, not 7/8. Prisma 7 removed `datasource { url = ... }`
from `schema.prisma` in favor of driver adapters + `prisma.config.ts`; that rewrite isn't worth the
churn for this project, so don't `npm update prisma` past the 6.x line without deliberately doing
that migration. (`npm audit` will show a few high-severity issues in Prisma's CLI-only dependencies
for non-Postgres drivers — MySQL2 auth downgrade, deepmerge-ts stack exhaustion. They're in tooling
this project never runs, not in the Postgres runtime path; not worth chasing for the MVP.)

## Architecture

**Auth (`src/auth.ts`, `src/proxy.ts`)** — Auth.js v5 with `PrismaAdapter` and the `Resend` email
provider, but **JWT** session strategy, not database sessions. This is deliberate: the Auth.js
Prisma adapter requires a model literally named `Session`, which would collide with the domain
concept of a mentoring "session." The schema keeps a `Session` model purely so the adapter's types
resolve — it's otherwise unused — and the actual business entity is called `SkillSession`. Don't
rename `SkillSession` back to `Session` without first moving auth off the Prisma adapter's session
table.

Domain restriction and the consent checkbox are **not** enforced by Auth.js itself — the real entry
point is `POST /api/register` (`src/app/api/register/route.ts`): it validates the email domain and
consent, upserts the `User` row (setting `consentAt`), and only then calls `signIn("resend", …)` to
send the magic link. `auth.ts`'s `signIn` callback re-checks domain / `consentAt` / `isBlocked` as a
second line of defense in case `/api/auth/*` is hit directly. `src/proxy.ts` redirects unauthenticated
requests to `/profile` and `/matches` toward `/register`, and blocked users toward `/blocked`; role
and `isBlocked` are refreshed from the DB on every request via the `jwt` callback (acceptable at
MVP scale — revisit if this becomes a hot path).

**Matching (`src/lib/matching.ts`, BR3)** — a single raw SQL query (`prisma.$queryRaw` with CTEs),
not an ORM loop, finds users whose `OFFER` skills intersect the current user's `WANT` skills and
vice versa, ranking mutual matches first and then by total overlap. This is intentional: it's what
keeps the "<3s for 1000 users" requirement trivially true. Keep it as one query rather than
"simplifying" it into per-candidate Prisma calls. `findMatches()` returns `theyCanTeachMe` /
`theyWantFromMe` as `{id, name}[]` (not just names) — the ids are what `RequestSessionForm` needs to
create a `SkillSession` for a specific overlapping skill, so don't drop them back to plain strings.

**Skills** — `Skill` is a shared catalog; `UserSkill` links a user to a skill with a `type` (`OFFER`/`WANT`) and `level`, unique per `(userId, skillId, type)`. Free-text skill entry is **disabled**: the profile shows catalog cards (`SkillsManager`, search + category filter) and `POST /api/profile/skills` takes a `skillId` that must already exist. New catalog entries go in `prisma/skills-catalog.ts` and are loaded with `npm run seed:skills` (idempotent, catalog only — unlike `npm run seed`, which also creates demo users).

**Roles & certificates** — the role (`STUDENT` shown as "Юзер" / `MENTOR` / `ADMIN`) is chosen on `/register`. `MENTOR` and `ADMIN` require a **secret code** (env `MENTOR_SECRET_CODE` / `ADMIN_SECRET_CODE`, checked by `isRoleCodeValid()` in `src/lib/roleCodes.ts` with a constant-time hash compare). If a code env var is unset, that role is unavailable to everyone. The same check guards promotion in `/profile` (`RoleSwitcher` → `POST /api/profile/role`); dropping back to `STUDENT` needs no code. Re-registering an existing email never changes its role. Set both vars in `.env` and in Vercel. There is no mentor-application flow any more. Users upload certificates (PDF/JPG/PNG, ≤3 MB, stored as `Certificate.data` bytes, type sniffed from magic bytes) in `/profile`; `MENTOR`/`ADMIN` review them via `CertificateReviewQueue` on `/mentor` and `/admin` (`POST /api/certificates/[id]/review`, reviewers cannot review their own). An `APPROVED` certificate linked to a skill makes that skill count as verified (`src/lib/verification.ts`).

**Session requests (BR4, `SkillSession`)** — created from `/matches` (`RequestSessionForm`) via
`POST /api/sessions`, always `requesterId` = the person clicking, `partnerId` = the match, `skillId`
= whichever overlapping skill they picked (either direction — the schema doesn't record who's
teaching whom, only who requested). Status transitions live in
`/api/sessions/[id]/{accept,cancel,complete}` and are guarded server-side, not just in the UI: only
the `partnerId` can `accept`, only from `PENDING`; `cancel` works for either participant from
`PENDING` or `ACCEPTED`; `complete` works for either participant only from `ACCEPTED`. The shared
`loadSkillSessionForParticipant()` in `src/lib/sessions.ts` is what enforces "only the two people on
the session can see/touch it" — reuse it rather than re-checking `requesterId`/`partnerId` inline if
you add more session endpoints. `/sessions` (`src/app/sessions/page.tsx`) lists both directions for
the current user; there's no separate "incoming vs outgoing" split, just a per-row label.

**Chat (BR, `Message`)** — polling, not WebSocket, on purpose (matches the BRD's own stated order:
"simple with polling first, then Pusher/Socket.io"). `ChatThread` (client component) hits
`GET /api/messages?with=<id>&since=<ISO timestamp>` every 3s and appends only what's new, rather
than re-fetching and re-rendering the whole thread — `since` is the last message's `createdAt` on
the client, not a server-tracked cursor. `/chat` (conversation list) is computed in JS from all of
the user's `Message` rows grouped by the other participant, not a separate "conversations" table —
fine at this scale, revisit with a real `Conversation` model only if the message volume ever makes
that scan slow. Starting a chat happens from `/matches` or `/sessions` ("Написать" link to
`/chat/[userId]`), not from a contact picker — there's no way yet to message someone you have no
match/session with, which is intentional (mirrors "you can only report/contact people you've
actually matched with").

**Admin (BR7, `/admin`)** — gated three times, not once: `src/proxy.ts` redirects non-`ADMIN`
sessions away from `/admin/*` at the edge, `src/app/admin/page.tsx` re-checks via
`requireAdmin()` (`src/lib/admin.ts`) and `redirect("/")`s otherwise, and every
`/api/admin/**` route re-checks `requireAdmin()` again before touching data. Don't remove any one
of these three thinking another covers it — they're deliberately redundant since this route can
block/unblock any account. Blocking a user is just flipping `User.isBlocked`; that field is already
enforced everywhere else (`signIn` callback rejects login, `proxy.ts` redirects to `/blocked`,
`findMatches()` filters blocked users out) — the admin panel doesn't need its own enforcement logic,
just the toggle. Reports go through `reporterId`/`targetId` + `reason` (filed via the `ReportButton`
component on `/matches` and `/sessions`) and move `OPEN → RESOLVED`/`DISMISSED`; there's no route
back to `OPEN` yet.

## Design

Soft pink/rose theme, applied via Tailwind's built-in `rose` palette (no custom color config) plus
a handful of `@layer components` classes in `src/app/globals.css` — `.btn-primary`, `.input-field`,
`.text-muted`, `.card`, `.pill`, `.badge-mutual`. Reach for those classes on new pages/components
instead of hand-rolling `bg-neutral-*`/`bg-rose-*` combinations inline; that's what keeps the whole
app visually consistent (and is the only place a future palette change needs to happen). `:root`'s
`--background`/`--foreground` in the same file set the page canvas (pure white / deep rose). The
theme is deliberately **not** dark-mode-aware: `@custom-variant dark (&:where(.dark, .dark *));` at
the top of `globals.css` neuters every Tailwind `dark:` class in the app (they only fire under an
explicit `.dark` ancestor, which nothing ever adds) so the site looks the same regardless of the
visitor's OS color-scheme setting — that was a deliberate fix after the white/pink redesign was
invisible to anyone on a dark-mode system. Leave the `dark:` classes in place when editing existing
files (harmless dead code, removing them is pure churn) but don't rely on `prefers-color-scheme`
CSS or add a real dark theme without first deciding to reverse this.

**Reviews (BR5, `Review`)** — the last MVP item, now built. `POST /api/reviews` (body `sessionId`,
`rating` 1–5, optional `text`) reuses `loadSkillSessionForParticipant()` from `src/lib/sessions.ts`
for the same "only the two participants" check as session actions, then requires
`skillSession.status === "COMPLETED"`; `targetId` is derived server-side as "whichever of
requester/partner isn't the caller" — the client never sends it. `/sessions` shows a `ReviewForm`
for each `COMPLETED` session the current user hasn't reviewed yet, or the existing review (via the
shared `Stars` component) once they have. `/profile` separately shows reviews *received* — a plain
average of `Review.rating` where `targetId` = the viewed user, computed in the page, not stored.

## Internationalization

Russian/English/Kazakh, switched by a button in `Nav` (`LanguageSwitcher`) — **no URL locale
prefix** (`/matches` stays `/matches` in every language); the choice lives in a plain `lang` cookie.
This was a deliberate tradeoff over `next-intl`-style `[locale]` routing: it avoids touching
`src/proxy.ts`'s matchers or restructuring every route under a locale segment, at the cost of the
language not being reflected in the URL or indexable per-locale — fine for an app that's entirely
behind auth anyway.

`src/lib/i18n/` has a hard split that matters:
- `types.ts` (the `Dictionary`/`Locale` types) and `format.ts` (a `{token}` → value templater, since
  dictionary values must stay plain strings — functions aren't serializable across the Server→Client
  Component boundary) and `constants.ts` (`LOCALES`, `DEFAULT_LOCALE`) have **no** `next/headers`
  import and are safe for Client Components.
- `index.ts` (the barrel: `getLocale()`, `getDict()`, `getDictionary()`) imports `next/headers`
  (`cookies()`) and is **Server-Component-only**. A Client Component must import `Dictionary`/`Locale`
  from `@/lib/i18n/types`, `format` from `@/lib/i18n/format`, `LOCALES` from `@/lib/i18n/constants` —
  importing any of those from the `@/lib/i18n` barrel instead pulls `next/headers` into the client
  bundle and fails the build (hit this exact error once; see `RegisterForm.tsx` for the working
  pattern). Every page is a Server Component that calls `getDict()` (and `getLocale()` where it also
  needs the raw code, e.g. for `Date#toLocaleString`) and passes the relevant `dict.<section>` slice
  down as a prop — there's no `useTranslations()`-style hook, just props.
- `ru.ts`/`en.ts`/`kk.ts` each implement the full `Dictionary` shape. Adding a UI string means adding
  the key to `types.ts` and all three language files — TypeScript will flag a missing key via the
  `Dictionary` type, so there's no silent "forgot to translate one language" failure mode.

`register`'s domain-not-allowed error is deliberately **not** read from the API's response body —
`RegisterForm` reconstructs it client-side from `dict.register.domainError` + its own hardcoded
`DISPLAY_DOMAINS` list, because `/api/register`'s error message is plain Russian with no locale
awareness. Follow that pattern (client-side message, not server `data.message`) for any other
API error that needs to show translated text, rather than localizing the API routes themselves.

## Not yet built

Everything in the BRD's MVP scope is implemented. What's left is not code:
- Verify `astanait.edu.kz` in Resend (Domains → SPF/DKIM) so real student addresses can receive
  magic-link mail, then narrow `ALLOWED_EMAIL_DOMAINS` back down from the temporary
  `astanait.edu.kz,gmail.com,icloud.com` to just the university domain.
- Production hosting on a Kazakhstan-based VPS (BRD data-residency requirement) — everything so far
  has only run against the local dev Postgres instance on this machine.
- Optional, "later" per the BRD: swap the chat's polling for Pusher/Socket.io, and build the
  React Native/Expo app on top of this same backend (would need token-based auth for the API instead
  of the cookie-based Auth.js session, since a mobile client can't share the browser's cookie jar).
