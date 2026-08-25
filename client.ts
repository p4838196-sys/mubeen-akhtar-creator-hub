'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

/**
 * Browser-side Supabase client for use inside Client Components only.
 * Uses the PUBLIC anon key — this is safe by design: every table is
 * protected by Row Level Security policies (see supabase/schema.sql), so
 * the anon key alone grants no access beyond what RLS explicitly allows.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
