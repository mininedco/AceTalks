# AceTalks

AceTalks is an open-source, multilingual AAC (Augmentative and Alternative Communication) app. Every voice, every language.

- **Mobile/Web:** Expo (React Native) + Expo Router in `acetalks/`
- **Styling:** Nativewind v4 (Tailwind for React Native)
- **Auth:** Clerk (iOS + Android + Web)
- **Billing:** RevenueCat (App Store + Play Store + Web)
- **Database:** PostgreSQL via Supabase (RLS enforced on all tables)
- **Real-time:** Supabase Realtime (board sync across devices)
- **TTS:** Azure Cognitive Services Neural TTS (140+ languages, neural voices)
- **Storage:** Supabase Storage + Cloudflare R2 (TTS audio cache)
- **Backend:** Node.js + Hono on Railway
- **Build/Deploy:** EAS (mobile) + Vercel (web)
- **Node.js:** 22 LTS (pinned via `.node-version`; managed with fnm)
- **Package manager:** npm

For live task tracking, read:

- `AGENTS.md` — top-level truth and agent protocol (all agents read this first)
- `CLAUDE.md` — Claude Code specific personas, agentic rules, and ticket definitions
- `DECISIONS.md` — settled architectural decisions (do not re-argue these)
- `TASKS.md` — executable ticket source and completion status

---

## Current State

| Ticket | Status | Notes |
|---|---|---|
| ACET-001 | ✅ DONE | Scaffold — Expo SDK 56, Nativewind v4, all folder structure |
| ACET-002 | ✅ DONE | Supabase clients + SQL schema — run `supabase/schema.sql` + `supabase/seed.sql` in dashboard |
| ACET-003 | ✅ DONE | Clerk auth — sign-in, sign-up, ClerkProvider, useSupabaseWithAuth |
| ACET-004 | ✅ DONE | Onboarding — welcome, language, who-for, COPPA gate stub |
| ACET-SEC-001 | ✅ DONE | Security: migrated `@clerk/clerk-expo@2.x` → `@clerk/expo@3.x` (CVE: entire 2.x range) |
| ACET-SEC-002 | ⛔ BLOCKED | Security: `uuid@8.3.2` transitive CVE — no fix available until upstream deps update |
| ACET-005 | ✅ DONE | Home board screen — tile grid, language toggle, skeleton loading, empty state |
| ACET-006 | ✅ DONE | Tile component — 80/96pt touch targets, press animation, accessibility full set |
| ACET-007 | ✅ DONE | TTS — Azure Neural + Cloudflare R2 caching, server-side key, graceful fallback |
| ACET-008 | ✅ DONE | Sentence strip — removable word pills, speak + clear, sentenceStore |
| ACET-009 | ✅ DONE | Board navigation — boardStore stack, back/home buttons, link-tile routing |
| ACET-010 | 🚀 OPEN | Supabase real-time sync — board changes propagate across devices live |
| ACET-011–020 | OPEN | See TASKS.md |

**Active Claude Code ticket:** ACET-010 — Supabase real-time sync.

**⚠️ Manual step required:** Run `supabase/rls-fix.sql` in the Supabase SQL editor. The app cannot query boards or tiles until the RLS circular dependency is resolved.
**Dedicated to:** Ace 🌟

### Dev server
```powershell
cd acetalks
npm run web       # web — works today, no native build needed
npm start         # Expo CLI (physical device requires EAS dev build — see ACET-015)
```

### Physical device note
`@sentry/react-native` and `posthog-react-native` use native modules that cannot run in standard Expo Go. A custom dev build is required:
```powershell
eas login         # one-time: link your Expo account
eas init          # one-time: writes projectId to app.json
eas build --profile development --platform ios    # or android
```

---

## Quick Start

### Prerequisites

