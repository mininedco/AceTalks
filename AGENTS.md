# AGENTS.md — AceTalks
### Master context file — read by ALL AI agents, tools, and assistants.
### Last updated: 2026 | Maintained by: Nadia (founder)

> This is the single source of truth for every AI agent working on this project.
> If this file conflicts with anything else, this file wins.
> Keep it short. Keep it accurate. Update it when decisions change.

---

## Project in one paragraph

AceTalks is an open-source, multilingual AAC (Augmentative and Alternative Communication)
app. It gives non-verbal and minimally verbal people of all ages a voice through
symbol-based communication boards with natural-sounding text-to-speech in their language.
The app is dedicated to Ace — the founder's autistic nephew — and built for every person
who has more to say than the world has learned to hear. Core differentiator: the first
AAC app with real multilingual support including Haitian Creole, code-switching, and an
accessible UI that doesn't look like it was built in 2012.

**Tagline:** Every voice, every language.
**License:** Open Core — MIT for the communication engine, proprietary for the hosted layer.
**Status:** Pre-launch, Phase 0 (MVP) development.

---

## Non-negotiable constraints

Read these before doing anything else.

1. **Children's data is sacred.** This app is used by non-verbal children. Any code touching
   a child's data must comply with COPPA. No PII. No analytics. Parental consent required.
   When in doubt: do less, not more.

2. **Accessibility is not optional.** Minimum touch target: 44×44pt. Minimum tile font: 18px.
   WCAG 2.1 AA contrast. `accessibilityLabel` on every interactive element. If it doesn't
   work with a screen reader, it doesn't ship.

3. **No secrets in code.** No API keys, tokens, passwords, or service role keys in source
   files. All secrets in `.env`. `.env` is in `.gitignore`. Always.

4. **RLS on every table.** Every Supabase table must have Row-Level Security enabled before
   any data is written to it. No exceptions.

5. **One ticket at a time.** Do not start the next ticket until the current one passes all
   three checks (build, security, accessibility).

---

## Canonical tech stack

Do not suggest replacing these without a DECISIONS.md entry first.

| Layer | Tool | Notes |
|---|---|---|
| Framework | Expo + React Native | Cross-platform iOS/Android/Web |
| Styling | Nativewind (Tailwind for RN) | |
| Navigation | Expo Router | File-based routing |
| Auth | Clerk | Web + mobile, unified |
| Billing | RevenueCat | App Store + Play Store + Web |
| Database | Supabase (PostgreSQL) | RLS required on all tables |
| Real-time | Supabase Realtime | Board sync across devices |
| File storage | Supabase Storage + Cloudflare R2 | Images + TTS audio cache |
| Backend | Node.js + Hono on Railway | |
| TTS | Azure Neural TTS | 140+ languages, neural voices |
| Analytics | PostHog | Disabled for child profiles |
| Errors | Sentry | Crash reporting |
| Build/Deploy | EAS (mobile) + Vercel (web) | |
| Code review | CodeRabbit | Integrated with GitHub |
| Board format | Open Board Format (OBF/OBZ) | Import/export standard |
| Language | TypeScript | No plain JS files |

---

## File structure

```
acetalks/
├── AGENTS.md              ← you are here (all agents read this)
├── CLAUDE.md              ← Claude Code specific (personas, agentic rules)
├── DECISIONS.md           ← settled decisions (do not re-argue these)
├── SECURITY.md            ← security policies and COPPA checklist
├── .env.example           ← all required env vars with descriptions
├── .coderabbit.yaml       ← CodeRabbit config
├── .github/
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       └── feature_ticket.md
├── app/                   ← Expo Router screens
│   ├── (auth)/
│   ├── (onboarding)/
│   └── (tabs)/
├── components/
│   ├── board/             ← Tile, TileGrid, SentenceStrip
│   ├── ui/                ← shared design system components
│   └── layout/
├── hooks/                 ← custom React hooks
├── lib/
│   ├── supabase.ts        ← client-safe Supabase client only
│   ├── azure-tts.ts
│   └── obf.ts             ← OBF import/export
├── store/                 ← global state (Zustand or Context)
├── types/                 ← TypeScript interfaces and enums
├── constants/
│   └── languages.ts       ← language list, codes, Azure voice IDs
└── server/                ← Node.js API (separate from Expo client)
    ├── routes/
    └── middleware/
```

