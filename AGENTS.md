# AGENTS.md — AceTalks
### Master context file — read by ALL AI agents, tools, and assistants.
### Last updated: 2026-06-12 | Maintained by: Ned (founder) | Template pass: 2026-06-12

Read this file completely before writing a single line of code or making any claim about the codebase.
This is the top-level truth file for Claude Code, CodeRabbit, and any other agent.
`TASKS.md` is the executable ticket source. `DECISIONS.md` is the settled architecture record.
**Repo evidence beats this file if they disagree.**

> ⚠️ **VERIFY BEFORE CLAIMING.**
> Always confirm files, functions, routes, schema fields, and components exist in the actual
> repository before stating they are present. Do not assume anything was created because it
> was planned, discussed, scaffolded, or mentioned in a prior session.
> If you cannot verify it from the repo: **"Not verifiable from current context."**

---

## Current Project State

- **Goal:** Phase 0 MVP — iOS + Android + Web with 6 free languages, board navigation, TTS, sentence building, and cloud sync.
- **Stack:** Expo SDK 56 (React 19, RN 0.85), Nativewind v4, Expo Router 56, Clerk `@clerk/expo@3.x`, RevenueCat, Supabase (PostgreSQL + Realtime + Storage), Node.js + Hono (Railway), Azure Neural TTS, Cloudflare R2, Upstash Redis, PostHog, Sentry, EAS + Vercel.
- **Node.js:** 22 LTS via fnm. Pinned in `.node-version` at repo root. Run `node --version` before any Expo or npm command.
- **App:** Boot with `npm run web` for web (works today). Physical device requires EAS dev build — see Blockers.
- **Database:** Supabase cloud. Schema applied via SQL editor. RLS enabled on all 7 tables.
- **TTS:** Azure Cognitive Services Neural TTS. Server-side only via Railway. `AZURE_TTS_KEY` never in client.
- **Rate limiting:** Upstash Redis sliding window — `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` required in Railway env.
- **Active ticket:** ACET-011 — RevenueCat billing.
- **Completed tickets:** ACET-001–010 (scaffold through real-time sync), ACET-021 (RLS fix), ACET-022 (Upstash Redis rate limiting). All verified 2026-06-09, `tsc --noEmit` zero errors.
- **Current state:** Full board flow functional — sign-in → onboarding → home board → tile grid → TTS audio → sentence strip → board navigation. Core communication loop is wired.
- **Ticket template status (2026-06-12):** All OPEN tickets in `TASKS.md` now have the full template: `## Files`, `## Acceptance criteria`, `## Proof of completion`, `## Constraints`, `## Notes`. Tickets ACET-011 through ACET-030 updated.

---

## Current Blockers

Update this section whenever a blocker is found. Do not use a separate STATUS.md.
Document the blocker here and stop — do not work around it or guess.

### P0 — Launch gate
| Ticket | Evidence | Problem |
|---|---|---|
| ACET-002 | `supabase/rls-fix.sql` | **RLS infinite recursion** — `communicators` ↔ `supervisors` policies have circular subqueries (PostgreSQL error 42P17). Fix written to `supabase/rls-fix.sql`. **Ned must run this in the Supabase SQL editor before the app can query communicators, boards, or tiles.** |
| ACET-003 | `AGENTS.md` environment notes | **Expo Go cannot run the app** — native modules require EAS dev build. Web works: `npm run web`. Resolved in ACET-015. |
| ACET-003 | Clerk dashboard | **"supabase" JWT template not yet created** — `useSupabaseWithAuth` will fail until set up in Clerk dashboard (Settings → JWT Templates → New → Supabase). RLS queries return 0 rows without it. |

### P0 — Security
| Ticket | Problem |
|---|---|
| ACET-022 | **Upstash Redis env vars not yet set in Railway** — `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` must be added to Railway environment before deploying server. |
| ACET-023 | **COPPA hard gate missing** — child communicator records can be created without a `parental_consents` row. Illegal under COPPA. |

### P2 — Fix before launch
| Ticket | Evidence | Problem |
|---|---|---|
| ACET-SEC-002 | Dependabot job `1397087686` | **`uuid@8.3.2` transitive CVE** — no fix available until upstream deps update. No action from this team until upstream resolves. |

