-- AceTalks — RLS infinite recursion fix
-- Problem: communicators policy subqueries supervisors, and supervisors policy
--          subqueries communicators. PostgreSQL detects this as infinite recursion.
-- Fix: SECURITY DEFINER functions bypass RLS for internal lookups, breaking the cycle.
--
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- Safe to re-run — uses CREATE OR REPLACE and DROP POLICY IF EXISTS.

-- ── Helper: does this user supervise this communicator? ──────────────────────
-- SECURITY DEFINER = runs as the function owner (postgres), bypassing RLS.
-- This is the standard Supabase pattern for breaking policy recursion.
CREATE OR REPLACE FUNCTION is_supervisor_of(p_communicator_id uuid, p_user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM supervisors
    WHERE communicator_id = p_communicator_id
      AND user_id = p_user_id
  );
$$;

-- ── Helper: get all communicator IDs owned or supervised by a user ───────────
CREATE OR REPLACE FUNCTION my_communicator_ids(p_user_id text)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM communicators WHERE owner_id = p_user_id
  UNION
  SELECT communicator_id FROM supervisors WHERE user_id = p_user_id;
$$;

-- ── Rebuild communicators policy ─────────────────────────────────────────────
DROP POLICY IF EXISTS "communicator_owner_or_supervisor" ON communicators;
CREATE POLICY "communicator_owner_or_supervisor" ON communicators
  USING (
    owner_id = (auth.jwt()->>'sub')
    OR is_supervisor_of(id, (auth.jwt()->>'sub'))
  );

-- ── Rebuild supervisors policy ────────────────────────────────────────────────
DROP POLICY IF EXISTS "supervisor_self_or_owner" ON supervisors;
CREATE POLICY "supervisor_self_or_owner" ON supervisors
  USING (
    user_id = (auth.jwt()->>'sub')
    OR communicator_id IN (
      SELECT id FROM communicators WHERE owner_id = (auth.jwt()->>'sub')
    )
  );

-- ── Rebuild boards policy ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "board_owner_or_supervisor" ON boards;
CREATE POLICY "board_owner_or_supervisor" ON boards
  USING (
    communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
  );

-- ── Rebuild tiles policy ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tile_via_board" ON tiles;
CREATE POLICY "tile_via_board" ON tiles
  USING (
    board_id IN (
      SELECT id FROM boards
      WHERE communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
    )
  );

-- ── Rebuild tile_events policy ────────────────────────────────────────────────
DROP POLICY IF EXISTS "event_supervisor_access" ON tile_events;
CREATE POLICY "event_supervisor_access" ON tile_events
  USING (
    communicator_id IN (SELECT my_communicator_ids((auth.jwt()->>'sub')))
  );

-- ── Verification ─────────────────────────────────────────────────────────────
-- After running, verify with:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Then test anon query returns 0 rows (not 500) for communicators.
