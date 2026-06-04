import { createClient } from '@supabase/supabase-js'

// SHIELD: Server-side only. Never import this file in client code or Expo screens.
// SUPABASE_SERVICE_ROLE_KEY must never be in an EXPO_PUBLIC_ env var.
// This client bypasses RLS — ownership must be verified at the application layer.
export const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
