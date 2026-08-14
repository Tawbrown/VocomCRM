import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for server-only routes (cron sync, webhook receiver) that need to
// write regardless of RLS. Never import this from client components or expose the key.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
