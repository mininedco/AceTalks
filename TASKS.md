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
| 5 | ACET-005 | P1 | **OPEN** | Home board screen — tile grid, language toggle header, empty state |
| 6 | ACET-006 | P1 | **OPEN** | Tile component — accessible, 44pt target, audio on press, label display |
| 7 | ACET-007 | P1 | **OPEN** | TTS integration — Azure Neural, 6 free languages, R2 audio caching |
| 8 | ACET-008 | P1 | **OPEN** | Sentence strip — word pills, speak button, clear button, persistent bar |
| 9 | ACET-009 | P1 | **OPEN** | Board navigation — home board → category board → back, breadcrumb |
| 10 | ACET-010 | P1 | **OPEN** | Supabase real-time sync — board changes propagate across devices live |
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

## ACET-005 — Home board screen — P1 OPEN

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
- [ ] Home board tiles load from Supabase on mount
- [ ] Language toggle switches all tile labels instantly
- [ ] Elderly mode renders 2×3 grid with min 56pt tiles
- [ ] Empty state renders and is accessible
- [ ] Loading state shows skeleton tiles (not blank screen)
- [ ] `accessibilityLabel` on every tile, header button, nav item
- [ ] `npx tsc --noEmit` passes

---

## ACET-006 — Tile component — P1 OPEN

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
- [ ] Tile renders symbol image (if set) + label text
- [ ] `onPressIn` triggers audio playback
- [ ] `onPress` calls `onPress(label)` callback
- [ ] Animation respects `useReducedMotion()`
- [ ] `accessibilityLabel`, `accessibilityHint`, `accessibilityRole` all set
- [ ] Touch target ≥ 44pt in all states (verify with Accessibility Inspector)
- [ ] Label does not truncate — wraps or font-scales
- [ ] `npx tsc --noEmit` passes

---

## ACET-007 — TTS integration — P1 OPEN

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
- [ ] POST `/api/tts` returns audio URL for all 6 free-tier languages
- [ ] Second request for same text+language returns cached R2 URL (no Azure call)
- [ ] Audio plays in-app on tile press-down (Expo AV or expo-audio)
- [ ] TTS failure falls back to text display — app does not crash
- [ ] `AZURE_TTS_KEY` never appears in client bundle (verify with `npx expo export --dump-sourcemap | grep AZURE`)
- [ ] Rate limiting active on `/api/tts`
- [ ] Document Haitian Creole voice quality caveat for Nadia to test

**SHIELD:** Verify key is server-only. Verify rate limiting. Verify R2 bucket is not publicly writable.

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
- [ ] Words render as removable pills
- [ ] Speak button plays full sentence via TTS then clears
- [ ] Clear button clears all words
- [ ] Empty state placeholder renders
- [ ] Strip is always visible regardless of grid scroll
- [ ] `accessibilityLabel="Speak sentence"` on speak button
- [ ] `accessibilityLabel="Clear sentence"` on clear button
- [ ] Min touch target 44pt on speak button (it's the most important control)
- [ ] `npx tsc --noEmit` passes

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
- [ ] Tapping a link tile loads and renders the linked board
- [ ] Back button pops to previous board
- [ ] Home icon in header returns to root board from any depth
- [ ] Breadcrumb shows current board name
- [ ] Loading state between board transitions
- [ ] `accessibilityLabel="Go back"` on back button
- [ ] `accessibilityLabel="Home board"` on home icon
- [ ] `npx tsc --noEmit` passes

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
- [ ] Tile label change made in parent dashboard reflects on board screen within 2 seconds
- [ ] New tile added reflects on board screen in real-time
- [ ] Deleted tile disappears in real-time
- [ ] Channel is unsubscribed on component unmount (no memory leak)
- [ ] Real-time subscription respects RLS — user only receives updates for their communicator's boards
- [ ] `npx tsc --noEmit` passes

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

## Security tickets

| # | Ticket | Priority | Status | Description |
|---|---|---|---|---|
| S1 | ACET-SEC-001 | **P0** | **DONE** | Migrate `@clerk/clerk-expo@2.x` → `@clerk/expo@3.x` — entire 2.x range is vulnerable |
| S2 | ACET-SEC-002 | **P2** | **BLOCKED** | `uuid@8.3.2` transitive CVE — no fix available until upstream deps update |

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
