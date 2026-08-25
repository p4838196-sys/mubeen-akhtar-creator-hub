import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

/**
 * Server-side Supabase client for Server Components, Server Actions and
 * Route Handlers. Reads/writes the Supabase auth session via cookies, so
 * `auth.uid()` is available inside RLS policies (this is how `is_admin()`
 * in Postgres knows who's asking). Still uses the PUBLIC anon key — admin
 * privilege comes from the authenticated session + RLS, never from a
 * different key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component render — safe to ignore because
            // middleware.ts refreshes the session on every request instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}
