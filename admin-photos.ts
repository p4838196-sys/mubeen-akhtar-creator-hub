'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { photoMetaSchema } from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB — keeps Phase 1 storage costs low
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads a new photo: file goes to Supabase Storage (bucket "photos"),
 * metadata row goes to the `photos` table. Runs as the logged-in admin's
 * session — storage + table RLS policies enforce is_admin(), so this
 * action fails safely for anyone who isn't authorized, even if somehow
 * invoked directly.
 */
export async function createPhoto(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Please choose an image file.' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, message: 'Only JPEG, PNG or WebP images are allowed.' };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { success: false, message: 'Image is too large (max 8MB). Please compress it first.' };
  }

  const parsed = photoMetaSchema.safeParse({
    album_id: formData.get('album_id') || null,
    title: formData.get('title'),
    description: formData.get('description') || null,
    is_featured: formData.get('is_featured') === 'on',
    is_published: formData.get('is_published') === 'on',
    display_order: formData.get('display_order') || 0,
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('photos').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000', // 1 year — filenames are content-addressed (random), safe to cache hard
  });
  if (uploadError) {
    console.error('photo upload error', uploadError.message);
    return { success: false, message: `Upload failed: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from('photos').insert({ ...parsed.data, storage_path: path });
  if (insertError) {
    await supabase.storage.from('photos').remove([path]); // roll back the orphaned file
    console.error('photo insert error', insertError.message);
    return { success: false, message: `Could not save photo: ${insertError.message}` };
  }

  revalidatePath('/admin/photos');
  revalidatePath('/photos');
  revalidatePath('/');
  return { success: true, message: 'Photo uploaded.' };
}

export async function updatePhotoMeta(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = photoMetaSchema.safeParse({
    album_id: formData.get('album_id') || null,
    title: formData.get('title'),
    description: formData.get('description') || null,
    is_featured: formData.get('is_featured') === 'on',
    is_published: formData.get('is_published') === 'on',
    display_order: formData.get('display_order') || 0,
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('photos').update(parsed.data).eq('id', id);
  if (error) return { success: false, message: `Could not save: ${error.message}` };

  revalidatePath('/admin/photos');
  revalidatePath('/photos');
  return { success: true, message: 'Photo updated.' };
}

export async function deletePhoto(id: string, storagePath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: dbError } = await supabase.from('photos').delete().eq('id', id);
  if (dbError) return { success: false, message: `Could not delete: ${dbError.message}` };

  const { error: storageError } = await supabase.storage.from('photos').remove([storagePath]);
  if (storageError) {
    console.error('photo storage delete error', storageError.message);
    // DB row is already gone; surface a soft warning rather than blocking.
    revalidatePath('/admin/photos');
    revalidatePath('/photos');
    return { success: true, message: 'Photo deleted (storage file cleanup may need a manual check).' };
  }

  revalidatePath('/admin/photos');
  revalidatePath('/photos');
  return { success: true, message: 'Photo deleted.' };
}
