import { createClient } from '@/lib/supabase/server';
import type { SiteProfile } from '@/lib/types/database.types';

export async function getSiteProfile(): Promise<SiteProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('site_profile').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('getSiteProfile error', error.message);
    return null;
  }
  return data;
}
