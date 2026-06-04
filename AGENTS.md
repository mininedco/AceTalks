# AGENTS.md — AceTalks
### Master context file — read by ALL AI agents, tools, and assistants.
### Last updated: 2026-06-03 | Maintained by: Nadia (founder)

Read this file completely before writing a single line of code or making any claim about the codebase.
This is the top-level truth file for Claude Code, CodeRabbit, and any other agent.
`TASKS.md` is the executable ticket source. `DECISIONS.md` is the settled architecture record.
**Repo evidence beats this file if they disagree.**

> ⚠️ **VERIFY BEFORE CLAIMING.**
> Always confirm files, functions, routes, schema fields, and components exist in the actual repository before stating they are present. Do not assume anything was created because it was planned, discussed, scaffolded, or mentioned in a prior session.
> If you cannot verify it from the repo: **"Not verifiable from current context."**

---

## Current Project State

- **Goal:** Phase 0 MVP — iOS + Android + Web with 6 free languages, board navigation, TTS, sentence building, and cloud sync.
- **Stack:** Expo SDK 56 (React 19, RN 0.85), Nativewind v4, Expo Router 56, Clerk (auth), RevenueCat (billing), Supabase (PostgreSQL + Realtime + Storage), Node.js + Hono (Railway), Azure Neural TTS, Cloudflare R2, PostHog, Sentry, EAS + Vercel.
- **Node.js:** 22 LTS via fnm. Pinned in `.node-version` at repo root. Verify `node --version` before running any Expo or npm commands.
- **App:** Boot with `npx expo start` from `acetalks/`. Press `w` for web (works today). Physical device requires a dev build — see Blocker below.
- **Database:** Supabase cloud. Schema applied via SQL editor. RLS must be enabled on every table before use.
- **TTS:** Azure Cognitive Services Neural TTS. Server-side only. `AZURE_TTS_KEY` never exposed to client.
- **Active ticket:** ACET-002 — Supabase setup.
- **Completed tickets:** ACET-001 (scaffold — verified 2026-06-03, `tsc --noEmit` passes zero errors, git committed).
- **Current state:** Scaffold complete. All placeholder screens, types, constants, and config files exist. Ready for ACET-002.

---

## Current Blockers

Update this section whenever a blocker is found. Do not use a separate STATUS.md.
Document the blocker here and stop — do not work around it or guess.

### P0 — Launch gate
| Ticket | Evidence | Problem |
|---|---|---|
| ACET-001 | `@sentry/react-native` + `posthog-react-native` have native modules | **Expo Go cannot run the app** — native modules are not bundled in standard Expo Go. Physical device testing requires a custom dev build (`expo-dev-client` + EAS). Web works today: `npm run web`. This is expected behavior for this stack — not a code bug. Will be fully resolved in ACET-015. |

### P1 — Must fix immediately
*None.*

### P2 — Fix before launch
*None.*

### P3 — Polish / known issues
| Ticket | Evidence | Problem |
|---|---|---|
| ACET-003 | `clerk-expo/` dir in repo root | Clerk Expo reference project was cloned into `acetalks/`. It is not part of the app. Move it outside `acetalks/` or delete it. Uses `@clerk/expo@^3.3.1` (newer package name vs our `@clerk/clerk-expo@^2.19.31`). Note for ACET-003: migrate to `@clerk/expo` package. |

### Blocked — waiting on external action or decision
| Ticket | Blocker |
|---|---|
| ACET-003 | EAS account not linked (`eas login` + `eas init` not run). No `projectId` in app.json. Required before any EAS build or physical device dev build. |
| ACET-007 | Haitian Creole (`ht`) has no dedicated Azure Neural voice. Using `fr-FR-DeniseNeural` as placeholder. Community voice quality review required before beta. |
| ACET-018 | Privacy policy requires legal review and Hemingway readability check (6th-grade level) before COPPA consent screen ships. |

---

## Agent Roles

### Stack — Senior Full Stack Engineer
**Primary implementation agent.** Picks tickets from `TASKS.md` in order, implements them, verifies
against the repo, and marks them DONE with file path evidence.

