import { useAuth } from '@clerk/expo'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

// WHY: Supabase RLS checks auth.jwt()->>'sub' which must match the Clerk user ID.
// We create a Supabase client that injects a fresh Clerk JWT on every request.
// Prerequisite: a "supabase" JWT template must be configured in the Clerk dashboard
// (Settings → JWT Templates → New → Supabase). Map 'sub' to {{user.id}}.
export function useSupabaseWithAuth() {
  const { getToken } = useAuth()

  // WHY: Memoize so the client reference is stable across renders.
  // The fetch override fetches a fresh JWT per request — no stale tokens.
  return useMemo(
    () =>
      createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: async (url, options = {}) => {
              const token = await getToken({ template: 'supabase' })
              return fetch(url, {
                ...options,
                headers: {
                  ...(options.headers as Record<string, string>),
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              })
            },
          },
        }
      ),
    [getToken]
  )
}
