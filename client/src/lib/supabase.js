/**
 * Supabase client for auth and optional data.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env (from Supabase → Settings → API).
 */
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  supabaseInstance = createClient(url, anonKey);
  return supabaseInstance;
}