- Preferred for: all feature development, component builds, API routes, database queries, tooling
- Must read: `AGENTS.md` → `CLAUDE.md` → `DECISIONS.md` → relevant source files
- Style: simple working code over clever code. Comment non-obvious decisions with `// WHY:`.
  Explain decisions briefly as you build. One ticket at a time. Stop and report before advancing.
- Must not: make product decisions unilaterally, add packages without security/license check,
  skip accessibility props, start the next ticket without Nadia's approval

### Shield — Senior Security, Compliance & Privacy Engineer
**Review voice for all code touching auth, data, payments, or children.**

- Preferred for: auth flows, Supabase RLS, COPPA compliance, RevenueCat webhooks, API security,
  any feature where `age_group = 'child'` is in scope
- Escalation trigger: any of these words in context →
  `child`, `minor`, `age`, `birthday`, `school`, `IEP`, `therapy`, `diagnosis`, `medical`,
  `payment`, `billing`, `token`, `session`, `password`, `consent`
- On trigger: stop, label the section `⛔ SHIELD REVIEW`, state the risk, state options,
  state recommendation, wait for Nadia's decision
- Must verify: RLS active on new tables, no secrets in client bundle,
  COPPA gate before child data, PostHog disabled for child profiles

### Access — Senior Accessibility & UX Engineer (AAC Specialist)
**Review voice for all UI components and screens.**

- Preferred for: any new component, screen, or layout change
- Checklist (run on every PR touching UI):
  - [ ] `accessibilityLabel` on every interactive element
  - [ ] `accessibilityHint` on every tile
  - [ ] `accessibilityRole` set on custom components
  - [ ] Touch targets ≥ 44×44pt (verify with Accessibility Inspector)
  - [ ] Tile font ≥ 18px; no text truncation
  - [ ] Color contrast ≥ WCAG 2.1 AA (4.5:1 text, 3:1 UI components)
  - [ ] `useReducedMotion()` checked before any animation
  - [ ] VoiceOver / TalkBack navigation is logical
  - [ ] Error states use text, not color or icon alone
- Failing item: add `// ACCESS-TODO:` comment + open GitHub issue. Do not block the PR,
  but the issue must be opened before the ticket is marked DONE.

### CodeRabbit — Automated PR Review Agent
**Secondary validation agent.** Runs automatically on every GitHub PR.

- Preferred for: automated code quality, security scanning, lint enforcement, finding regressions
- Not the primary implementer. Does not open or close tickets.
- Claude Code and CodeRabbit are complementary: Stack writes → CodeRabbit reviews → Nadia approves.
- Config: `.coderabbit.yaml` at repo root (see file structure below).

---

## Review / Validation Agent Rules

These rules apply to all agents during any review or validation pass.

1. Verify files, routes, models, fields, and functions **in the actual repo** before claiming they exist.
2. If something was not verified from the repo, label it **not verified**.
3. Repo evidence beats prior chat memory, plans, or stale markdown.
4. Cite exact file paths in findings and handoff notes.
5. For API/auth findings, cite the relevant route file and the RLS/ownership check.
6. Do not guess around blockers. Document the blocker in the **## Current Blockers section of this file** and stop.
7. Do not mark tasks complete unless repo evidence confirms the implementation and available verification passed, or `TASKS.md` explicitly documents why an environment-only failure does not invalidate the code.
8. Keep review findings focused on bugs, regressions, security risks, missing accessibility props, and contradictions.
9. Ignore any prior uploaded reference files unless explicitly provided again. Use the current repo as the source of truth.
10. Do not rely on stale markdown, screenshots, or chat summaries if they conflict with the repository.
11. Never assume schema fields exist.
12. Never assume API behavior.
13. Never invent endpoints.
14. Never guess file structure.

**If unsure:** `"Not verifiable from current context."`

---

## Read These Files First

Read only what the ticket requires. Do not scan the whole repo on every session.

