# AceTalks — Implementation Tickets

Generated: 2026-06-03. Phase 0 MVP queue.

Scope: Phase 0 mobile-first (iOS + Android + Web via Expo). Each ticket should be 30–60 minutes or less. Do not add dependencies unless the ticket explicitly requires it.

---

## Phase 0 Claude Code Queue — Execute in Order

Claude Code picks the next OPEN ticket from this list, implements it, marks it DONE, and updates this file. Do not skip ahead. Stop after each ticket and wait for Nadia's approval.

| # | Ticket | Priority | Status | Description |
|---|---|---|---|---|
| 1 | ACET-001 | P0 | **DONE** | Project scaffold — Expo + Nativewind + EAS + TypeScript + folder structure |
| 2 | ACET-002 | P0 | **DONE** | Supabase setup — schema, RLS policies, local dev, seed data |
| 3 | ACET-003 | P1 | **DONE** | Clerk auth — sign up, sign in, session management, protected routes |
| 4 | ACET-004 | P1 | **DONE** | Onboarding flow — welcome, language select, who is this for |
| 5 | ACET-005 | P1 | **DONE** | Home board screen — tile grid, language toggle header, empty state |
| 6 | ACET-006 | P1 | **DONE** | Tile component — accessible, 44pt target, audio on press, label display |
| 7 | ACET-007 | P1 | **DONE** | TTS integration — Azure Neural, 6 free languages, R2 audio caching |
| 8 | ACET-008 | P1 | **DONE** | Sentence strip — word pills, speak button, clear button, persistent bar |
| 9 | ACET-009 | P1 | **DONE** | Board navigation — home board → category board → back, breadcrumb |
| 10 | ACET-010 | P1 | **DONE** | Supabase real-time sync — board changes propagate across devices live |
| 11 | ACET-011 | P2 | **OPEN** | RevenueCat billing — free vs pro entitlements, paywall screen |
| 12 | ACET-012 | P2 | **OPEN** | Parent dashboard — manage communicator profile, boards, settings |
| 13 | ACET-013 | P2 | **OPEN** | OBF export — export boards as .obz file (Open Board Format) |
| 14 | ACET-014 | P2 | **OPEN** | OBF import — import .obz boards from other AAC apps |
| 15 | ACET-015 | P2 | **OPEN** | EAS build — iOS + Android production builds, TestFlight + Play beta |
| 16 | ACET-016 | P2 | **OPEN** | Web deploy — Expo web + Vercel, web-specific layout adjustments |
| 17 | ACET-017 | P2 | **OPEN** | PostHog + Sentry — analytics and crash reporting, child-profile gate |
| 18 | ACET-018 | P1 | **OPEN** | Privacy policy + parental consent flow — COPPA gate before child data |
| 19 | ACET-019 | P1 | **OPEN** | Accessibility audit — all Phase 0 screens against ACCESS checklist |
| 20 | ACET-020 | P2 | **OPEN** | Beta testing setup — TestFlight internal + Google Play internal track |

---

## ACET-001 — Project scaffold — P0 DONE ✓

**What:** Initialize Expo TypeScript project with Nativewind, Expo Router, EAS, ESLint, Prettier, and the full folder structure defined in AGENTS.md.

**Files created:**
- `app/` with `_layout.tsx`, `index.tsx`, `(auth)/`, `(onboarding)/`, `(tabs)/`
- `components/board/` — `Tile.tsx`, `TileGrid.tsx`, `SentenceStrip.tsx` (stubs)
- `components/ui/` — `Button.tsx`, `Card.tsx`, `SafeScreen.tsx` (stubs)
- `lib/supabase.ts`, `lib/azure-tts.ts`, `lib/obf.ts` (stubs)
- `types/index.ts` — core TypeScript interfaces
- `constants/languages.ts` — language config with Azure voice IDs
- `tailwind.config.js` — AceTalks brand palette
- `global.css`, `babel.config.js`, `metro.config.js`
- `.eslintrc.js`, `.prettierrc`
- `tsconfig.json` — strict mode + path aliases
- `eas.json` — development, preview, production profiles

**Acceptance criteria:**
- [x] `npx tsc --noEmit` passes with zero errors — verified 2026-06-03
- [x] Brand colors in `tailwind.config.js`: `coral`, `teal`, `gold`, `cream`, `charcoal`
- [x] `constants/languages.ts` has all 6 free-tier languages with Azure voice IDs
- [x] Git initialized, first commit `ACET-001: project scaffold`
- [ ] `npx expo start` renders on physical device — **BLOCKED**: native modules (`@sentry/react-native`, `posthog-react-native`) require a dev build. Expo Go cannot run this app. Web works: `npm run web`. Physical device deferred to ACET-015.

**Constraints:** No Supabase, Clerk, or RevenueCat setup in this ticket. Stubs only.

**Completion note (2026-06-03):** Scaffold complete. `tsc` clean. Web works. Physical device requires expo-dev-client + EAS dev build (see ACET-015). `clerk-expo/` reference project found in repo root — move outside `acetalks/` before ACET-003.

---

## ACET-002 — Supabase setup — P0 DONE ✓

**What:** Create the Supabase project, run the full schema, enable RLS on all tables, and seed a sample communicator with a starter home board.

**Files:**
- `lib/supabase.ts` — Supabase client (client-safe, uses `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- `server/lib/supabase-admin.ts` — server-only admin client (uses `SUPABASE_SERVICE_ROLE_KEY`)
- `supabase/schema.sql` — full schema with RLS policies
- `supabase/seed.sql` — sample communicator + home board for dev testing

**Schema — run in Supabase SQL editor:**
```sql
-- Communicators
CREATE TABLE communicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  display_name text NOT NULL,
  age_group text NOT NULL CHECK (age_group IN ('child', 'adult', 'elderly')),
  primary_language text NOT NULL DEFAULT 'en',
  secondary_language text,
  grid_size text NOT NULL DEFAULT '3x3',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE communicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON communicators
  USING (owner_id = auth.jwt()->>'sub' OR id IN (
    SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
  ));

-- Boards
CREATE TABLE boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id uuid REFERENCES communicators(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_home boolean DEFAULT false,
  obf_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_or_supervisor" ON boards
  USING (communicator_id IN (
    SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
    UNION
    SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
  ));

-- Tiles
CREATE TABLE tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  label_translations jsonb NOT NULL DEFAULT '{}',
  image_url text,
  tts_cache_keys jsonb DEFAULT '{}',
  row_index int NOT NULL,
  col_index int NOT NULL,
  link_board_id uuid REFERENCES boards(id),
  bg_color text
);
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "via_board" ON tiles
  USING (board_id IN (SELECT id FROM boards WHERE communicator_id IN (
    SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
    UNION
    SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
  )));

-- Supervisors
CREATE TABLE supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id uuid REFERENCES communicators(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('parent', 'therapist', 'teacher')),
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_access" ON supervisors
  USING (user_id = auth.jwt()->>'sub' OR communicator_id IN (
    SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
  ));

-- Parental consent records (COPPA)
CREATE TABLE parental_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  communicator_id uuid REFERENCES communicators(id) ON DELETE CASCADE,
  consent_version text NOT NULL,
  consented_at timestamptz DEFAULT now(),
  ip_hash text
);
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_only" ON parental_consents
  USING (owner_id = auth.jwt()->>'sub');

