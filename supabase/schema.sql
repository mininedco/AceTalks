-- AceTalks — full schema with RLS
-- Run this in the Supabase SQL editor BEFORE any app data operations.
-- Tables must be created in order (foreign key dependencies).
-- If re-running: all CREATE TABLE statements use IF NOT EXISTS; policies use
-- DROP POLICY IF EXISTS before re-creating so this file is idempotent.

-- ─── RLS helper functions (SECURITY DEFINER) ─────────────────────────────────
-- WHY: communicators ↔ supervisors policies have a circular subquery dependency.
-- PostgreSQL detects this as infinite recursion (error 42P17).
-- SECURITY DEFINER functions run as the function owner (postgres), bypassing RLS
-- for the internal lookup only — breaking the cycle. This is the standard
-- Supabase pattern for cross-table RLS without recursion.

CREATE OR REPLACE FUNCTION public.is_supervisor_of(p_communicator_id uuid, p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.supervisors
    WHERE communicator_id = p_communicator_id
      AND user_id = p_user_id
  );
$$;
-- WHY: REVOKE prevents anon/authenticated from calling this via /rpc/ — it is an
-- internal policy helper only. EXECUTE is still granted to postgres (function owner).
REVOKE EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_communicator_ids(p_user_id text)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT id FROM public.communicators WHERE owner_id = p_user_id
  UNION
  SELECT communicator_id FROM public.supervisors WHERE user_id = p_user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.my_communicator_ids(text) FROM anon, authenticated;

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

DROP POLICY IF EXISTS "communicator_owner_or_supervisor" ON communicators;
CREATE POLICY "communicator_owner_or_supervisor" ON communicators
  USING (
    owner_id = (auth.jwt()->>'sub')
    OR is_supervisor_of(id, (auth.jwt()->>'sub'))
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

DROP POLICY IF EXISTS "supervisor_self_or_owner" ON supervisors;
CREATE POLICY "supervisor_self_or_owner" ON supervisors
  USING (
    user_id = (auth.jwt()->>'sub')
    OR communicator_id IN (
      SELECT id FROM communicators WHERE owner_id = (auth.jwt()->>'sub')
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

DROP POLICY IF EXISTS "board_owner_or_supervisor" ON boards;
CREATE POLICY "board_owner_or_supervisor" ON boards
  USING (
    communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
  );

-- Auto-update updated_at on board changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS boards_updated_at ON boards;
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
  bg_color            text,
  masked              boolean DEFAULT false           -- ACET-029: hide without shifting grid
);

ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tile_via_board" ON tiles;
CREATE POLICY "tile_via_board" ON tiles
  USING (
    board_id IN (
      SELECT id FROM boards
      WHERE communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
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

DROP POLICY IF EXISTS "consent_owner_only" ON parental_consents;
CREATE POLICY "consent_owner_only" ON parental_consents
  USING (owner_id = (auth.jwt()->>'sub'));

-- ─── tile_events ──────────────────────────────────────────────────────────────
-- Anonymized usage logs. Tile ID only — no raw text. COPPA-safe.
-- ADR-011: label text must never be stored here.
CREATE TABLE IF NOT EXISTS tile_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  communicator_id  uuid        REFERENCES communicators(id) ON DELETE CASCADE,
  tile_id          uuid        REFERENCES tiles(id),
  language_used    text,
  event_at         timestamptz DEFAULT now()
);

ALTER TABLE tile_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_supervisor_access" ON tile_events;
CREATE POLICY "event_supervisor_access" ON tile_events
  USING (
    communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
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

DROP POLICY IF EXISTS "subscription_owner_only" ON subscriptions;
CREATE POLICY "subscription_owner_only" ON subscriptions
  USING (owner_id = (auth.jwt()->>'sub'));

-- ─── Verification ─────────────────────────────────────────────────────────────
-- Run after applying to confirm all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Test anon access returns [] not 500:
-- (Run via REST with anon key — communicators should return empty array, not error)