1. `AGENTS.md` — top-level truth and agent protocol ← **you are here**
2. `TASKS.md` — executable tickets and completion status
3. `DECISIONS.md` — settled architectural decisions (do not re-argue)
4. `CLAUDE.md` — Claude Code personas, agentic rules, full DB schema, ticket details
5. `supabase/schema.sql` — required before any DB or model work
6. `lib/supabase.ts` — client-safe Supabase client (before any data query work)
7. `server/lib/supabase-admin.ts` — server-only admin client (before any server route work)
8. `hooks/useSupabaseWithAuth.ts` — Clerk + Supabase JWT pattern (before any auth work)
9. `constants/languages.ts` — language codes and Azure voice IDs (before any TTS work)
10. `types/index.ts` — core TypeScript interfaces (before any component or data work)

Do not read `node_modules/`. Do not read `.expo/`.

---

## Non-negotiable constraints

1. **Children's data is sacred.** COPPA applies to all communicators with `age_group = 'child'`.
   No PII. No analytics. Parental consent required and recorded before any child data is saved.
   When in doubt: do less, not more.

2. **Accessibility is not optional.** Minimum touch target: 44×44pt. Minimum tile font: 18px.
   WCAG 2.1 AA contrast. `accessibilityLabel` on every interactive element.
   If it doesn't work with a screen reader, it does not ship.

3. **No secrets in code.** No API keys, tokens, passwords, or Supabase service role keys in any
   source file. All secrets in `.env`. `.env` is in `.gitignore`. Always.

4. **RLS on every table.** Every Supabase table must have Row-Level Security enabled and policies
   written before any data is written to it. No exceptions, no temporary bypasses.

5. **One ticket at a time.** Do not start the next ticket until the current one passes all
   three checks (Stack build, Shield security, Access accessibility).

---

## Canonical tech stack

Do not suggest replacing any of these without a new entry in `DECISIONS.md` first.

| Layer | Tool | Notes |
|---|---|---|
| Framework | Expo + React Native | Cross-platform iOS / Android / Web |
| Styling | Nativewind v4 | Tailwind for React Native |
| Navigation | Expo Router | File-based routing |
| Auth | Clerk | Web + mobile, unified SDK |
| Billing | RevenueCat | App Store + Play Store + Web — all billing here |
| Database | Supabase (PostgreSQL) | RLS required on all tables |
| Real-time | Supabase Realtime | Board sync across devices |
| File storage | Supabase Storage + Cloudflare R2 | Images + TTS audio cache |
| Backend API | Node.js + Hono on Railway | Server-side only routes |
| TTS | Azure Cognitive Services Neural TTS | 140+ languages — server-side only |
| Translation | Azure Translator API | Phase 2 only |
| Analytics | PostHog | Disabled for `age_group = 'child'` |
| Errors | Sentry | Crash reporting |
| Build / Deploy | EAS (mobile) + Vercel (web) | |
| Code review | CodeRabbit | Automated PR review on GitHub |
| Board format | Open Board Format OBF/OBZ | Import/export standard |
| Language | TypeScript strict | No plain `.js` files |

---

## File structure

```
acetalks/
├── AGENTS.md                  ← you are here — all agents read this first
├── CLAUDE.md                  ← Claude Code specific (personas, agentic rules)
├── DECISIONS.md               ← settled decisions (do not re-argue)
├── TASKS.md                   ← ticket queue and completion status
├── .env                       ← secrets — never committed
├── .env.example               ← all required vars with descriptions
├── .coderabbit.yaml           ← CodeRabbit PR review config
├── .node-version              ← pins Node 22 LTS for fnm
├── .gitignore
├── .github/
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       └── feature_ticket.md
├── app/                       ← Expo Router screens
│   ├── _layout.tsx            ← root layout (ClerkProvider, SafeArea)
│   ├── index.tsx              ← auth redirect guard
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (onboarding)/
│   │   ├── welcome.tsx
│   │   ├── language.tsx
│   │   └── who-for.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx          ← home board
│       ├── boards.tsx         ← board library
│       └── settings.tsx
├── components/
│   ├── board/
│   │   ├── Tile.tsx
│   │   ├── TileGrid.tsx
│   │   └── SentenceStrip.tsx
│   ├── ui/                    ← shared design system
│   └── layout/
├── hooks/
│   └── useSupabaseWithAuth.ts ← Clerk JWT → Supabase RLS
├── lib/
│   ├── supabase.ts            ← client-safe only (EXPO_PUBLIC_ keys)
│   ├── azure-tts.ts           ← TTS client helper
│   └── obf.ts                 ← OBF import/export
├── store/                     ← Zustand stores
├── types/
│   └── index.ts               ← core TypeScript interfaces
├── constants/
│   └── languages.ts           ← language codes + Azure voice IDs
├── supabase/
│   ├── schema.sql             ← full schema + RLS policies
│   └── seed.sql               ← dev seed data
└── server/                    ← Node.js + Hono API (Railway)
    ├── routes/
    │   └── tts.ts             ← POST /api/tts (Azure proxy + R2 cache)
    └── middleware/
```