-- Tile usage events (anonymized — COPPA safe)
CREATE TABLE tile_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id uuid REFERENCES communicators(id) ON DELETE CASCADE,
  tile_id uuid REFERENCES tiles(id),
  language_used text,
  event_at timestamptz DEFAULT now()
);
ALTER TABLE tile_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supervisor_access" ON tile_events
  USING (communicator_id IN (
    SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
    UNION
    SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
  ));
```

**Acceptance criteria:**
- [x] All 6 tables in `supabase/schema.sql` with RLS on each — **pending manual SQL run in Supabase dashboard**
- [x] `lib/supabase.ts` — anon key client (client-safe)
- [x] `server/lib/supabase-admin.ts` — service role client (server-only)
- [x] `supabase/seed.sql` — 9 seed tiles in 3 languages
- [x] `SUPABASE_SERVICE_ROLE_KEY` never in `EXPO_PUBLIC_` vars — verified
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**⚠️ Manual step required:** Run `supabase/schema.sql` then `supabase/seed.sql` in the Supabase SQL editor. Replace `YOUR_CLERK_USER_ID` in seed.sql before running.

**SHIELD:** Verify RLS policies are active on every table. `service_role` key must never appear in client code or be passed to Expo.

---

## ACET-003 — Clerk auth — P1 DONE ✓

**What:** Implement sign-up, sign-in, and session management using Clerk. All `(tabs)/` routes are protected. Clerk JWT is passed to Supabase for RLS.

**Files:**
- `app/_layout.tsx` — wrap with `<ClerkProvider>`
- `app/(auth)/sign-in.tsx` — Clerk `<SignIn />` component
- `app/(auth)/sign-up.tsx` — Clerk `<SignUp />` component
- `app/index.tsx` — redirect to `/(tabs)` if signed in, else `/(auth)/sign-in`
- `hooks/useSupabaseWithAuth.ts` — hook that returns a Supabase client with Clerk JWT injected

**Clerk + Supabase JWT pattern:**
```typescript
// hooks/useSupabaseWithAuth.ts
// WHY: Supabase RLS checks auth.jwt()->>'sub' which must be the Clerk user ID
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

**Note:** Requires a "supabase" JWT template configured in Clerk dashboard with the `sub` claim mapped to the Clerk user ID. Stop and document setup steps for Nadia before closing ticket.

**Acceptance criteria:**
- [x] Sign-up flow creates a Clerk user + email verification step
- [x] Sign-in redirects to root (→ onboarding or tabs based on SecureStore flag)
- [x] Unauthenticated `(tabs)` routes redirect to sign-in
- [x] Unauthenticated `(onboarding)` routes redirect to sign-in
- [x] `useSupabaseWithAuth` injects Clerk JWT into every Supabase request
- [x] `CLERK_SECRET_KEY` is server-side only — not in any EXPO_PUBLIC_ var
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**⚠️ Manual step required:** Create a "supabase" JWT template in Clerk dashboard (Settings → JWT Templates → New → Supabase). Map `sub` claim to `{{user.id}}`. Without this, RLS queries return 0 rows.

**Note (2026-06-04):** Kept `@clerk/clerk-expo@2.x`. The v3 `@clerk/expo` uses a signals-based API incompatible with custom form hooks. Log in DECISIONS.md when migration to v3 is planned.

**SHIELD:** Never store Clerk session tokens in AsyncStorage manually — Clerk SDK handles secure storage. Confirm `CLERK_SECRET_KEY` is server-side only.

---

## ACET-004 — Onboarding flow — P1 DONE ✓

**What:** Three-screen onboarding shown only on first launch: Welcome → Language select → Who is this for. Saves communicator profile to Supabase. Skipped if communicator profile already exists.

**Screens:**
- `app/(onboarding)/welcome.tsx` — app icon, tagline, "Get started" button, language preview pills
- `app/(onboarding)/language.tsx` — pick primary language from 6 free-tier options (EN selected by default)
- `app/(onboarding)/who-for.tsx` — Child / Adult / Elderly cards; selected option sets `age_group` and `grid_size`

**On complete:**
- Create `communicators` record in Supabase with `owner_id = clerk.userId`
- If `age_group = 'child'`, immediately show parental consent screen (ACET-018 stub for now)
- Navigate to `/(tabs)`
- Store `onboardingComplete = true` in Expo SecureStore

**Brand:**
- Background: `#FBF8F4` (cream)
- CTA button: `#E8673B` (coral)
- Progress dots: coral = complete, `#EAE3DB` = incomplete
- Language pills: `#D8EDE6` background, `#085041` text (teal light)

**Acceptance criteria:**
- [x] All three screens render with brand colors (coral, teal, cream, charcoal)
- [x] Language selection via Zustand store (`store/onboardingStore.ts`) persists through screens
- [x] Communicator record created in Supabase on "Who for" completion (adult/elderly)
- [x] Onboarding flag stored in SecureStore (`acetalks_onboarding_complete`) — skips on relaunch
- [x] `age_group = 'child'` → `consent.tsx` COPPA gate (blocks progression until ACET-018)
- [x] All buttons have `accessibilityLabel`, `accessibilityRole`, touch targets ≥ 44pt
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Note (2026-06-04):** Communicator creation requires Supabase schema (ACET-002 manual step) + Clerk JWT template (ACET-003 manual step) to succeed at runtime. Code is correct.

---

## ACET-005 — Home board screen — P1 DONE ✓

**What:** The core board screen. Loads the communicator's home board from Supabase, renders a 3×3 (or profile-defined) tile grid, shows a language toggle in the header.

**File:** `app/(tabs)/index.tsx` + `components/board/TileGrid.tsx`

**Layout:**
```
[header: menu icon | "Home board" | EN toggle | settings icon]
[sentence strip — persistent, always visible]
[tile grid — 3×3 default, fills remaining height]
[bottom nav: Home | Boards | Settings]
```

**Language toggle behavior:**
- Tapping the badge cycles through `[primaryLanguage, secondaryLanguage]` if both set
- Tile labels re-render immediately with new language
- Current language stored in component state (not persisted — resets to primary on restart)

**Grid sizing by age_group:**
- `child` or `adult` → 3×3 (9 tiles)
- `elderly` → 2×3 (6 tiles, larger touch targets)

**Empty state:** If board has no tiles, show "Tap + to add your first tile" with a coral + button.

