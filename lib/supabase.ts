import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// WHY: Anon key only — safe for the client bundle.
// Authenticated queries use useSupabaseWithAuth() which injects the Clerk JWT.
// The service role key lives in server/lib/supabase-admin.ts only.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