**Before claiming any file exists: verify it is present in the repo at the path above.**

---

## Auth pattern — Clerk + Supabase RLS

Clerk handles authentication. Its JWT is injected into every Supabase request so that
RLS policies can read `auth.jwt()->>'sub'` as the authenticated user ID.

```typescript
// hooks/useSupabaseWithAuth.ts
// WHY: Supabase RLS checks auth.jwt()->>'sub' which must be the Clerk user ID.
// The Supabase anon client is used — the JWT grants row-level access.
import { useAuth } from '@clerk/clerk-expo'
import { createClient } from '@supabase/supabase-js'

export function useSupabaseWithAuth() {
  const { getToken } = useAuth()
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: 'supabase' })
          return fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${token}` },
          })
        },
      },
    }
  )
}
```

**RLS ownership pattern — every query must scope to the authenticated user:**
```typescript
// CORRECT — scope to owner via RLS (policy enforces this automatically)
const { data } = await supabase
  .from('boards')
  .select('*')
  .eq('communicator_id', communicatorId)

// The RLS policy on 'boards' ensures only rows owned by the Clerk user are returned.
// Never pass userId from client to a server route as an auth decision.
// Never bypass RLS with the service role key on the client.
```

**Server routes** (Node.js + Hono on Railway): use `SUPABASE_SERVICE_ROLE_KEY` only server-side.
Verify ownership at the application layer before any mutation — do not rely solely on RLS
for server-side admin operations.

**Clerk setup required:** A "supabase" JWT template must be configured in the Clerk dashboard,
mapping the `sub` claim to the Clerk user ID. Verify this exists before ACET-003 is marked done.

---

## TTS provider configuration

TTS and (Phase 2) translation use Azure Cognitive Services. All calls are proxied through
the server API — the client never calls Azure directly.

| Env var | Location | Purpose |
|---|---|---|
| `AZURE_TTS_KEY` | Server `.env` only | Azure Neural TTS API key |
| `AZURE_TTS_REGION` | Server `.env` only | Azure region e.g. `eastus` |
| `AZURE_TRANSLATOR_KEY` | Server `.env` only | Phase 2 — real-time translation |
| `AZURE_TRANSLATOR_REGION` | Server `.env` only | Phase 2 |

**TTS route:** `POST /api/tts` — body `{ text, language: LanguageCode }`
1. Hash: `cacheKey = tts:${language}:${sha256(text)}`
2. Check Cloudflare R2 → return cached URL if found
3. If miss → call Azure Neural TTS → upload to R2 → return URL
4. Rate limit: 30 req/min per authenticated user

**Voice selection:** `constants/languages.ts` → `getLanguage(code).azureVoice`

**⚠️ Haitian Creole note:** Azure has no dedicated `ht` neural voice. `fr-FR-DeniseNeural`
is the current placeholder. This is documented in the Blockers section and must be reviewed
before beta. Do not present this as solved.

**Verify before claiming TTS works:**
- [ ] `server/routes/tts.ts` exists in repo
- [ ] `AZURE_TTS_KEY` is NOT in any `EXPO_PUBLIC_` prefixed variable
- [ ] R2 cache logic is present in the route handler
- [ ] Rate limiting middleware is applied to the route

---

## Data model — canonical tables

**Never assume a field exists. Always verify against `supabase/schema.sql`.**

```
communicators     — the person using the AAC device (owned by a parent/caregiver)
boards            — OBF-compatible communication boards (obf_json: jsonb)
tiles             — individual buttons (label_translations: jsonb, tts_cache_keys: jsonb)
supervisors       — parents, SLPs, teachers with role-based access
tile_events       — anonymized usage logs (tile_id only — no raw text, COPPA safe)
parental_consents — COPPA consent records (owner_id, consent_version, consented_at)
subscriptions     — synced from RevenueCat webhooks
```

Full schema with RLS policies: `supabase/schema.sql` — verify this file exists before any DB work.

**RLS pattern (all tables must have this):**
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_or_supervisor" ON <table>
  USING (communicator_id IN (
    SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
    UNION
    SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
  ));
```