Install [fnm](https://github.com/Schniz/fnm) and Node 22 LTS:

```powershell
winget install Schniz.fnm
# open a new terminal, then:
fnm install 22
fnm default 22
```

Install EAS CLI globally:

```powershell
npm install -g eas-cli
```

**Do not use standard Expo Go** — the project uses native modules (`@sentry/react-native`, `posthog-react-native`) that are not bundled in Expo Go. Use the web dev server or an EAS dev build.

### Web dev server

```powershell
cd acetalks
npm install
npm run web
```

### EAS dev build (physical device — one-time setup)

```powershell
eas login
eas init          # links Expo account, writes projectId to app.json
eas build --profile development --platform ios    # or android
# Install the resulting .ipa/.apk on your device, then:
npm start         # metro serves to the dev build
```

### Environment setup

Copy `.env.example` to `.env` and fill in your keys before running:

```powershell
cp .env.example .env
```

Minimum keys required to boot: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

TTS will not work until `AZURE_TTS_KEY` and `AZURE_TTS_REGION` are set (server-side only).

### Type check

```powershell
npx tsc --noEmit
```

Must pass with zero errors before any PR merges.

---

## TTS + Language Setup

Neural text-to-speech requires an Azure Cognitive Services key. Free tier includes 500,000 characters/month — sufficient for MVP testing.

**Azure (required for TTS):**

```env
AZURE_TTS_KEY=...          # server-side only — never expose to client
AZURE_TTS_REGION=eastus    # or your chosen region
```

Get from: [Azure Portal](https://portal.azure.com) → Cognitive Services → Keys and Endpoint.

Free-tier languages ship at launch: English, Thai, Spanish, Vietnamese, Tagalog, Haitian Creole.
Note: Azure does not have a dedicated Haitian Creole neural voice. French Caribbean approximation
is used as a placeholder — community feedback needed before launch (see ACET-007).

**TTS audio caching (Cloudflare R2 — Phase 0):**
Pre-generated TTS audio is cached in R2 to avoid re-calling Azure on every tap.
See `.env.example` for the full R2 variable list.

---

## Locked Invariants

These cannot be changed without a new entry in `DECISIONS.md` and explicit founder approval.

- Free-tier languages are locked forever: `en`, `th`, `es`, `vi`, `tl`, `ht`.
- Haitian Creole (`ht`) is free on day one. No paywall. Not negotiable. See DECISIONS.md ADR-006.
- Pricing: Free core · Pro $4.99/mo or $49/yr · School $12/seat/mo · Lifetime $149 one-time.
- RevenueCat handles ALL billing — web, App Store, Play Store unified. Clerk Billing is not used.
- Supabase is the only database. Firebase is not used. See DECISIONS.md ADR-002.
- RLS must be enabled on every Supabase table before any data is written to it.
- PostHog analytics are disabled for all sessions where the active communicator is `age_group = 'child'`. COPPA requirement. See DECISIONS.md ADR-009.
- Minimum touch target on every interactive element: **44×44pt**. ADA requirement.
- Minimum font size on communication tiles: **18px** (22px preferred).
- MIT license for the core communication engine. Proprietary hosted layer. See DECISIONS.md ADR-005.
- Open Board Format (OBF/OBZ) must be supported for import and export. See DECISIONS.md ADR-007.
- TypeScript strict mode is on. No `any` without a `// WHY:` comment.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only. Never in client code. Never prefixed `EXPO_PUBLIC_`.
- No secrets in source files. No secrets committed to git.
- Nativewind v4 for all styling. No StyleSheet API or styled-components.
- Expo managed workflow + EAS Build. No bare React Native workflow for Phase 0.

---

## Security Policy

**Classification:** HIGH — children's communication data
**Compliance targets:** COPPA · ADA / Section 508 · WCAG 2.1 AA · App Store Kids Guidelines

Claude Code acts as Shield (Security & Compliance Engineer) and must:

- Prioritize security over convenience
- Prioritize data protection over feature speed
- Apply deny-by-default patterns
- Refuse unsafe implementation, explain the risk, propose a secure alternative

**Claude Code MUST ALWAYS:**
- Treat all user input as hostile — validate and sanitize server-side
- Verify resource ownership on every authenticated DB query
- Use parameterized Supabase queries — no raw string interpolation
- Enable RLS before writing any data to a new table
- Apply COPPA rules whenever `age_group = 'child'` is in scope
- Gate parental consent before saving any child data
- Disable analytics events for child profiles
- Check WCAG 2.1 AA contrast and 44pt touch targets on every UI component
- Add `accessibilityLabel` to every interactive element
- Handle TTS failures gracefully — never crash, always show text fallback
- Log security-relevant events (auth failures, permission errors, rate limit hits)
- Run `npm audit` after dependency changes

**Claude Code MUST NEVER:**
- Store any PII on a child without a parental consent record
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the client or in `EXPO_PUBLIC_` vars
- Hardcode API keys, tokens, or secrets in source files
- Remove or weaken RLS policies on any table
- Skip `accessibilityLabel` on interactive elements
- Trust client-side data without server-side validation
- Add analytics tracking to child-facing board screens
- Enable wildcard CORS (`*`) on API routes
- Return internal stack traces or database errors to clients
- Commit `.env` or any secret file to git
- Make a product or architecture decision without surfacing it to Nadia first

**COPPA-specific rules:**
- Parent/caregiver creates the account. Children do not have accounts.
- Parental consent must be recorded in `parental_consents` table (timestamp + version) before any child communicator data is saved.
- No behavioral analytics, third-party SDKs, or external links in child-facing board screens.
- Provide a clear data deletion mechanism for parents accessible from settings.
- Privacy policy must be written at a 6th-grade reading level.

**SHIELD escalation trigger:**
Any of these words in task context → stop and surface to Nadia before continuing:
`child`, `minor`, `age`, `birthday`, `school`, `IEP`, `therapy`, `diagnosis`, `medical`,
`payment`, `billing`, `subscription`, `token`, `session`, `password`, `consent`

**Security review is a release blocker.** A ticket is NOT complete unless:
- Auth is verified (if applicable)
- RLS is verified (if new table)
- No secrets exposed
- Accessibility check passed
- No COPPA violations introduced

---

## Workspace Rules

- Run `npm install` from repo root only.
- Do not run `npx expo eject` or convert to bare workflow without explicit approval.
- Do not add new npm packages without checking maintenance status, CVEs, and weekly downloads.
- `EXPO_PUBLIC_` prefix = safe for client bundle. All other secrets = server-side only.
- All Supabase tables need RLS before use — no exceptions.
- Context files read order: `AGENTS.md` → `CLAUDE.md` → `DECISIONS.md` → `TASKS.md`.
- One ticket at a time. Do not advance until current ticket passes all checks.
- Claude Code stops and asks before starting the next ticket.

---

## Accessibility Pattern

All interactive components must follow this minimum pattern:

```tsx
// Every tile and button in AceTalks must have this minimum setup
<TouchableOpacity
  accessible={true}
  accessibilityLabel={label}           // read aloud by screen reader
  accessibilityHint="Double tap to speak"
  accessibilityRole="button"
  style={{ minWidth: 44, minHeight: 44 }}  // ADA minimum touch target
  onPressIn={playAudio}                // audio on touch-down (not touch-up)
  onPress={addToSentence}
>
```

TTS failures must fall back gracefully:

```typescript
try {
  await playTTSAudio(text, language)
} catch (error) {
  logError('TTS failed', { error, text, language })
  showTextFallback(text)  // user can still communicate — never crash
}
```

---

## Board Format

Communication boards are stored as OBF-compatible JSON in Supabase (`boards.obf_json`)
and export/import as `.obz` files (zipped OBF). See `lib/obf.ts`.

OBF is the open standard at [openboardformat.org](https://www.openboardformat.org).
Supporting it means boards from Proloquo2Go, CoughDrop, and Cboard can be imported directly.
