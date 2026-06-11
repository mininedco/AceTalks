-- AceTalks — Security Advisor fix v2 (2026-06-10)
-- Run this in the Supabase SQL editor.
--
-- Problem: CREATE OR REPLACE FUNCTION implicitly re-grants EXECUTE TO PUBLIC
-- on every run, so a REVOKE that follows it in the same script is overridden
-- by PostgreSQL's default grant. The fix is to REVOKE FROM PUBLIC (not just
-- from named roles) so the implicit grant is fully removed, then re-grant
-- only to postgres (the role the RLS policy engine runs as).
--
-- This script is idempotent — safe to run multiple times.

-- ── Recreate with hardened search_path ───────────────────────────────────────

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

-- ── Strip the implicit PUBLIC grant, then re-grant to postgres only ──────────
-- WHY: CREATE OR REPLACE always grants EXECUTE TO PUBLIC implicitly.
-- REVOKE FROM anon, authenticated alone is not enough — PUBLIC must be revoked
-- first, then only the roles that legitimately need EXECUTE get it back.
-- The policy engine runs as the postgres role, so that's the only grantee needed.

REVOKE EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_supervisor_of(uuid, text) TO postgres;

REVOKE EXECUTE ON FUNCTION public.my_communicator_ids(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.my_communicator_ids(text) TO postgres;

-- ── Verification ─────────────────────────────────────────────────────────────
-- After running, check privileges with:
-- SELECT grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_name IN ('is_supervisor_of', 'my_communicator_ids')
-- ORDER BY routine_name, grantee;
--
-- Expected result: only 'postgres' (or your project's owner role) listed.
-- anon and authenticated must NOT appear.
--
-- Then re-run the Security Advisor — the two anon/authenticated warnings
-- should be gone. The rls_auto_enable warning is Supabase-internal and
-- cannot be fixed by us.