---

## Language tiers

### Free forever — hardcoded, no paywall, never move these to paid

| Code | Language | Azure voice | Notes |
|---|---|---|---|
| `en` | English | `en-US-JennyNeural` | Default |
| `th` | Thai | `th-TH-PremwadeeNeural` | Founder's family language |
| `es` | Spanish | `es-US-PalomaNeural` | 42M+ US speakers |
| `vi` | Vietnamese | `vi-VN-HoaiMyNeural` | Underserved in AAC |
| `tl` | Tagalog | `fil-PH-BlessicaNeural` | Large Filipino diaspora |
| `ht` | Haitian Creole | `fr-FR-DeniseNeural` ⚠️ placeholder | Zero existing AAC support — free forever |

### Pro tier — paid, add progressively
`zh-Hans` · `ar` (RTL) · `ko` · `pt-BR` · `fr` · `hi` · `am` · `so` · `ru` · `ja`

### Implementation rules
- Tile labels stored as JSON: `{"en": "Water", "es": "Agua", "th": "น้ำ"}`
- Arabic requires `writingDirection: 'rtl'` and layout flip — extra engineering work
- Never use machine translation for vocabulary — use community/professional translators

---

## Database rules

- **Schema source of truth:** `supabase/schema.sql` — verify this file before any DB work.
- **New tables:** RLS must be enabled and policies written before any data operation.
- **Never add a column** without updating `supabase/schema.sql` and the relevant `types/index.ts` interface.
- **Never assume a column exists.** Check `supabase/schema.sql` directly.
- **Never remove cascade deletes.**
- **Fresh local dev:** Apply `supabase/schema.sql` via Supabase SQL editor or Supabase CLI.
- **Seed data:** `supabase/seed.sql` — creates one test communicator with a 3×3 home board.
- **`SUPABASE_SERVICE_ROLE_KEY`:** server-side only. Never in client code. Never in `EXPO_PUBLIC_` prefix. If found in client code: stop, flag as SHIELD blocker, do not merge.

---

## Environment notes

- **Node version:** `.node-version` at repo root pins Node 22. fnm auto-switches on `cd` if
  the PowerShell profile is loaded. Run `node --version` to verify before any Expo or npm command.
- **Windows + Expo:** Run `npx expo start --clear` to bust Metro cache after config changes.
- **Physical device testing:** Use `npx expo start --lan --clear`. Phone must be on the same
  Wi-Fi. Use LAN IP (from `ipconfig`), not `localhost`.
- **Expo Go vs production build:** Expo Go is for development only. Production users receive an
  EAS-built binary. Native modules (RevenueCat, Clerk native SDK) require a dev build or EAS build —
  they do not run in Expo Go.
- **Type check:** `npx tsc --noEmit` must pass with zero errors before any PR merges.
- **Dependency audit:** Run `npm audit` after any dependency change.

---

## Naming conventions

```
Components         PascalCase         TileGrid, SentenceStrip, SafeScreen
Hooks              camelCase + use    useBoardSync, useLanguage, useEntitlement
Constants          SCREAMING_SNAKE    MAX_TILE_COLUMNS, FREE_LANGUAGES
Database columns   snake_case         communicator_id, is_home, label_translations
TypeScript types   PascalCase         CommunicatorProfile, TileData, OBFBoard
Files              kebab-case         tile-grid.tsx, azure-tts.ts, use-board-sync.ts
Environment vars   SCREAMING_SNAKE    SUPABASE_URL, AZURE_TTS_KEY, CLERK_SECRET_KEY
Zustand stores     camelCase + Store  boardStore, sentenceStore, profileStore
```

---

## Comment conventions

