'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { siteProfileSchema, siteSettingsSchema } from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

export async function updateSiteProfile(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const interests = String(formData.get('interests') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = String(formData.get('skills') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = siteProfileSchema.safeParse({
    display_name: formData.get('display_name'),
    tagline: formData.get('tagline') || '',
    short_intro: formData.get('short_intro') || '',
    bio: formData.get('bio') || '',
    journey: formData.get('journey') || '',
    interests,
    skills,
    future_vision: formData.get('future_vision') || '',
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('site_profile').update(parsed.data).eq('id', id);
  if (error) return { success: false, message: `Could not save: ${error.message}` };

  revalidatePath('/admin/settings');
  revalidatePath('/about');
  revalidatePath('/');
  return { success: true, message: 'Profile updated.' };
}

/** Uploads a new avatar/hero image to the "avatars" bucket and updates site_profile. */
export async function uploadProfileImage(
  id: string,
  field: 'avatar_url' | 'hero_image_url',
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { success: false, message: 'Please choose an image.' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { success: false, message: 'Only JPEG, PNG or WebP images are allowed.' };
  }
  if (file.size > 5 * 1024 * 1024) return { success: false, message: 'Image is too large (max 5MB).' };

  const supabase = await createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${field}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
  if (uploadError) return { success: false, message: `Upload failed: ${uploadError.message}` };

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const { error: dbError } = await supabase.from('site_profile').update({ [field]: publicUrlData.publicUrl }).eq('id', id);
  if (dbError) return { success: false, message: `Could not save: ${dbError.message}` };

  revalidatePath('/admin/settings');
  revalidatePath('/about');
  revalidatePath('/');
  return { success: true, message: 'Image updated.' };
}

export async function updateSiteSettings(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = siteSettingsSchema.safeParse({
    site_title: formData.get('site_title'),
    site_description: formData.get('site_description'),
    contact_email: formData.get('contact_email') || null,
    reviews_require_review: formData.get('reviews_require_review') === 'on',
    ai_zone_enabled: formData.get('ai_zone_enabled') === 'on',
    maintenance_mode: formData.get('maintenance_mode') === 'on',
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('site_settings').update(parsed.data).eq('id', id);
  if (error) return { success: false, message: `Could not save: ${error.message}` };

  revalidatePath('/admin/settings');
  revalidatePath('/');
  revalidatePath('/ai-zone');
  return { success: true, message: 'Settings saved.' };
}