### Blocked — waiting on external action
| Ticket | Blocker |
|---|---|
| ACET-003 | EAS account not linked — `eas login` + `eas init` not run. No `projectId` in app.json. Required before any EAS build. |
| ACET-007 | Haitian Creole (`ht`) has no dedicated Azure Neural voice. Using `fr-FR-DeniseNeural` as placeholder. Community voice quality review required before beta. |
| ACET-018 | Privacy policy requires legal review and Hemingway readability check (6th-grade level) before COPPA consent screen ships. |

---

## Ticket Scope Rules

**These rules exist to conserve tokens and prevent unintended changes outside ticket scope.**

1. **Read only what the ticket specifies.** Each ticket lists a `## Files` section.
   Only read those files before starting. Do not scan the full repo, run `find`,
   or read files outside the ticket scope unless a blocker requires it — and if
   it does, document why in ## Current Blockers.

2. **No speculative file reads.** Do not read a file "just to check" if it might
   be relevant. If the ticket doesn't list it, don't open it.

3. **Proof of work = file path + line number + content snippet.** When marking
   a ticket complete, cite evidence in this exact format:
   ```
   ✅ VERIFIED: components/board/Tile.tsx:42 — `export function Tile(`
   ✅ VERIFIED: lib/supabase.ts:8 — `export const supabase = createClient(`
   ```
   A file path alone is not proof. A line number without a snippet is not proof.

4. **Do not reload AGENTS.md, CLAUDE.md, or DECISIONS.md mid-ticket.**
   These are loaded once at session start. Do not re-read them unless explicitly instructed.

5. **Tool call budget per ticket: 20 file reads maximum.**
   If approaching 20 reads and the ticket isn't done, stop and document
   the blocker. You are scope-creeping.

6. **One persona per ticket.** Do not context-switch between Stack / Shield / Access mid-ticket.
   The ticket spec declares which persona runs it. Shield and Access run their checks after
   Stack finishes — not during.

---

## Token Optimization Rules

1. **Load context lazily.** Read a file only when you are about to edit it, not before.
   Do not pre-load files at session start "for context."

2. **Prefer targeted reads over full file reads.** When checking whether a function exists,
   read the relevant section (lines 1–50 for imports, specific function range) rather than
   the full file.

3. **Write first, verify second.** For new files, write the full implementation then verify
   it compiles. Don't read adjacent files first to "understand the pattern" — the ticket
   spec is the pattern.

4. **Never re-read a file already read this session** unless you wrote to it and need to
   verify the change.

5. **Commit before context gets long.** If many files are touched or the session is complex,
   commit the current working state before continuing. A clean commit is a natural context boundary.

---

## Agent Roles

### Stack — Senior Full Stack Engineer
**Primary implementation agent.** Picks tickets from `TASKS.md` in order, implements them,
verifies against the repo, and marks them DONE with file path + line number + snippet evidence.

- Preferred for: all feature development, component builds, API routes, database queries, tooling
- Must read: `AGENTS.md` → ticket `## Files` section → relevant source files only
- Style: simple working code over clever code. Comment non-obvious decisions with `// WHY:`.
  Explain decisions briefly as you build. One ticket at a time. Stop and report before advancing.
- Must not: make product decisions unilaterally, add packages without security/license check,
  skip accessibility props, start the next ticket without Ned's approval
- **Pre-flight before adding any dependency:** check `npm audit` output; verify weekly downloads
  on npmjs.com; confirm no known CVEs. Do not add packages that pin `uuid@8.x`.
- **Before writing any SQL or Supabase query:** verify Clerk JWT `sub` claim is in scope and
  RLS policies cover the query. Never use `supabaseAdmin` in client code.
- **Local profile caching:** always use `expo-secure-store`, never `AsyncStorage`, for any data
  containing user IDs, session flags, or profile data.

### Shield — Senior Security, Compliance & Privacy Engineer
**Review voice for all code touching auth, data, payments, or children.**

- Preferred for: auth flows, Supabase RLS, COPPA compliance, RevenueCat webhooks, API security,
  any feature where `age_group = 'child'` is in scope
- Escalation trigger: any of these words in context →
  `child`, `minor`, `age`, `birthday`, `school`, `IEP`, `therapy`, `diagnosis`, `medical`,
  `payment`, `billing`, `token`, `session`, `password`, `consent`
- On trigger: stop, label `⛔ SHIELD REVIEW`, state the risk, state options,
  state recommendation, wait for Ned's decision
- Must verify: RLS active on new tables, no secrets in client bundle,
  COPPA gate before child data, PostHog disabled for child profiles

### Access — Senior Accessibility & UX Engineer (AAC Specialist)
**Review voice for all UI components and screens.**

- Preferred for: any new component, screen, or layout change
- Checklist (run on every PR touching UI):
  - [ ] `accessibilityLabel` on every interactive element
  - [ ] `accessibilityHint` on every tile
  - [ ] `accessibilityRole` set on custom components
  - [ ] Touch targets ≥ 44×44pt
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
- Claude Code and CodeRabbit are complementary: Stack writes → CodeRabbit reviews → Ned approves.
- Config: `.coderabbit.yaml` at repo root.

---

## Review / Validation Agent Rules

1. Verify files, routes, models, fields, and functions **in the actual repo** before claiming they exist.
2. If something was not verified from the repo, label it **not verified**.
3. Repo evidence beats prior chat memory, plans, or stale markdown.
4. Cite exact file paths **and line numbers** in findings and handoff notes.
5. For API/auth findings, cite the relevant route file and the RLS/ownership check.
6. Do not guess around blockers. Document the blocker in **## Current Blockers** and stop.
7. Do not mark tasks complete unless repo evidence (file + line + snippet) confirms implementation.
8. Keep review findings focused on bugs, regressions, security risks, missing accessibility props, and contradictions.
9. Ignore any prior uploaded reference files unless explicitly provided again. Repo is source of truth.
10. Do not rely on stale markdown, screenshots, or chat summaries if they conflict with the repo.
11. Never assume schema fields exist.
12. Never assume API behavior.
13. Never invent endpoints.
14. Never guess file structure.

**If unsure:** `"Not verifiable from current context."`

---

## Read These Files First

**Read only what the ticket requires. Do not scan the whole repo on every session.**

Session start (once only — do not re-read mid-ticket):
1. `AGENTS.md` ← you are here
2. `TASKS.md` — executable tickets and completion status
3. `DECISIONS.md` — settled architectural decisions

Then only if the ticket's `## Files` section includes them:
4. `CLAUDE.md` — Claude Code personas, agentic rules
5. `supabase/schema.sql` — before any DB or model work
6. `lib/supabase.ts` — before any data query work
7. `server/lib/supabase-admin.ts` — before any server route work
8. `hooks/useSupabaseWithAuth.ts` — before any auth work
9. `constants/languages.ts` — before any TTS work
10. `types/index.ts` — before any component or data work

Do not read `node_modules/`. Do not read `.expo/`.
Do not read files not listed in the ticket's `## Files` section.

---

## Non-negotiable Constraints

1. **Children's data is sacred.** COPPA applies to all `age_group = 'child'` communicators.
   No PII. No analytics. Parental consent required and recorded before any child data is saved.

2. **Accessibility is not optional.** Minimum touch target: 44×44pt. Minimum tile font: 18px.
   WCAG 2.1 AA contrast. `accessibilityLabel` on every interactive element.
   If it doesn't work with a screen reader, it does not ship.

3. **No secrets in code.** No API keys, tokens, passwords, or service role keys in any source file.
   All secrets in `.env`. `.env` is in `.gitignore`. Always.

4. **RLS on every table.** Every Supabase table must have Row-Level Security enabled and policies
   written before any data is written to it. No exceptions.

5. **One ticket at a time.** Do not start the next ticket until the current one passes all
   three checks (Stack build, Shield security, Access accessibility) and Ned approves.

---

## Canonical Tech Stack

Do not suggest replacing any of these without a new entry in `DECISIONS.md` first.

| Layer | Tool | Notes |
|---|---|---|
| Framework | Expo + React Native | Cross-platform iOS / Android / Web |
| Styling | Nativewind v4 | Tailwind for React Native |
| Navigation | Expo Router | File-based routing |
| Auth | Clerk `@clerk/expo@3.x` | Web + mobile, unified SDK |
| Billing | RevenueCat | App Store + Play Store + Web |
| Database | Supabase (PostgreSQL) | RLS required on all tables |
| Real-time | Supabase Realtime | Board sync across devices |
| File storage | Supabase Storage + Cloudflare R2 | Images + TTS audio cache |
| Backend API | Node.js + Hono on Railway | Server-side only |
| TTS | Azure Cognitive Services Neural TTS | 140+ languages — server-side only |
| Rate limiting | Upstash Redis | Sliding window, 30 req/min per user |
| Analytics | PostHog | Disabled for `age_group = 'child'` |
| Errors | Sentry | Crash reporting |
| Build / Deploy | EAS (mobile) + Vercel (web) | |
| Code review | CodeRabbit | Automated PR review on GitHub |
| Board format | Open Board Format OBF/OBZ | Import/export standard |
| Language | TypeScript strict | No plain `.js` files |

---

## File Structure

```
acetalks/
├── AGENTS.md
├── CLAUDE.md
├── DECISIONS.md
├── TASKS.md
├── .env                       ← secrets — never committed
├── .env.example
├── .coderabbit.yaml
├── .node-version              ← pins Node 22 LTS
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/sign-in.tsx
│   ├── (auth)/sign-up.tsx
│   ├── (onboarding)/welcome.tsx
│   ├── (onboarding)/language.tsx
│   ├── (onboarding)/who-for.tsx
│   └── (tabs)/index.tsx
├── components/
│   ├── board/Tile.tsx
│   ├── board/TileGrid.tsx
│   └── board/SentenceStrip.tsx
├── hooks/
│   ├── useSupabaseWithAuth.ts
│   ├── useBoardSync.ts
│   ├── useBoardNavigation.ts
│   ├── useHomeBoardData.ts
│   └── useTtsAudio.ts
├── lib/
│   ├── supabase.ts
│   ├── azure-tts.ts
│   ├── obf.ts
│   └── r2-cache.ts
├── store/
│   ├── boardStore.ts
│   ├── sentenceStore.ts
│   └── onboardingStore.ts
├── types/index.ts
├── constants/languages.ts
├── supabase/
│   ├── schema.sql
│   ├── rls-fix.sql            ← run manually in Supabase SQL editor
│   └── seed.sql
└── server/
    ├── routes/tts.ts
    ├── lib/supabase-admin.ts
    └── middleware/
```

**Before claiming any file exists: verify it is present in the repo at the path above.**

---

## Auth Pattern — Clerk + Supabase RLS

```typescript
// hooks/useSupabaseWithAuth.ts:1
// WHY: Supabase RLS checks auth.jwt()->>'sub' which must be the Clerk user ID.
import { useAuth } from '@clerk/expo'
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

**Clerk setup required:** A "supabase" JWT template must exist in the Clerk dashboard
before ACET-003 is marked done.

---

## TTS Provider Configuration

All TTS calls proxied through the server. Client never calls Azure directly.

| Env var | Location | Purpose |
|---|---|---|
| `AZURE_TTS_KEY` | Server `.env` only | Azure Neural TTS API key |
| `AZURE_TTS_REGION` | Server `.env` only | Azure region e.g. `eastus` |
| `UPSTASH_REDIS_REST_URL` | Server `.env` only | Rate limit store URL |
| `UPSTASH_REDIS_REST_TOKEN` | Server `.env` only | Rate limit auth token |

**⚠️ Haitian Creole:** No dedicated `ht` Azure neural voice. `fr-FR-DeniseNeural` is placeholder.
Documented in Blockers. Do not present as solved.

**Verify before claiming TTS works:**
- [ ] `server/routes/tts.ts` exists in repo
- [ ] `AZURE_TTS_KEY` is NOT in any `EXPO_PUBLIC_` prefixed variable
- [ ] R2 cache logic is present in the route handler
- [ ] Upstash Redis rate limiting middleware is applied to the route

---

## Data Model — Canonical Tables

**Never assume a field exists. Always verify against `supabase/schema.sql`.**

```
communicators     — the person using the AAC device
boards            — OBF-compatible communication boards (obf_json: jsonb)
tiles             — individual buttons (label_translations: jsonb, tts_cache_keys: jsonb)
supervisors       — parents, SLPs, teachers with role-based access
tile_events       — anonymized usage logs (tile_id only — COPPA safe)
parental_consents — COPPA consent records
subscriptions     — synced from RevenueCat webhooks
```

---

## Language Tiers

### Free forever — hardcoded, no paywall

| Code | Language | Azure voice | Notes |
|---|---|---|---|
| `en` | English | `en-US-JennyNeural` | Default |
| `th` | Thai | `th-TH-PremwadeeNeural` | Founder's family language |
| `es` | Spanish | `es-US-PalomaNeural` | 42M+ US speakers |
| `vi` | Vietnamese | `vi-VN-HoaiMyNeural` | Underserved in AAC |
| `tl` | Tagalog | `fil-PH-BlessicaNeural` | Large Filipino diaspora |
| `ht` | Haitian Creole | `fr-FR-DeniseNeural` ⚠️ placeholder | Zero existing AAC support — free forever |

### Pro tier
`zh-Hans` · `ar` (RTL) · `ko` · `pt-BR` · `fr` · `hi` · `am` · `so` · `ru` · `ja`

---

## Comment Conventions

```typescript
// WHY: explains a non-obvious decision — required on any tricky code
// TODO: known gap, non-blocking
// SHIELD: security review required before this ships
// ACCESS-TODO: accessibility issue — open GitHub issue before closing ticket
// COPPA: code touches children's data — extra care required
// NOT VERIFIED: claim made but not confirmed from repo
```

---

## Error Handling Rule

**This app is a communication tool. A crash means someone cannot speak.**

```typescript
try {
  await playTTSAudio(text, language)
} catch (error) {
  // WHY: audio failure must not block communication
  logError('TTS failed', { error, text, language })
  showTextFallback(text)
}
```

---

## Locked Invariants

- Free-tier languages locked forever: `en`, `th`, `es`, `vi`, `tl`, `ht`
- Haitian Creole is free day one. No paywall. Non-negotiable. See ADR-006.
- Pricing: Free · Pro $4.99/mo or $49/yr · School $12/seat/mo · Lifetime $149
- RevenueCat handles ALL billing. Clerk Billing is not used.
- Supabase is the only database. Firebase is not used. See ADR-002.
- RLS must be active on every Supabase table before any write.
- PostHog disabled for all `age_group = 'child'` sessions.
- Minimum touch target: 44×44pt. Non-negotiable.
- Minimum tile font: 18px (22px preferred). Non-negotiable.
- MIT license for core communication engine. See ADR-005.
- OBF/OBZ import and export must be supported. See ADR-007.
- TypeScript strict mode on. No `any` without `// WHY:` comment.
- `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never `EXPO_PUBLIC_` prefixed.
- No secrets in source files or committed to git.
- Nativewind v4 for all styling. No StyleSheet API.
- One ticket at a time. Do not advance without Ned's approval.

---

## What Agents Must NOT Do

- Do not claim a file, function, route, schema field, or component exists without verifying in the repo.
- Do not scan the full repo or read files outside the ticket's `## Files` section.
- Do not mark a ticket DONE without file path + line number + snippet proof.
- Do not add npm packages without checking for CVEs and license compatibility.
- Do not remove or weaken RLS policies on any table.
- Do not store children's PII without the parental consent flow fully in place.
- Do not use machine translation for vocabulary content.
- Do not hardcode any API key, token, password, or service role key in source files.
- Do not expose `AZURE_TTS_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Do not start a new ticket before the current one passes all three checks and Ned approves.
- Do not re-argue decisions already logged in `DECISIONS.md`.
- Do not make product, architecture, or roadmap decisions unilaterally.
- Do not guess around a blocker — document it in ## Current Blockers and stop.

---

## Contact / Decision Authority

All architectural, product, and roadmap decisions are made by **Ned (founder)**.
When uncertain about a direction, surface options clearly and wait for his decision.
Do not proceed unilaterally on anything outside the explicit scope of the current ticket.
