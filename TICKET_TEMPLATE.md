# AceTalks — Ticket Template
### Drop this format into TASKS.md for every OPEN ticket.
### The `## Files` section is the agent's scope boundary — reads outside it are not allowed.

---

## TICKET TEMPLATE

```markdown
## ACET-XXX — [Short description] — PX [OPEN | DONE ✓]

**Persona:** Stack | Shield | Access
**Phase:** 0 | 1 | 2

**What:** One sentence description of what this ticket does.

**Why:** One sentence connecting this to a user need.

## Files
<!-- Agent reads/writes ONLY these files. No other file reads allowed. -->
<!-- Format: path/to/file.ext  ← create | read | edit | read only -->
- app/(tabs)/index.tsx           ← edit
- components/board/Tile.tsx      ← read only
- types/index.ts                 ← read only

## Acceptance criteria
- [ ] Specific, testable thing that must be true
- [ ] Another specific testable thing
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] ACCESS: all touch targets ≥ 44pt, accessibilityLabel on all interactive elements
- [ ] SHIELD: no secrets in code, RLS verified (if new table)

## Proof of completion
<!-- Populated by agent when marking DONE. File + line number + snippet required. -->
<!-- A file path alone is not proof. A line number without a snippet is not proof. -->
- [ ] path/to/file.tsx:LINE — `exact code snippet here`
- [ ] path/to/other.ts:LINE — `exact code snippet here`
- [ ] npx tsc --noEmit — 0 errors

## Constraints
<!-- What this ticket must NOT do. Be explicit. -->
- Do not touch [file] — out of scope
- Do not add new dependencies without checking CVEs

## Notes
<!-- Optional: implementation hints, known tricky parts, decisions pre-made -->
```

---

## ACET-011 — RevenueCat billing — P2 OPEN
### (Example of template applied to active ticket)

**Persona:** Stack (Shield reviews payment flow after)
**Phase:** 0

**What:** Wire up RevenueCat for free vs pro entitlement checks, add a paywall screen shown when a pro feature is tapped.

**Why:** AceTalks needs sustainable revenue to keep free-tier languages free forever.

## Files
- app/(tabs)/settings.tsx          ← edit (add upgrade CTA)
- components/ui/PaywallModal.tsx   ← create
- hooks/useEntitlement.ts          ← create
- lib/revenuecat.ts                ← create
- types/index.ts                   ← read only (Entitlement type)
- constants/languages.ts           ← read only (pro language list)

## Acceptance criteria
- [ ] `useEntitlement()` hook returns `'free' | 'pro' | 'org'` from RevenueCat
- [ ] Pro languages are locked behind entitlement check — free tier always accessible
- [ ] Paywall modal appears when a locked feature is tapped
- [ ] RevenueCat `REVENUE_CAT_API_KEY` is in `.env`, never hardcoded
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] ACCESS: paywall modal meets 44pt touch targets, has accessibilityLabel on all buttons
- [ ] SHIELD: no payment data stored locally; RevenueCat is source of truth

## Proof of completion
- [ ] hooks/useEntitlement.ts:1 — `export function useEntitlement(`
- [ ] components/ui/PaywallModal.tsx:1 — `export function PaywallModal(`
- [ ] lib/revenuecat.ts:1 — `import Purchases from`
- [ ] npx tsc --noEmit — 0 errors

## Constraints
- Do not touch `supabase/schema.sql` — subscriptions table already exists
- Do not implement server-side subscription logic in this ticket — that's ACET-012
- RevenueCat is the billing source of truth — do not duplicate subscription state in Supabase

## Notes
- RevenueCat SDK: `react-native-purchases` — check CVEs before installing
- Entitlement IDs in RevenueCat dashboard must match what `useEntitlement` checks
- ⛔ SHIELD: after Stack finishes, Shield reviews the payment flow before DONE is marked

---

## How to Apply This Template to All Open Tickets

For each OPEN ticket in TASKS.md, add:

1. **`## Files` section** — list only the files the ticket actually needs to touch.
   Look at the acceptance criteria and implementation notes to determine the minimum set.
   Default to 3–6 files. If a ticket needs more than 10, it should be split.

2. **`## Proof of completion` section** — leave checkboxes empty when the ticket is OPEN.
   The agent populates this when marking DONE, with actual line numbers from the repo.

3. **`## Constraints` section** — explicitly state what the ticket must NOT do.
   This prevents scope creep more effectively than any general rule.

### Priority order for retrofitting open tickets

1. ACET-011 (active) — done above
2. ACET-023 (P0 security — COPPA hard gate)
3. ACET-018 (P1 — privacy policy + parental consent)
4. ACET-019 (P1 — accessibility audit)
5. ACET-012 (P2 — parent dashboard)
6. All remaining ACET-013–020, 024–030
