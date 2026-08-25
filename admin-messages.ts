'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ContactStatus } from '@/lib/types/database.types';

export type ActionResult = { success: boolean; message: string };

export async function setMessageStatus(id: string, status: ContactStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
  if (error) return { success: false, message: `Could not update: ${error.message}` };
  revalidatePath('/admin/messages');
  return { success: true, message: 'Updated.' };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) return { success: false, message: `Could not delete: ${error.message}` };
  revalidatePath('/admin/messages');
  return { success: true, message: 'Deleted.' };
}
