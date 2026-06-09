# DECISIONS.md — AceTalks
### Architectural Decision Records (ADRs)
### These are settled. Do not re-argue them. Add new decisions at the bottom.

---

## How to read this file

Each decision has:
- **Status:** settled | superseded | revisit-in-phase-X
- **Decision:** what was chosen
- **Why:** the reason — context that would be lost if not written down
- **What was rejected:** so agents don't suggest it again

---

## ADR-001 · Expo over bare React Native

**Status:** settled
**Decision:** Use Expo (managed workflow) + EAS Build, not bare React Native.
**Why:** Single codebase for iOS, Android, and web. EAS Build handles iOS compilation
without needing a Mac. OTA updates via EAS Update. Nadia is a solo beginner-level
developer — the managed workflow removes DevOps friction.
**Rejected:** Bare React Native (more control, but more setup and maintenance burden).
**Rejected:** Flutter (different language, smaller community, no Clerk/RevenueCat native fit).

---

## ADR-002 · Supabase over Firebase

**Status:** settled
**Decision:** Supabase (PostgreSQL) for all database, real-time, and file storage needs.
**Why:** Open source — self-hostable if needed. PostgreSQL is standard SQL with full
relational support (foreign keys, RLS). GDPR-friendlier than Firebase. Supabase Realtime
is exactly what board sync needs. One platform for DB + storage + auth fallback.
**Rejected:** Firebase (Google-owned, NoSQL, harder GDPR story, vendor lock-in).
**Rejected:** PlanetScale (MySQL, no free tier as of 2024, no built-in storage or realtime).

---

## ADR-003 · Clerk for auth, RevenueCat for billing (split)