---

## Data model — canonical tables

These are the authoritative table definitions. Check DECISIONS.md for any changes.

```
communicators     — the person using the AAC device (owned by a parent/caregiver)
boards            — OBF-compatible communication boards
tiles             — individual communication buttons within a board
supervisors       — parents, SLPs, teachers who manage a communicator
tile_events       — anonymized usage logs (tile ID only, no raw text)
parental_consents — COPPA consent records with timestamp + version
subscriptions     — synced from RevenueCat via webhook
```

Full schema with RLS policies: see `CLAUDE.md` → Database schema section.

---

## Language tiers

### Free forever (hardcoded in app — no paywall)
`en` English · `th` Thai · `es` Spanish · `vi` Vietnamese · `tl` Tagalog · `ht` Haitian Creole

**Why Haitian Creole is free:** As of 2026, there are zero AAC apps on any platform that
support Haitian Creole. It ships free on day one. This is non-negotiable.

### Pro tier (paid, add progressively)
`zh-Hans` Mandarin · `ar` Arabic · `ko` Korean · `pt-BR` Portuguese · `fr` French ·
`hi` Hindi · `am` Amharic · `so` Somali · `ru` Russian · `ja` Japanese

### Implementation rule
All tile labels are stored as multilingual JSON: `{"en": "Water", "es": "Agua", "th": "น้ำ"}`
Arabic requires `writingDirection: 'rtl'` and layout flip. Never use machine translation
for vocabulary — use community translators.

---

## Naming conventions

```typescript
Components          PascalCase          TileGrid, SentenceStrip
Hooks               camelCase + use     useBoardSync, useLanguage
Constants           SCREAMING_SNAKE     MAX_TILE_COLUMNS, FREE_LANGUAGES
Database columns    snake_case          communicator_id, is_home
TypeScript types    PascalCase          CommunicatorProfile, TileData
Files               kebab-case          tile-grid.tsx, azure-tts.ts
Environment vars    SCREAMING_SNAKE     SUPABASE_URL, AZURE_TTS_KEY
```

---

## Comment conventions

```typescript
// WHY: explains a non-obvious decision
// TODO: known gap, non-blocking
// SHIELD: security review required before shipping
// ACCESS-TODO: accessibility issue, must open GitHub issue
// COPPA: touches children's data — extra care required
```

---

## Error handling rule

This app is a communication tool. A crash means someone cannot speak.
All async operations must have explicit error handling with graceful fallback.
Never let a TTS failure crash the board. Show text if audio fails.

```typescript
try {
  await playTTSAudio(text, language)
} catch (error) {
  logError('TTS failed', { error, text, language })
  showTextFallback(text) // user can still communicate
}
```

---

## What agents must NOT do

- Do not add npm packages without checking for security/license issues first
- Do not remove or weaken RLS policies
- Do not store children's PII without the parental consent flow in place
- Do not use machine translation for vocabulary content
- Do not generate or suggest dark patterns in the billing/paywall flow
- Do not skip accessibility props on any interactive component
- Do not hardcode any API key, token, or secret
- Do not start a new ticket before the current one passes all checks
- Do not re-argue decisions that are already logged in DECISIONS.md

---

## Current development phase

**Phase 0 — MVP** (active)
Target: working iOS + Android + web app with 6 free languages, basic board navigation,
TTS, sentence building, and cloud sync. No school/clinic features yet.

See `CLAUDE.md` → Phase 0 ticket list for the full ACET-001 through ACET-020 breakdown.

---

## Contact / decision authority

All architectural decisions are made by Nadia (founder).
When an agent is uncertain about a direction, surface options and wait.
Do not make product decisions unilaterally.
