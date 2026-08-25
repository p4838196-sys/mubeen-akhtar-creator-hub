import { createClient } from '@/lib/supabase/server';
import type { SocialAccount } from '@/lib/types/database.types';

export async function getActiveSocialAccounts(): Promise<SocialAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('getActiveSocialAccounts error', error.message);
    return [];
  }
  return data ?? [];
}

export async function getAllSocialAccountsAdmin(): Promise<SocialAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) {
    console.error('getAllSocialAccountsAdmin error', error.message);
    return [];
  }
  return data ?? [];
}