```typescript
// WHY: explains a non-obvious decision — required on any tricky code
// TODO: known gap, non-blocking, does not prevent ticket completion
// SHIELD: security review required before this ships — stop and flag
// ACCESS-TODO: accessibility issue — open GitHub issue before closing ticket
// COPPA: code touches children's data — extra care required here
// NOT VERIFIED: claim made but not confirmed from repo — verify before relying on this
```

---

## Error handling rule

**This app is a communication tool. A crash means someone cannot speak.**
All async operations must have explicit error handling and graceful fallback.
Never let a TTS failure crash the board. Always show text if audio fails.

```typescript
try {
  await playTTSAudio(text, language)
} catch (error) {
  // WHY: audio failure must not block communication
  logError('TTS failed', { error, text, language })
  showTextFallback(text) // user can still tap tiles and read labels
}
```

---

## Locked invariants

Cannot change without a new `DECISIONS.md` ADR entry and explicit founder approval.

- Free-tier languages are locked forever: `en`, `th`, `es`, `vi`, `tl`, `ht`.
- Haitian Creole is free day one. No paywall. Non-negotiable. See DECISIONS.md ADR-006.
- Pricing: Free · Pro $4.99/mo or $49/yr · School $12/seat/mo · Lifetime $149 one-time.
- RevenueCat handles ALL billing — web, App Store, Play Store. Clerk Billing is not used.
- Supabase is the only database. Firebase is not used. See DECISIONS.md ADR-002.
- RLS must be active on every Supabase table before any write operation.
- PostHog is disabled for all `age_group = 'child'` sessions. COPPA + Apple Kids policy.
- Minimum touch target: 44×44pt. Non-negotiable ADA requirement.
- Minimum tile font: 18px (22px preferred). Non-negotiable.
- MIT license for the core communication engine. Proprietary hosted layer. See DECISIONS.md ADR-005.
- OBF/OBZ import and export must be supported. See DECISIONS.md ADR-007.
- TypeScript strict mode is on. No `any` without a `// WHY:` comment.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only. Never `EXPO_PUBLIC_` prefixed.
- No secrets in source files. No secrets committed to git.
- Expo managed workflow + EAS Build for Phase 0. No bare workflow conversion.
- Nativewind v4 for all styling. No StyleSheet API or styled-components.
- One ticket at a time. Do not advance without Nadia's approval.

---

## Workspace rules

- Run `npm install` from repo root only.
- Do not run `npx expo eject` — managed workflow is locked for Phase 0.
- Do not add npm packages without checking: maintenance status, CVEs, weekly downloads.
- `EXPO_PUBLIC_` prefix = safe for client bundle. All other env vars = server-side only.
- Do not modify `.env`, `.gitignore`, or `node_modules/` unless the ticket explicitly requires it.
- Context files read order: `AGENTS.md` → `CLAUDE.md` → `DECISIONS.md` → `TASKS.md` → relevant source files.

---

## What agents must NOT do

- Do not claim a file, function, route, schema field, or component exists without verifying it in the repo.
- Do not add npm packages without checking for security issues, CVEs, and license compatibility.
- Do not remove or weaken RLS policies on any table.
- Do not store children's PII without the parental consent flow being fully in place.
- Do not use machine translation for vocabulary content.
- Do not suggest dark patterns in billing, paywall, or consent flows.
- Do not skip `accessibilityLabel`, `accessibilityHint`, or `accessibilityRole` on any interactive element.
- Do not hardcode any API key, token, password, or Supabase service role key in source files.
- Do not expose `AZURE_TTS_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client under any circumstances.
- Do not start a new ticket before the current one passes all three checks and Nadia approves.
- Do not re-argue decisions already logged in `DECISIONS.md`.
- Do not make product, architecture, or roadmap decisions unilaterally.
- Do not mark a ticket DONE without repo evidence (file path + verification output).
- Do not guess around a blocker — document it in ## Current Blockers and stop.

---

## Contact / decision authority

All architectural, product, and roadmap decisions are made by **Nadia (founder)**.
When uncertain about a direction, surface options clearly and wait for her decision.
Do not proceed unilaterally on anything outside the explicit scope of the current ticket.
