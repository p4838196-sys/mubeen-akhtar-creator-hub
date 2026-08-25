'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { albumSchema } from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

export async function upsertAlbum(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get('id');
  const parsed = albumSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') || null,
    display_order: formData.get('display_order') || 0,
    is_active: formData.get('is_active') === 'on',
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from('albums').update(parsed.data).eq('id', String(id))
    : await supabase.from('albums').insert(parsed.data);

  if (error) {
    const message = error.code === '23505' ? 'That slug is already in use.' : `Could not save: ${error.message}`;
    return { success: false, message };
  }

  revalidatePath('/admin/albums');
  revalidatePath('/photos');
  return { success: true, message: 'Album saved.' };
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) return { success: false, message: `Could not delete: ${error.message}` };
  revalidatePath('/admin/albums');
  revalidatePath('/photos');
  return { success: true, message: 'Deleted.' };
}
