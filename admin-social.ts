'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { socialAccountSchema } from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

export async function upsertSocialAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get('id');
  const parsed = socialAccountSchema.safeParse({
    platform: formData.get('platform'),
    username: formData.get('username'),
    profile_url: formData.get('profile_url'),
    follower_count: formData.get('follower_count') || null,
    display_order: formData.get('display_order') || 0,
    is_active: formData.get('is_active') === 'on',
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from('social_accounts').update(parsed.data).eq('id', String(id))
    : await supabase.from('social_accounts').insert(parsed.data);

  if (error) {
    // RLS will reject this with a permissions error if the caller isn't an
    // admin — surfaced here rather than silently failing.
    console.error('upsertSocialAccount error', error.message);
    return { success: false, message: `Could not save: ${error.message}` };
  }

  revalidatePath('/admin/social');
  revalidatePath('/social');
  revalidatePath('/');
  return { success: true, message: 'Social account saved.' };
}

export async function deleteSocialAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('social_accounts').delete().eq('id', id);
  if (error) return { success: false, message: `Could not delete: ${error.message}` };
  revalidatePath('/admin/social');
  revalidatePath('/social');
  return { success: true, message: 'Deleted.' };
}