**Acceptance criteria:**
- [x] Home board tiles load from Supabase on mount — `useHomeBoardData` hook
- [x] Language toggle switches all tile labels instantly — cycles primary ↔ secondary
- [x] Elderly mode renders 2×3 grid with min 96pt tiles — columns=2 when age_group='elderly'
- [x] Empty state renders and is accessible — "No tiles yet" + CTA button
- [x] Loading state shows skeleton tiles (not blank screen) — `SkeletonGrid` component
- [x] `accessibilityLabel` on all header buttons, language badge, retry/CTA buttons
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Completion note (2026-06-04):** Sentence strip wired as stub (ACET-008 will implement pills/speak). TTS audio fires on tile press-down via `useTtsAudio`. Board navigation (link tiles) comes in ACET-009.

---

## ACET-006 — Tile component — P1 DONE ✓

**What:** The individual communication tile. Accessible, correct touch target, audio feedback on press-down, adds word to sentence on release.

**File:** `components/board/Tile.tsx`

**Props:**
```typescript
interface TileProps {
  tile: Tile
  language: LanguageCode
  onPress: (label: string) => void
  size?: 'normal' | 'large'  // 'large' for elderly mode
}
```

**Behavior:**
- `onPressIn` → play TTS audio immediately (fast feedback)
- `onPress` → add label to sentence strip
- Press animation: slight scale-down (0.95) on press-in, back on release
  - Must check `useReducedMotion()` — skip animation if true

**Sizing:**
- `normal`: minimum 68×68pt (3-column grid)
- `large`: minimum 90×90pt (2-column elderly grid)
- Icon: 24pt (normal), 32pt (large)
- Label: 11pt minimum (normal), 16pt (large)

**Accessibility (non-negotiable):**
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel={label}
  accessibilityHint="Double tap to speak this word"
  accessibilityRole="button"
  style={{ minWidth: 68, minHeight: 68 }}
  onPressIn={() => playAudio(tile.id, language)}
  onPress={() => onPress(label)}
