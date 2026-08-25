import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

/**
 * SERVICE-ROLE client. This key bypasses Row Level Security entirely.
 *
 * The `server-only` import above makes any accidental import of this file
 * from a Client Component fail at BUILD time, not runtime — that's the
 * guardrail against ever shipping the service-role key to the browser.
 *
 * Phase 1 does not actually need this client anywhere: every admin
 * operation in Phase 1 (photo/video/social/review/settings CRUD) is done as
 * an authenticated admin user through the regular server client
 * (src/lib/supabase/server.ts), gated by the `is_admin()` RLS policies.
 * That is the correct and sufficient approach for Phase 1.
 *
 * This file exists purely so Phase 2/3 server-only jobs that must bypass
 * RLS (e.g. scheduled analytics rollups, batch moderation, an AI usage
 * ledger) have one centralized, safe place to get a privileged client
 * instead of individual routes reaching for the key ad hoc.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'createAdminClient() requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set on the server.'
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
