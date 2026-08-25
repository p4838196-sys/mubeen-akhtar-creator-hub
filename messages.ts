import { createClient } from '@/lib/supabase/server';
import type { ContactMessage } from '@/lib/types/database.types';

export async function getAllContactMessagesAdmin(): Promise<ContactMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('getAllContactMessagesAdmin error', error.message);
    return [];
  }
  return data ?? [];
}