**Status:** settled
**Decision:** Clerk handles all authentication (iOS, Android, web). RevenueCat handles
all billing (App Store IAP, Google Play IAP, web subscriptions).
**Why:** Clerk Billing is a Stripe wrapper — web only, cannot handle App Store or Play Store
in-app purchases. RevenueCat is purpose-built for cross-platform IAP and supports web billing
as well, creating a single subscription dashboard. They integrate cleanly via Clerk user ID.
**Rejected:** Clerk for billing (doesn't handle mobile IAP).
**Rejected:** Stripe alone (doesn't handle App Store/Play Store purchases).

---

## ADR-004 · Azure Neural TTS over alternatives

**Status:** settled
**Decision:** Azure Cognitive Services Neural TTS as the primary TTS provider.
**Why:** 400+ neural voices, 140+ languages including all 6 free-tier languages (Thai,
Haitian Creole, Vietnamese, Tagalog are all available). Neural voices sound natural, not
robotic — robot voices are the #1 documented complaint about existing AAC apps. Azure's
pricing is competitive at scale. TTS audio is cached in Cloudflare R2 to reduce costs.
**Rejected:** Google TTS (fewer languages, less natural voices for Southeast Asian languages).
**Rejected:** ElevenLabs (higher quality but expensive at scale, limited language coverage).
**Rejected:** Device-native TTS (sounds like Siri — a documented stigma issue for AAC users).

---

## ADR-005 · MIT license for core, proprietary for hosted layer (Open Core)

**Status:** settled
**Decision:** The communication board engine (tile grid, sentence building, OBF format,
TTS playback) is MIT-licensed and open source. The hosted cloud backend, billing integration,
collaborative features, and analytics dashboard are proprietary.
**Why:** MIT is non-viral — schools, therapists, and developers can freely use and embed
the engine without being forced to open-source their own work. GPL would be viral and
reduce adoption. The Open Core split is how HashiCorp, Metabase, and GitLab operate.
**Rejected:** GPL (viral — forces all derivative work to be open source, reduces adoption).
**Rejected:** fully proprietary (contradicts the mission of accessibility and community trust).
**Rejected:** AGPL (network use clause adds compliance friction for SaaS operators).

---

## ADR-006 · Haitian Creole in the free tier

**Status:** settled — this is a values decision, not a business decision
**Decision:** Haitian Creole (`ht`) ships free on day one, forever.
**Why:** As of 2026, there are zero AAC apps on any platform that support Haitian Creole.
AAC specialists report receiving frequent requests for it. This community is underserved,
lower-income, and has specific medical/disability needs. The cost of Azure TTS for Haitian
Creole is marginal. This decision is about the mission.
**Rejected:** Putting Haitian Creole in the paid tier.

---

## ADR-007 · Open Board Format (OBF/OBZ) for board storage

**Status:** settled
**Decision:** Communication boards are stored internally in OBF-compatible JSON (in Supabase
`boards.obf_json`) and export/import as `.obz` (zipped OBF) files.
**Why:** OBF is the industry standard for AAC board portability. Supporting it means users
can import boards from Proloquo2Go, CoughDrop, and other apps — no cold start. It also
signals community trust: "we will never hold your child's voice hostage."
**Rejected:** Proprietary board format (would lock users in, contradict the mission).

---

## ADR-008 · CodeRabbit over Codex as second agent

**Status:** settled
**Decision:** The two-agent setup is Claude Code (write) + CodeRabbit (review). No Codex.
**Why:** Codex duplicates Claude Code's role. CodeRabbit is complementary — it reviews
PRs after Claude Code commits, giving an independent second opinion. CodeRabbit now runs
on Claude Opus as its primary review model and is in the Claude Marketplace. One code
writer + one code reviewer is cleaner than two code writers.
**Rejected:** Codex (role duplication, conflicting recommendations).

---

## ADR-009 · PostHog disabled for child profiles

**Status:** settled
**Decision:** PostHog analytics events are disabled for any session where the active
communicator profile has `age_group = 'child'` (ages 2-12).
**Why:** COPPA prohibits behavioral tracking of children under 13 without verifiable
parental consent. Apple's Kids Category rules also prohibit third-party analytics SDKs
in child-facing screens. The parent dashboard (adult session) can use PostHog normally.
**Rejected:** Anonymized child analytics (too legally risky for MVP, not worth it).

---

## ADR-010 · Nativewind over StyleSheet API

**Status:** settled
**Decision:** Use Nativewind (Tailwind for React Native) for all styling.
**Why:** Consistent design tokens, faster iteration, works with Expo, easier to maintain
design system consistency. Tailwind classes are familiar if design is done in web tools.
**Rejected:** React Native StyleSheet API (verbose, no design tokens, harder to maintain).
**Rejected:** styled-components (adds bundle size, React Native support is secondary).

---

## ADR-011 · Data classification — vocabulary and media as PHI

**Status:** settled
**Decision:** Any user-created vocabulary (tile labels, custom phrases) and any uploaded media (symbol images, voice recordings) is classified as Protected Health Information (PHI) and must never be sent to external analytics or third-party services.
**Why:** AAC vocabulary reveals the communicator's medical conditions, therapy goals, and communication needs. A tile labeled "pain", "seizure", or "I need help" is diagnostic in nature. Sending this to PostHog, Sentry, or any external service would constitute an unauthorized disclosure of health information. Sentry crash reports must strip breadcrumbs that include tile labels. PostHog events must never include tile text.
**In code:** `tile_events` stores only `tile_id` (UUID) — no raw label text. TTS cache keys use SHA-256 hashes of the text — the original phrase is not stored in R2 key names. PostHog event properties must not include any `label`, `text`, or `word` fields.
**Rejected:** Sending anonymized tile text to analytics (still linkable to health conditions via co-occurrence).
**Rejected:** Logging tile labels in Sentry breadcrumbs (crashes could expose PHI in error reports).

---

## ADR-012 · Upstash Redis for persistent rate limiting

**Status:** settled
**Decision:** Use Upstash Redis (serverless, HTTP-based) for rate limiting the TTS API endpoint, replacing the in-memory Map.
**Why:** Railway containers restart and sleep on the free tier. An in-memory rate limiter resets on every restart, allowing quota abuse by triggering restarts. Upstash Redis persists across restarts, has a free tier sufficient for MVP, and works with Hono via the `@upstash/ratelimit` SDK without a persistent TCP connection (HTTP-based, works in Edge/serverless contexts too).
**Rejected:** Redis via Upstash TCP (requires persistent connection — more complex for Railway).
**Rejected:** Keeping in-memory map (resets on restart — not a real rate limit).

---

## How to add a new decision

Copy this template and append at the bottom:

```
## ADR-XXX · [Short title]

**Status:** settled | revisit-in-phase-X
**Decision:** [One sentence: what was chosen]
**Why:** [Context and reasoning — write this as if explaining to someone who wasn't there]
**Rejected:** [What alternatives were considered and why they lost]
```

Do not delete old decisions. Mark them `superseded` and add a reference to the new ADR.
