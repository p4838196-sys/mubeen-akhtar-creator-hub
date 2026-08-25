'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { videoMetaSchema } from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB cap — beyond this, use an external link instead
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function buildMeta(formData: FormData) {
  const sourceType = formData.get('source_type');
  return videoMetaSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    category: formData.get('category') || null,
    source_type: sourceType,
    external_url: sourceType === 'external' ? formData.get('external_url') || null : null,
    thumbnail_url: formData.get('thumbnail_url') || null,
    is_featured: formData.get('is_featured') === 'on',
    is_published: formData.get('is_published') === 'on',
    display_order: formData.get('display_order') || 0,
  });
}

export async function createVideo(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = buildMeta(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();

  if (parsed.data.source_type === 'storage') {
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: 'Please choose a video file, or switch to an external link.' };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, message: 'Only MP4, WebM or MOV videos are allowed.' };
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return {
        success: false,
        message: 'Video is too large for direct hosting (max 200MB). Consider using an external video link instead.',
      };
    }

    const ext = file.name.split('.').pop() || 'mp4';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
    if (uploadError) return { success: false, message: `Upload failed: ${uploadError.message}` };

    const { error: insertError } = await supabase.from('videos').insert({ ...parsed.data, storage_path: path });
    if (insertError) {
      await supabase.storage.from('videos').remove([path]);
      return { success: false, message: `Could not save video: ${insertError.message}` };
    }
  } else {
    const { error: insertError } = await supabase.from('videos').insert({ ...parsed.data, storage_path: null });
    if (insertError) return { success: false, message: `Could not save video: ${insertError.message}` };
  }

  revalidatePath('/admin/videos');
  revalidatePath('/videos');
  revalidatePath('/');
  return { success: true, message: 'Video saved.' };
}

export async function updateVideoMeta(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = buildMeta(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('videos').update(parsed.data).eq('id', id);
  if (error) return { success: false, message: `Could not save: ${error.message}` };

  revalidatePath('/admin/videos');
  revalidatePath('/videos');
  return { success: true, message: 'Video updated.' };
}

export async function deleteVideo(id: string, storagePath: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: dbError } = await supabase.from('videos').delete().eq('id', id);
  if (dbError) return { success: false, message: `Could not delete: ${dbError.message}` };

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from('videos').remove([storagePath]);
    if (storageError) console.error('video storage delete error', storageError.message);
  }

  revalidatePath('/admin/videos');
  revalidatePath('/videos');
  return { success: true, message: 'Video deleted.' };
}
