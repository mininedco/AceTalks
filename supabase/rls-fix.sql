-- AceTalks — RLS infinite recursion fix + security hardening
-- Run this in the Supabase SQL editor on an already-deployed database.
-- schema.sql is the canonical source; this file patches the live DB.
-- Safe to re-run — uses CREATE OR REPLACE and DROP POLICY IF EXISTS.
--
-- Fixes:
-- 1. RLS infinite recursion: communicators <-> supervisors circular policies
--    Fixed with SECURITY DEFINER helper functions (break the cycle)
-- 2. Security Advisor warnings:
--    - SET search_path = '' on all functions (prevents search_path injection)
--    - REVOKE EXECUTE on helpers from anon + authenticated (internal-only RPCs)
--    - SECURITY INVOKER on trigger function (correct for triggers)

-- ── Helper: does this user supervise this communicator? ──────────────────────
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
REVOKE EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) TO postgres;

-- ── Helper: all communicator IDs owned or supervised by a user ───────────────
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
REVOKE EXECUTE ON FUNCTION public.my_communicator_ids(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.my_communicator_ids(text) TO postgres;

-- ── Trigger function: pin search_path ────────────────────────────────────────
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

-- ── Rebuild communicators policy ─────────────────────────────────────────────
DROP POLICY IF EXISTS "communicator_owner_or_supervisor" ON communicators;
CREATE POLICY "communicator_owner_or_supervisor" ON communicators
  USING (
    owner_id = (auth.jwt()->>'sub')
    OR public.is_supervisor_of(id, (auth.jwt()->>'sub'))
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
    communicator_id IN (SELECT public.my_communicator_ids((auth.jwt()->>'sub')))
  );

-- ── Rebuild tiles policy ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tile_via_board" ON tiles;
CREATE POLICY "tile_via_board" ON tiles
  USING (
    board_id IN (
      SELECT id FROM boards
      WHERE communicator_id IN (SELECT public.my_communicator_ids((auth.jwt()->>'sub')))
    )
  );

-- ── Rebuild tile_events policy ────────────────────────────────────────────────
DROP POLICY IF EXISTS "event_supervisor_access" ON tile_events;
CREATE POLICY "event_supervisor_access" ON tile_events
  USING (
    communicator_id IN (SELECT public.my_communicator_ids((auth.jwt()->>'sub')))
  );

-- ── Verification ─────────────────────────────────────────────────────────────
-- Run these after applying to verify:
-- 1. SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--    All tables should show rowsecurity = true
-- 2. Anon REST query on /rest/v1/communicators should return [] not 500
-- 3. Security Advisor should show 0 warnings for is_supervisor_of and my_communicator_ids
