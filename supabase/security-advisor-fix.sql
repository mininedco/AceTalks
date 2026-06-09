-- AceTalks — Supabase Security Advisor fixes (2026-06-09)
-- Run this in the Supabase SQL editor.
-- Addresses all WARN-level findings from the security linter.
--
-- Fixes applied:
-- 1. REVOKE EXECUTE on helper functions from anon + authenticated roles
--    (they are internal policy helpers, not public RPC endpoints)
-- 2. SET search_path = '' on all three public functions
--    (prevents search_path injection attacks on SECURITY DEFINER functions)
-- Note: rls_auto_enable is a Supabase-managed internal function — do not touch it.

-- ── 1. Harden is_supervisor_of ────────────────────────────────────────────────
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

-- Revoke public execute — this function must only be called by the policy engine,
-- never directly via the REST API (/rest/v1/rpc/is_supervisor_of).
REVOKE EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) FROM anon, authenticated;

-- ── 2. Harden my_communicator_ids ────────────────────────────────────────────
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

-- ── 3. Harden update_updated_at (trigger function) ───────────────────────────
-- This is a SECURITY INVOKER trigger — no REVOKE needed, but search_path must
-- be pinned to prevent schema injection if the search_path is ever altered.
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
-- Trigger function — no REVOKE needed (triggers are not callable via REST API).

-- ── Verification ─────────────────────────────────────────────────────────────
-- After running, the Security Advisor should show 0 warnings for these functions.
-- Confirm RLS still works by querying /rest/v1/communicators with a valid Clerk JWT
-- — should return your rows. Anon query should return [].
