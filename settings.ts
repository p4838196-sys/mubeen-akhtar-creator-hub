import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/lib/types/database.types';

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('getSiteSettings error', error.message);
    return null;
  }
  return data;
}