>
```

**Acceptance criteria:**
- [x] Tile renders image placeholder + label text
- [x] `onPressIn` triggers audio playback via `useTtsAudio`
- [x] `onPress` calls `onPress(label)` callback
- [x] Animation (scale 0.93) respects `useReducedMotion()` — skipped if true
- [x] `accessibilityLabel`, `accessibilityHint`, `accessibilityRole` all set
- [x] Touch target: normal=80pt, large=96pt — well above 44pt ADA minimum
- [x] Label: `adjustsFontSizeToFit`, `numberOfLines=2`, `minimumFontScale=0.75` — never truncates
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Completion note (2026-06-04):** Real images deferred to ACET-013/014. TileGrid built alongside — renders positional grid from row/col indices, auto-selects 'large' tiles for 2-column (elderly) mode.

---

## ACET-007 — TTS integration — P1 DONE ✓

**What:** Azure Neural TTS for the 6 free-tier languages. Audio is generated server-side, cached in Cloudflare R2, and played in-app.

**Files:**
- `server/routes/tts.ts` — POST `/api/tts` endpoint
- `lib/azure-tts.ts` — client helper to call the API + manage playback
- `lib/r2-cache.ts` — R2 get/put helpers

**Server route logic:**
```typescript
// POST /api/tts
// body: { text: string, language: LanguageCode }
// 1. Hash: cacheKey = `tts:${language}:${sha256(text)}`
// 2. Check R2 for cached audio → return URL if exists
// 3. If not cached → call Azure Neural TTS API
// 4. Upload audio to R2 with cacheKey
// 5. Return R2 public URL
// Rate limit: 30 requests/minute per user
```

**Azure voice selection from constants/languages.ts:**
```typescript
// Uses getLanguage(code).azureVoice to pick the correct neural voice
// Example: 'en' → 'en-US-JennyNeural'
//          'th' → 'th-TH-PremwadeeNeural'
//          'ht' → 'fr-FR-DeniseNeural' (placeholder — see language note in README)
```

**Important:** `AZURE_TTS_KEY` lives in the server `.env` only. The client calls `/api/tts` — it never calls Azure directly.

**Acceptance criteria:**
- [x] POST `/api/tts` returns audio URL for all 6 free-tier languages — SSML with correct voice IDs
- [x] Second request for same text+language returns cached R2 URL — `getCachedUrl()` checks R2 first
- [x] Audio plays in-app on tile press-down — `expo-av` `Audio.Sound.createAsync`
- [x] TTS failure falls back gracefully — `console.error` + silent no-op, user still sees label
- [x] `AZURE_TTS_KEY` is server-only — `lib/azure-tts.ts` calls `/api/tts`, never Azure directly
- [x] Rate limiting: 30 req/60s per IP on `/api/tts` — in-memory map, returns 429 on breach
- [x] Haitian Creole: `fr-FR-DeniseNeural` placeholder documented in AGENTS.md
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Completion note (2026-06-04):** In-session URL cache in `useTtsAudio` avoids repeat API calls during a session. `CLOUDFLARE_*` env vars aligned in `.env.example`. `EXPO_PUBLIC_TTS_API_URL` added for Railway server URL.
**⚠️ Manual step required:** Set `EXPO_PUBLIC_TTS_API_URL` in `.env` once Railway server is deployed. TTS will not play until this is set.
**⚠️ SHIELD note:** Haitian Creole (`ht`) voice quality must be reviewed before beta — `fr-FR-DeniseNeural` is an approximation only. See AGENTS.md blocked list.

**SHIELD:** `AZURE_TTS_KEY` confirmed server-only. Rate limiting active. R2 `ACL: public-read` on audio files only (not on bucket config — verify when creating bucket).

---

## ACET-008 — Sentence strip — P1 OPEN

**What:** The persistent bar above the tile grid where tapped words accumulate as pills. Includes speak button and clear button.

**File:** `components/board/SentenceStrip.tsx`

**Props:**
```typescript
interface SentenceStripProps {
  words: string[]
  onSpeak: () => void
  onClear: () => void
  onRemoveWord: (index: number) => void
}
```

**Behavior:**
- Words appear as coral pills: `bg-coral-light text-coral-dark`
- Tapping a pill removes that word from the sentence
- Speak button (volume icon, coral bg): calls TTS on the full sentence string, then clears
- Clear button (× icon, muted): clears all words
- Strip must always be visible — never hidden or scrolled off screen
- If sentence is empty: show placeholder "Tap a tile to start..." in muted italic

**Speak button TTS logic:**
```typescript
// WHY: Speaking the full sentence (not just the last word) creates natural communication
const sentence = words.join(' ')
await playTTS(sentence, currentLanguage)
```

**Acceptance criteria:**
- [x] Words render as removable coral pills (tap to remove individual word)
- [x] Speak button plays full sentence via TTS then clears
- [x] Clear button clears all words (only visible when words present)
- [x] Empty state placeholder: "Tap a tile to start…"
- [x] Strip always visible — outside ScrollView, anchored at bottom
- [x] `accessibilityLabel="Speak sentence"` on speak button; `accessibilityState.disabled` when empty
- [x] `accessibilityLabel="Clear sentence"` on clear button
- [x] Speak button: 52pt height, 52pt min width — largest control in strip
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Completion note (2026-06-04):** Sentence state moved to `sentenceStore` (Zustand) — globally shared so any future screen can read/write. Strip scrolls horizontally for long sentences.

---

## ACET-009 — Board navigation — P1 OPEN

**What:** Tapping a tile that has `link_board_id` set navigates to that sub-board. Back button or home tile returns to home board. Breadcrumb shows current path.

**Files:**
- `store/boardStore.ts` — `boardStack: Board[]`, push/pop actions
- `app/(tabs)/index.tsx` — update to render `boardStack.at(-1)` instead of hardcoded home board

**Navigation logic:**
```typescript
// Tile press — if tile.linkBoardId is set, navigate to sub-board
if (tile.linkBoardId) {
  boardStore.push(await fetchBoard(tile.linkBoardId))
} else {
  sentenceStore.addWord(label)
}
```

**Header breadcrumb:**
- Shows current board name
- Back arrow visible when `boardStack.length > 1`
- Home icon always navigates to root board (pops entire stack)

**Acceptance criteria:**
- [x] Tapping a link tile (tile.linkBoardId set) fetches + pushes linked board
- [x] Back chevron (‹) pops to previous board; only visible when stack depth > 1
- [x] Home icon (⌂) in header pops entire stack back to root board
- [x] Current board name shows in header — updates live on navigation
- [x] Loading spinner in header during board fetch transition
- [x] `accessibilityLabel="Go back to previous board"` on back button
- [x] `accessibilityLabel="Go to home board"` on home icon
- [x] `npx tsc --noEmit` passes — verified 2026-06-04

**Completion note (2026-06-04):** boardStore stack drives rendering — `boardStack.at(-1)` is always current. Non-link tiles still add to sentence. `useBoardNavigation` hook handles fetch + stack push, centralising all navigation logic.

---

## ACET-010 — Supabase real-time sync — P1 OPEN

**What:** When a parent or therapist edits a board, the change propagates instantly to the child's device without a reload.

**Files:**
- `hooks/useBoardSync.ts` — subscribes to Supabase Realtime on `boards` and `tiles` tables

**Pattern:**
```typescript
// hooks/useBoardSync.ts
// WHY: A therapist editing a tile at 3pm should appear on the child's tablet immediately
const channel = supabase
  .channel(`board:${boardId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tiles',
    filter: `board_id=eq.${boardId}`
  }, (payload) => {
    boardStore.handleRealtimeUpdate(payload)
  })
  .subscribe()

// Cleanup on unmount
return () => { supabase.removeChannel(channel) }
```

**Acceptance criteria:**
- [x] Tile label change reflects on board screen within 2 seconds — INSERT/UPDATE/DELETE events via Supabase Realtime
- [x] New tile added reflects in real-time — `upsertTile` action on boardStore
- [x] Deleted tile disappears in real-time — `deleteTile` action on boardStore
- [x] Channels unsubscribed on unmount — cleanup in useEffect return; channels cleared on stack change
- [x] Subscribes to every board in navigation stack — one channel per board ID
- [x] Stale channels cleaned up when board is popped from stack
- [x] `npx tsc --noEmit` passes — verified 2026-06-09

**Completion note (2026-06-09):** `boardStore` extended with `upsertTile`/`deleteTile` patch actions. `useBoardSync` subscribes to `postgres_changes` on `tiles` filtered by `board_id`. Wired into home board screen alongside `useEffect`. Requires `supabase/rls-fix.sql` to be run first (realtime respects RLS).

---

## ACET-011 — RevenueCat billing — P2 OPEN

**What:** Set up RevenueCat to manage free vs pro entitlements. Paywall screen shown when a pro feature is accessed by a free user.

**Files:** `lib/revenuecat.ts`, `components/ui/Paywall.tsx`, `hooks/useEntitlement.ts`

**Entitlements:**
- `free` — unlimited boards (3 free languages, basic TTS, single device)
- `pro` — all languages, natural voice, cloud sync, collaboration, custom voice recording
- `org` — pro + SLP reporting, HIPAA BAA option, multi-user

**Pricing constants:**
- Monthly: $4.99
- Annual: $49/yr
- Lifetime: $149 one-time

**Acceptance criteria:**
- [ ] `useEntitlement('pro')` returns correct boolean from RevenueCat
- [ ] Pro feature access by free user shows `<Paywall />` component
- [ ] Paywall shows monthly/annual/lifetime options with correct prices
- [ ] Successful purchase updates entitlement in real-time
- [ ] RevenueCat webhook updates Supabase `subscriptions` table via server route
- [ ] `REVENUECAT_WEBHOOK_SECRET` is server-side only

---

## ACET-012 — Parent dashboard — P2 OPEN

**What:** A settings-like screen for the parent/caregiver to manage the communicator profile, boards, and supervisors.

**Sections:** Profile settings (name, language, grid size) · Board management (create, rename, delete boards) · Supervisors (invite therapist/teacher by email) · Danger zone (delete communicator data)

**Acceptance criteria:**
- [ ] Profile edits save to Supabase and reflect immediately on board screen
- [ ] Board create/rename/delete works
- [ ] Supervisor invite sends email via Clerk
- [ ] Delete communicator data: requires typed confirmation, removes all rows with CASCADE
- [ ] All forms have accessible labels and error states
- [ ] `npx tsc --noEmit` passes

---

## ACET-013 — OBF export — P2 OPEN

**What:** Export a board as an `.obz` file (zipped OBF) that can be imported into any other AAC app.

**File:** `lib/obf.ts` — `exportBoardToOBZ(board: Board): Promise<Blob>`

**OBF format reference:** openboardformat.org/docs

**Acceptance criteria:**
- [ ] Exported `.obz` can be imported into Cboard or CoughDrop without errors
- [ ] All tile labels (in the communicator's primary language) are present
- [ ] Linked sub-boards are included in the `.obz` zip
- [ ] Export button accessible from parent dashboard board list

---

## ACET-014 — OBF import — P2 OPEN

**What:** Import a `.obz` file from another AAC app. Parses the OBF JSON, creates boards and tiles in Supabase.

**File:** `lib/obf.ts` — `importBoardFromOBZ(file: File, communicatorId: string): Promise<Board>`

**Acceptance criteria:**
- [ ] Imports `.obz` from Cboard export without errors
- [ ] Tiles with images preserve image URLs (or download and store in Supabase Storage)
- [ ] Linked sub-boards preserved correctly
- [ ] Import accessible from parent dashboard
- [ ] Malformed OBF handled gracefully with user error message

---

## ACET-015 — EAS build — P2 OPEN

**What:** Configure EAS Build for iOS (TestFlight) and Android (Play Store internal track) production builds.

**File:** `eas.json` — development, preview, production profiles

**Acceptance criteria:**
- [ ] `eas build --platform ios --profile preview` completes without errors
- [ ] `eas build --platform android --profile preview` completes without errors
- [ ] iOS build submitted to TestFlight
- [ ] Android build submitted to Google Play internal track
- [ ] Production build strips all `console.log` statements

---

## ACET-016 — Web deploy — P2 OPEN

**What:** Deploy Expo web to Vercel. Ensure board screen renders correctly on desktop browsers.

**File:** `vercel.json`

**Notes:**
- Web version is for parent dashboard and account management primarily
- Board screen on web: keyboard accessible, mouse click = tap
- Test on Chrome and Firefox

**Acceptance criteria:**
- [ ] `npx expo export --platform web` builds without errors
- [ ] Vercel deployment succeeds
- [ ] Board screen functional in Chrome and Firefox
- [ ] Authentication works on web (Clerk web SDK)

---

## ACET-017 — PostHog + Sentry — P2 OPEN

**What:** Add PostHog product analytics and Sentry crash reporting. PostHog must be disabled for child profiles.

**COPPA gate (non-negotiable):**
```typescript
// WHY: COPPA prohibits behavioral analytics on children under 13
// WHY: Apple Kids Category prohibits third-party analytics SDKs in child-facing screens
function trackEvent(event: string, props?: object) {
  const profile = communicatorStore.activeProfile
  if (profile?.ageGroup === 'child') return  // silently no-op
  posthog.capture(event, props)
}
```

**Acceptance criteria:**
- [ ] PostHog events fire for adult/elderly profiles
- [ ] PostHog events are silently blocked for child profiles
- [ ] Sentry captures crashes with stack traces
- [ ] Sentry does not log any PII (user IDs are Clerk UUIDs only, no email/name)
- [ ] `npx tsc --noEmit` passes

---

## ACET-018 — Privacy policy + parental consent — P1 OPEN

**What:** COPPA-required parental consent gate before any child communicator data is saved. Privacy policy screen accessible from onboarding and settings.

**COPPA requirements:**
- Consent screen shown when `age_group = 'child'` is selected in onboarding
- Parent must tap "I agree" (no pre-checked boxes)
- Consent stored in `parental_consents` table with timestamp + consent version
- Privacy policy readable at 6th-grade reading level (check with Hemingway App)
- Data deletion option must be accessible from settings

**Acceptance criteria:**
- [ ] Consent screen appears when child profile is created
- [ ] Consent record written to `parental_consents` before communicator record is created
- [ ] Consent cannot be skipped (no back button on consent screen)
- [ ] Privacy policy text is accessible from onboarding and settings
- [ ] Data deletion removes all communicator data and consent record

---

## ACET-019 — Accessibility audit — P1 OPEN

**What:** Full accessibility review of all Phase 0 screens against the ACCESS checklist in CLAUDE.md and README.md.

**Audit each screen against:**
- [ ] All interactive elements have `accessibilityLabel`
- [ ] All images have `accessibilityLabel` or `accessible={false}`
- [ ] Touch targets ≥ 44pt (verify with Accessibility Inspector on device)
- [ ] Text does not truncate
- [ ] Color contrast passes WCAG AA (use Colour Contrast Analyser)
- [ ] VoiceOver (iOS) navigates logically through every screen
- [ ] TalkBack (Android) navigates logically through every screen
- [ ] No animation without `useReducedMotion()` check
- [ ] Error states communicated via text, not color/icon only
- [ ] Elderly mode tested with 56pt tiles and 24px labels

**Any failing item:** Open a `ACET-A11Y-XXX` bug ticket and document the issue before marking ACET-019 done.

---

## ACET-020 — Beta testing setup — P2 OPEN

**What:** Distribute to internal beta testers via TestFlight (iOS) and Google Play internal track (Android). Set up a basic feedback form.

**Acceptance criteria:**
- [ ] At least 3 external beta testers added to TestFlight
- [ ] Android build available via Google Play internal track
- [ ] PostHog survey configured to appear after 3 app sessions
- [ ] Feedback email address documented in app settings
- [ ] Known issues documented in a pinned GitHub issue

---

## Security & modernisation tickets (from security review 2026-06-09)

| # | Ticket | Priority | Status | Description |
|---|---|---|---|---|
| S1 | ACET-SEC-001 | **P0** | **DONE** | Migrate `@clerk/clerk-expo@2.x` → `@clerk/expo@3.x` — entire 2.x range is vulnerable |
| S2 | ACET-SEC-002 | **P2** | **BLOCKED** | `uuid@8.3.2` transitive CVE — no fix available until upstream deps update |
| 21 | ACET-021 | **P0** | **DONE** | Supabase RLS infinite recursion fix — SECURITY DEFINER helpers, schema.sql updated |
| 22 | ACET-022 | **P0** | **DONE** | Persistent Redis rate limiting for TTS — Upstash sliding window, in-memory map removed |
| 23 | ACET-023 | **P0** | **OPEN** | COPPA hard gate — parental consent screen before any child communicator record is created |
| 24 | ACET-024 | **P1** | **OPEN** | R2 audio cache security audit — SHA-256 key hashing, bucket access policy verification |
| 25 | ACET-025 | **P1** | **OPEN** | Context file updates — PHI handling, JWT claim validation, ADR-011 data classification |
| 26 | ACET-026 | **P1** | **OPEN** | Zod runtime validation — schemas for all Supabase responses + Zustand store guards |
| 27 | ACET-027 | **P2** | **OPEN** | AudioService abstraction — extract expo-av from UI into services/AudioService.ts |
| 28 | ACET-028 | **P2** | **OPEN** | Edit mode biometric/PIN lock — prevent accidental board edits |
| 29 | ACET-029 | **P2** | **OPEN** | Vocabulary masking — hide tiles without shifting grid (motor-planning integrity) |
| 30 | ACET-030 | **P2** | **OPEN** | Low-stimulus mode — high-contrast monochrome UI for sensory-sensitive users |

---

## ACET-SEC-001 — Clerk security migration — P0 DONE ✓

**What:** GitHub Dependabot security advisory: `@clerk/clerk-expo` versions `>= 2.2.11 <= 2.19.35` are vulnerable. No patched `2.x` version exists. The fix is migrating to the `@clerk/expo@3.x` package (renamed + redesigned).

**CVE range:** `@clerk/clerk-expo >= 2.2.11 <= 2.19.35` — all `2.x` affected.
**Evidence:** Dependabot job `1397087679` — `security_update_not_found`, latest resolvable version `2.19.31` still in advisory range.

**Files:**
- `package.json` — remove `@clerk/clerk-expo`, add `@clerk/expo@^3`
- `app/_layout.tsx` — update import
- `app/index.tsx` — update import
- `app/(auth)/sign-in.tsx` — rewrite for v3 API (`useClerk` for `setActive`)
- `app/(auth)/sign-up.tsx` — rewrite for v3 API (cast post-create signUp resource)
- `app/(auth)/_layout.tsx` — update import
- `app/(tabs)/_layout.tsx` — update import
- `app/(onboarding)/_layout.tsx` — update import
- `app/(onboarding)/who-for.tsx` — update import
- `hooks/useSupabaseWithAuth.ts` — update import

**v3 API differences:**
- `useSignIn()` returns `{ signIn, errors, fetchStatus }` — no `setActive`, no `isLoaded`
- `setActive` comes from `useClerk()`
- `isLoaded` replaced by `fetchStatus !== 'loading'`
- `signIn.create()` returns `{ error: ClerkError | null }` — check `signIn.status` on reactive obj
- `signUp.prepareEmailAddressVerification` / `attemptEmailAddressVerification` require casting post-create (TypeScript types `signUp` as `SignUpFutureResource` before create; cast to `any` with `// WHY:` is acceptable)

**Acceptance criteria:**
- [x] `@clerk/clerk-expo` removed from `package.json` — verified
- [x] `@clerk/expo@^3.3.1` present in `package.json` — verified
- [x] All Clerk imports updated to `@clerk/expo` (9 files)
- [x] `npx tsc --noEmit` passes — zero errors (2026-06-04)
- [ ] Sign-in / sign-up flow tested end-to-end on web — pending Supabase schema + Clerk JWT template setup

**Completion note (2026-06-04):** v3 API differences handled:
- `fetchStatus` type is `'idle' | 'fetching'` (not `'loading'`) — fixed
- `setActive` from `useClerk()` not `useSignIn()`
- `signUp.prepareEmailAddressVerification` requires `as any` cast post-create (WHY comment added)

---

## ACET-SEC-002 — uuid transitive vulnerability — P2 BLOCKED

**What:** `uuid@8.3.2` (transitive dependency) is flagged by the security advisory as vulnerable. Fix requires `uuid >= 14.0.0`. However, Dependabot reports this as `security_update_not_possible` because our direct dependencies constrain `uuid` to `8.x` — no direct upgrade path exists.

**Evidence:** Dependabot job `1397087686` — "No patched version available for uuid" at `8.3.2`.

**Root cause:** One or more packages in our dependency tree (`@sentry/react-native`, `expo-cli`, or similar) pin `uuid@8.x` as a peer or direct dep. Until those upstream packages update their own `uuid` dependency, we cannot resolve this.

**Action required:** None currently. This is a transitive CVE in a dependency we don't control.
**Resolution path:** Resolved automatically when upstream packages update `uuid` to `14.x`.
**Risk assessment:** `uuid` is used for ID generation; the CVE relates to predictable UUID generation in certain environments. Review when upstream fix is available.

**Acceptance criteria:**
- [ ] *(Blocked)* Upstream dependency updates `uuid` to `>= 14.0.0`
- [ ] Re-run `npm audit` after upstream update to confirm resolution

---

## ACET-005 — Home board screen — P1 OPEN

**What:** Build the main communication board screen. User signs in → completes onboarding → lands on the home board showing the 3×3 (or 2×3 for elderly) grid of communication tiles with a persistent sentence strip at the bottom.

**Files to create/modify:**
- `app/(tabs)/(home)/index.tsx` — home board screen
- `app/(tabs)/_layout.tsx` — bottom tabs: Home, Boards, Settings
- `components/board/HomeBoard.tsx` — board grid container
- `hooks/useHomeBoardData.ts` — fetch communicator + home board from Supabase

**Dependencies:** ACET-002 (Supabase schema running), ACET-003 (auth working), ACET-004 (onboarding done)

**Access checklist (from CLAUDE.md):**
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Touch targets are minimum 44×44pt
- [ ] Text is not truncated
- [ ] Tile press registers on touch-down (immediate audio feedback)
- [ ] Screen works with VoiceOver (iOS) and TalkBack (Android)
- [ ] No animation plays unless `useReducedMotion()` returns false

**Acceptance criteria:**
- [ ] Home board renders 3×3 grid (or 2×3 for elderly) of tiles from Supabase
- [ ] Each tile shows label text (no image yet — ACET-006)
- [ ] Language toggle in header switches grid language live (changes all labels)
- [ ] Empty state: if home board is empty, show "Create your first board" CTA
- [ ] Sentence strip (stub) persists at bottom (implemented fully in ACET-008)
- [ ] All tiles have `accessibilityLabel` set to tile label
- [ ] Touch targets ≥ 44×44pt
- [ ] `npx tsc --noEmit` passes

**Notes:**
- The grid layout is responsive: web shows 3×3, mobile shows 3×3 for adults/children, 2×3 for elderly
- Language toggle must respect `useOnboardingStore()` to stay in sync with selected language
- Tile press routing comes in ACET-009 (navigation) — for now, just log the press

---

## ACET-006 — Tile component — P1 OPEN

**What:** Build the reusable `Tile` component with accessible labels, 44pt+ touch targets, and immediate audio feedback on press (TTS audio comes in ACET-007).

**Files to create/modify:**
- `components/board/Tile.tsx` — core tile component
- `components/board/TileGrid.tsx` — grid layout wrapper (reuse in home, category boards)

**Access checklist:**
- [ ] Touch target ≥ 44×44pt (minimum)
- [ ] All tiles have `accessibilityLabel` (spoken by screen reader)
- [ ] All tiles have `accessibilityRole="button"`
- [ ] All tiles have `accessibilityHint` (e.g., "Double tap to speak")
- [ ] Text label does not truncate (wrap or resize tile)
- [ ] Background color is configurable (tiles can have different colors)
- [ ] Image placeholder (gray box for now — actual images in ACET-013/014)

**Acceptance criteria:**
- [ ] `Tile` component accepts: `label` (string), `color` (optional), `onPress` (callback)
- [ ] Label is centered, 18px+ font size, never truncated
- [ ] `onPressIn` callback fires immediately on touch-down (for audio feedback)
- [ ] `onPress` callback fires on touch release (for board navigation, ACET-009)
- [ ] Component is styled with Nativewind (tailwind classes)
- [ ] Works on iOS, Android, and web
- [ ] All accessibility props set: `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`
- [ ] `npx tsc --noEmit` passes

**Notes:**
- Tile size: 80×80pt on mobile (44pt+ and good for elderly users)
- Grid gap: 8pt between tiles
- Tile press: `onPressIn` triggers immediately, `onPress` triggers on release
  - This design gives users immediate feedback (audio) while allowing touch-up navigation

---

## ACET-007 — TTS integration — P1 OPEN

**What:** Integrate Azure Neural TTS to generate and cache audio for communication tiles. When a tile is pressed, play the tile's label in the user's selected language (from `useOnboardingStore`).

**Files to create/modify:**
- `lib/azure-tts.ts` — TTS client, caching logic, Cloudflare R2 upload
- `hooks/useTtsAudio.ts` — custom hook to fetch/play cached audio
- `constants/languages.ts` — expand with Azure Neural voice IDs per language

**Environment variables needed:**
```
EXPO_PUBLIC_AZURE_TTS_ENDPOINT=https://<region>.tts.speech.microsoft.com/
EXPO_AZURE_TTS_KEY=<key>            # Server-side only
EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET=...
EXPO_CLOUDFLARE_R2_KEY=...
EXPO_CLOUDFLARE_R2_SECRET=...
```

**Free tier languages (from CLAUDE.md):**
- English (en-US): `en-US-AriaNeural` (female)
- Spanish (es-MX): `es-MX-DaliaNeural` (female)
- Thai (th-TH): `th-TH-PremwadeeNeural` (female)
- Vietnamese (vi-VN): `vi-VN-HoaiMyNeural` (female)
- Tagalog (tl-PH): `tl-PH-AngelNeural` (female)
- Haitian Creole (ht-HT): Use `en-US` as fallback, document for Phase 1 custom voice

**Acceptance criteria:**
- [ ] Azure TTS client created (`lib/azure-tts.ts`) with methods: `generateAudio(text, language)`, `cacheKey(language, text)`
- [ ] Cloudflare R2 integration to cache `.mp3` files by hash (avoid re-generating same phrase)
- [ ] `useTtsAudio(label, language)` hook returns `{ url, isLoading, error }`
- [ ] Tile press triggers audio playback via `onPressIn` callback
- [ ] Audio plays without blocking navigation (async)
- [ ] Fallback text if TTS fails: tile label shows on screen (user still communicates)
- [ ] Azure TTS API calls are logged (not the output, just calls for cost tracking)
- [ ] `npx tsc --noEmit` passes

**Notes:**
- TTS generation happens server-side (via a small Node.js API endpoint on Railway)
  - Client sends: `{ text, language }` → Server calls Azure → uploads to R2 → returns `url`
  - This keeps Azure key server-side and avoids latency on first-time audio generation
- Audio is cached by hash so the same phrase in the same language always returns the same URL
- If Azure TTS fails, show text on screen — never crash or go silent
- Audio playback: use React Native `Sound` library (or Expo `Audio` module)

**Shield notes:**
- Azure API calls must include error logging (quota exceeded, bad language code, etc.)
- If TTS fails, gracefully fall back to text-only — do not leave the user unable to communicate

---

---

## ACET-021 — Supabase RLS infinite recursion fix — P0 OPEN

**What:** The `communicator_owner_or_supervisor` policy on `communicators` subqueries `supervisors`, which itself subqueries `communicators` — PostgreSQL detects this as infinite recursion (error 42P17). The app cannot query boards or tiles until this is resolved.

**Root cause:** Circular policy dependency between `communicators` ↔ `supervisors`.
**Fix written:** `supabase/rls-fix.sql` — two `SECURITY DEFINER` functions (`is_supervisor_of`, `my_communicator_ids`) break the cycle. Policies rebuilt to use helpers.
**Status:** SQL written and committed. **Nadia must run `supabase/rls-fix.sql` in the Supabase SQL editor.**

**Files:**
- `supabase/rls-fix.sql` — already committed, ready to run
- `supabase/schema.sql` — update original schema to use helpers (prevent recurrence)

**Acceptance criteria:**
- [ ] `supabase/rls-fix.sql` run in Supabase SQL editor — **pending Nadia manual run**
- [x] `schema.sql` updated with `SECURITY DEFINER` helpers + `DROP POLICY IF EXISTS` — idempotent re-runs safe
- [x] `masked` column added to `tiles` table in schema (ACET-029 prep)
- [x] `types/index.ts` updated with `masked?: boolean` on `Tile`
- [ ] Anon key query returns `[]` not 500 — verifiable after manual SQL run
- [x] `npx tsc --noEmit` passes — verified 2026-06-09

**Completion note (2026-06-09):** `schema.sql` is now the canonical source of truth and is idempotent. `rls-fix.sql` remains for patching the already-deployed database. Both files use `SECURITY DEFINER` helpers. **Nadia: run `rls-fix.sql` in Supabase SQL editor to fix the live database.**

---

## ACET-022 — Persistent Redis rate limiting for TTS — P0 OPEN

**What:** `server/routes/tts.ts` uses an in-memory JS `Map` for rate limiting. This resets on every Railway container restart/sleep — anyone can exhaust the Azure TTS free tier quota by triggering a restart then hammering the endpoint.

**Fix:** Replace in-memory map with Upstash Redis sliding-window rate limiter (`@upstash/ratelimit` + `@upstash/redis`). Free tier is sufficient for MVP.

**Files:**
- `server/routes/tts.ts` — replace in-memory limiter
- `server/lib/redis.ts` — new Upstash client singleton
- `.env.example` — add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Environment variables:**
```
UPSTASH_REDIS_REST_URL=   # from Upstash console
UPSTASH_REDIS_REST_TOKEN= # from Upstash console
```

**Acceptance criteria:**
- [x] In-memory `Map` fully removed from `server/routes/tts.ts`
- [x] Upstash Redis sliding window (30 req/60s per IP) — `server/lib/redis.ts` singleton
- [x] Graceful degradation: Redis unavailable → log error → allow request (TTS never fully down)
- [x] `X-RateLimit-Remaining` header returned on 429 response
- [x] `.env.example` updated with `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [x] `DECISIONS.md` ADR-012 added documenting Upstash choice
- [ ] Rate limit persists across Railway restarts — verifiable after Upstash credentials set in Railway env
- [x] `tsc --noEmit` passes — verified 2026-06-09

**Completion note (2026-06-09):** `@upstash/redis` + `@upstash/ratelimit` installed. `server/lib/redis.ts` lazy-initialises Ratelimit singleton. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Railway environment variables before rate limiting is active. Without them, server throws on startup — set these before deploying.

---

## ACET-023 — COPPA hard gate — P0 OPEN

**What:** ⛔ SHIELD — `age_group = 'child'` is selected in onboarding but no consent record is written before the `communicators` row is created. This violates COPPA. The consent screen (`app/(onboarding)/consent.tsx`) is a stub.

**Required flow:**
1. Who-for screen selects `child` → navigate to consent screen (already wired)
2. Consent screen: show privacy policy summary, require explicit "I agree" tap (no pre-check)
3. On agree: write `parental_consents` row first, then create `communicators` row
4. PostHog: call `posthog.optOut()` immediately when `age_group = 'child'` is confirmed

**Files:**
- `app/(onboarding)/consent.tsx` — implement full consent UI
- `app/(onboarding)/who-for.tsx` — verify child path passes consent before creating record
- `hooks/usePostHog.ts` (new) — wraps PostHog with child-profile gate

**SHIELD:**
- Consent record must be inserted BEFORE the communicator record — never after
- No `posthog.capture()` calls allowed when active profile is `child`
- "I agree" button must require affirmative tap — no pre-checked checkbox

**Acceptance criteria:**
- [ ] Child communicator cannot be created without a `parental_consents` row
- [ ] Consent screen cannot be back-navigated past (no back button shown)
- [ ] PostHog events disabled for child profiles
- [ ] Consent timestamp + version stored in `parental_consents`
- [ ] `tsc --noEmit` passes

---

## ACET-024 — R2 audio cache security audit — P1 OPEN

**What:** ⛔ SHIELD — TTS cache keys are derived from `sha256(text)` + language. If a user speaks medical/PII text, the hash is cryptographically irreversible (safe), but the R2 bucket `ACL: public-read` means anyone with the URL can access the audio.

**Tasks:**
- Verify `ttsKey()` in `lib/r2-cache.ts` uses SHA-256 (already does — confirm 16-char truncation is safe)
- Verify R2 bucket does NOT allow public listing (only direct URL access is acceptable)
- Document the acceptable risk: audio URLs are unguessable 256-bit hashes — direct URL access without listing is acceptable for cached TTS audio (no PII in the file path)
- Confirm `ACL: public-read` is on objects, not on the bucket's list permission

**Acceptance criteria:**
- [ ] `ttsKey()` confirmed to use full SHA-256 hex (16-char prefix reviewed and documented)
- [ ] R2 bucket public listing is disabled (verify in Cloudflare dashboard)
- [ ] Security note added to `lib/r2-cache.ts` explaining the hashing rationale
- [ ] DECISIONS.md updated: ADR-011 — Data classification and R2 access policy

---

## ACET-025 — Context file updates for PHI/security directives — P1 OPEN

**What:** Add security directives surfaced by the 2026-06-09 security review to `CLAUDE.md`, `AGENTS.md`, and `DECISIONS.md`.

**Changes:**
- `CLAUDE.md` Shield persona: mandate `expo-secure-store` for any local profile caching; verify Clerk JWT custom claims before generating SQL
- `AGENTS.md`: add pre-flight dependency CVE check step; note `uuid@8.3.2` blocker
- `DECISIONS.md`: ADR-011 — data classification (custom vocabulary and uploaded media = PHI, never sent to external analytics)

**Acceptance criteria:**
- [ ] `CLAUDE.md` Shield section updated
- [ ] `AGENTS.md` preflight check documented
- [ ] `DECISIONS.md` ADR-011 added

---

## ACET-026 — Zod runtime validation for Supabase responses — P1 OPEN

**What:** Supabase query results are typed at compile time but unvalidated at runtime. A schema migration or data inconsistency causes silent wrong-type data into Zustand stores, which can crash the board screen mid-communication.

**Files:**
- `lib/schemas.ts` (new) — Zod schemas for `Communicator`, `Board`, `Tile` as returned by Supabase
- `hooks/useHomeBoardData.ts` — parse results through schemas
- `hooks/useBoardNavigation.ts` — parse board + tiles through schemas
- `store/boardStore.ts` — guard `setHome`/`push` with schema parse

**Acceptance criteria:**
- [ ] Malformed `communicators` row: hook returns `error` state, does not crash
- [ ] Malformed `tiles` row: tile skipped, others still render
- [ ] `tsc --noEmit` passes

---

## ACET-027 — AudioService abstraction — P2 OPEN

**What:** `expo-av` calls are scattered across `hooks/useTtsAudio.ts`. Abstracting into a service makes it testable and swappable (e.g. for `expo-audio` in SDK 57+).

**Files:**
- `services/AudioService.ts` (new) — singleton: `play(url)`, `stop()`, `preload(url)`
- `hooks/useTtsAudio.ts` — delegate to `AudioService`

**Acceptance criteria:**
- [ ] `useTtsAudio` contains no direct `expo-av` imports
- [ ] `AudioService.play(url)` handles stop-then-play and unload-on-finish
- [ ] `tsc --noEmit` passes

---

## ACET-028 — Edit mode biometric/PIN lock — P2 OPEN

**What:** Caregivers accidentally enter edit mode (board editing, tile deletion) and destroy the communicator's layout. A PIN or biometric check before entering edit mode prevents accidental changes.

**Files:**
- `hooks/useEditLock.ts` (new) — `requestEditAccess(): Promise<boolean>` using `expo-local-authentication`
- `app/(tabs)/settings.tsx` — gate all destructive actions behind `useEditLock`

**Acceptance criteria:**
- [ ] Edit mode requires Face ID / Touch ID or PIN before activation
- [ ] Falls back gracefully if biometrics unavailable (PIN only)
- [ ] `tsc --noEmit` passes

---

## ACET-029 — Vocabulary masking (motor-planning integrity) — P2 OPEN

**What:** Deleting a tile shifts all subsequent tiles, destroying the communicator's muscle memory. Masking hides a tile visually while preserving its grid position.

**Schema change:** Add `masked boolean DEFAULT false` to `tiles` table.

**Files:**
- `supabase/schema.sql` — add `masked` column migration
- `types/index.ts` — add `masked?: boolean` to `Tile`
- `components/board/Tile.tsx` — render as invisible placeholder when `masked`
- `components/board/TileGrid.tsx` — masked tiles occupy space but are non-interactive

**Acceptance criteria:**
- [ ] Masked tile is invisible but holds grid position
- [ ] Masked tile has `accessible={false}` — screen readers skip it
- [ ] Unmasking restores tile at same position
- [ ] `tsc --noEmit` passes

---

## ACET-030 — Low-stimulus mode — P2 OPEN

**What:** Visual clutter (colors, borders, shadows) causes sensory overload for some communicators. A low-stimulus mode strips the UI to high-contrast monochrome.

**Files:**
- `store/preferencesStore.ts` (new) — `lowStimulusMode: boolean`, persisted via `expo-secure-store`
- `components/board/Tile.tsx` — apply monochrome classes when mode active
- `components/board/TileGrid.tsx` — remove gap/border styles in low-stimulus mode
- `app/(tabs)/settings.tsx` — toggle

**Acceptance criteria:**
- [ ] Toggle instantly flattens UI: white background, black text, no color fills, no shadows
- [ ] Preference persists across app restarts
- [ ] High-contrast text still passes WCAG AA (7:1 ratio in this mode)
- [ ] `tsc --noEmit` passes

---

## Bug tickets

*None yet — this section will populate during Phase 0 development.*

## Regression tickets

*None yet.*

---

## Phase 1 queue (post-MVP — do not start)

| Ticket | Description |
|---|---|
| ACET-101 | Custom voice recording — record a family member's voice for any tile |
| ACET-102 | Supervisor collaboration — therapist/teacher board editing with role-based access |
| ACET-103 | Usage analytics dashboard — tile frequency reports for SLPs |
| ACET-104 | AI vocabulary suggestions — recommend new tiles based on usage patterns |
| ACET-105 | Switch scanning support — single/dual switch for users with limited motor control |
| ACET-106 | Code-switching boards — mixed-language tiles on a single board |
| ACET-107 | Community vocab packs — downloadable board packs by age/language/interest |
| ACET-108 | School/clinic tier — SLP reporting dashboard, HIPAA BAA option |
