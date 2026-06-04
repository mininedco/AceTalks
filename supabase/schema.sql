-- AceTalks — full schema with RLS
-- Run this in the Supabase SQL editor BEFORE any app data operations.
-- Tables must be created in order (foreign key dependencies).

-- ─── communicators ────────────────────────────────────────────────────────────
-- The person using the AAC device. Owned by a parent/caregiver Clerk account.
CREATE TABLE IF NOT EXISTS communicators (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         text        NOT NULL,          -- Clerk user ID (auth.jwt()->>'sub')
  display_name     text        NOT NULL,
  age_group        text        NOT NULL CHECK (age_group IN ('child', 'adult', 'elderly')),
  primary_language text        NOT NULL DEFAULT 'en',
  secondary_language text,
  grid_size        text        NOT NULL DEFAULT '3x3' CHECK (grid_size IN ('2x3','3x3','3x4','4x4')),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE communicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communicator_owner_or_supervisor" ON communicators
  USING (
    owner_id = auth.jwt()->>'sub'
    OR id IN (
      SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
    )
  );

-- ─── supervisors ──────────────────────────────────────────────────────────────
-- Parents, SLPs, teachers who manage a communicator profile.
CREATE TABLE IF NOT EXISTS supervisors (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id  uuid        REFERENCES communicators(id) ON DELETE CASCADE,
  user_id          text        NOT NULL,           -- Clerk user ID
  role             text        NOT NULL CHECK (role IN ('parent', 'therapist', 'teacher')),
  can_edit         boolean     DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisor_self_or_owner" ON supervisors
  USING (
    user_id = auth.jwt()->>'sub'
    OR communicator_id IN (
      SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
    )
  );

-- ─── boards ───────────────────────────────────────────────────────────────────
-- OBF-compatible communication boards. Each communicator has one home board.
CREATE TABLE IF NOT EXISTS boards (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id  uuid        REFERENCES communicators(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  is_home          boolean     DEFAULT false,
  obf_json         jsonb       NOT NULL DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_owner_or_supervisor" ON boards
  USING (
    communicator_id IN (
      SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
      UNION
      SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
    )
  );

-- Auto-update updated_at on board changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── tiles ────────────────────────────────────────────────────────────────────
-- Individual communication buttons. Labels stored as multilingual JSON.
CREATE TABLE IF NOT EXISTS tiles (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id            uuid    REFERENCES boards(id) ON DELETE CASCADE,
  label_translations  jsonb   NOT NULL DEFAULT '{}',  -- {"en": "Water", "es": "Agua"}
  image_url           text,
  tts_cache_keys      jsonb   DEFAULT '{}',           -- {"en": "r2://hash.mp3"}
  row_index           int     NOT NULL,
  col_index           int     NOT NULL,
  link_board_id       uuid    REFERENCES boards(id),  -- opens a sub-board when tapped
  bg_color            text
);

ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tile_via_board" ON tiles
  USING (
    board_id IN (
      SELECT id FROM boards WHERE communicator_id IN (
        SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
        UNION
        SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
      )
    )
  );

-- ─── parental_consents ────────────────────────────────────────────────────────
-- COPPA: consent must be recorded before any child communicator data is saved.
CREATE TABLE IF NOT EXISTS parental_consents (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         text        NOT NULL,
  communicator_id  uuid        REFERENCES communicators(id) ON DELETE CASCADE,
  consent_version  text        NOT NULL,
  consented_at     timestamptz DEFAULT now(),
  ip_hash          text        -- hashed IP at consent time (no raw IPs stored)
);

ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_owner_only" ON parental_consents
  USING (owner_id = auth.jwt()->>'sub');

-- ─── tile_events ──────────────────────────────────────────────────────────────
-- Anonymized usage logs. Tile ID only — no raw text. COPPA-safe.
CREATE TABLE IF NOT EXISTS tile_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id  uuid        REFERENCES communicators(id) ON DELETE CASCADE,
  tile_id          uuid        REFERENCES tiles(id),
  language_used    text,
  event_at         timestamptz DEFAULT now()
);

ALTER TABLE tile_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_supervisor_access" ON tile_events
  USING (
    communicator_id IN (
      SELECT id FROM communicators WHERE owner_id = auth.jwt()->>'sub'
      UNION
      SELECT communicator_id FROM supervisors WHERE user_id = auth.jwt()->>'sub'
    )
  );

-- ─── subscriptions ────────────────────────────────────────────────────────────
-- Synced from RevenueCat webhooks. Source of truth for entitlement checks.
CREATE TABLE IF NOT EXISTS subscriptions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         text        NOT NULL UNIQUE,    -- Clerk user ID
  entitlement      text        NOT NULL DEFAULT 'free' CHECK (entitlement IN ('free','pro','org')),
  revenuecat_id    text,
  expires_at       timestamptz,
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_owner_only" ON subscriptions
  USING (owner_id = auth.jwt()->>'sub');

-- Verification: run this after applying schema to confirm all tables have RLS.
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
