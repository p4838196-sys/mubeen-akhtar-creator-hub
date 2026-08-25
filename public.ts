'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  contactFormSchema,
  reviewFormSchema,
  ratingSubmitSchema,
  likeSubmitSchema,
} from '@/lib/validation';

export type ActionResult = { success: boolean; message: string };

export async function submitContactMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    honeypot: formData.get('company'), // hidden field; real users leave blank
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }
  if (parsed.data.honeypot) {
    // Silently "succeed" for bots so they don't learn the honeypot was hit.
    return { success: true, message: 'Thanks! Your message has been sent.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    console.error('submitContactMessage error', error.message);
    return { success: false, message: 'Something went wrong sending your message. Please try again later.' };
  }

  return { success: true, message: "Thanks! Your message has been sent — I'll get back to you soon." };
}

export async function submitReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = reviewFormSchema.safeParse({
    display_name: formData.get('display_name'),
    message: formData.get('message'),
    stars: Number(formData.get('stars')),
    session_id: formData.get('session_id'),
    honeypot: formData.get('company'),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  }
  if (parsed.data.honeypot) {
    return { success: true, message: 'Thanks for your review!' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('reviews').insert({
    display_name: parsed.data.display_name,
    message: parsed.data.message,
    stars: parsed.data.stars,
    session_id: parsed.data.session_id,
    status: 'pending',
  });

  if (error) {
    console.error('submitReview error', error.message);
    return { success: false, message: 'Something went wrong submitting your review. Please try again.' };
  }

  revalidatePath('/reviews');
  return { success: true, message: 'Thanks! Your review has been submitted and will appear after approval.' };
}

export async function submitRating(input: unknown): Promise<{ success: boolean; message: string }> {
  const parsed = ratingSubmitSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: 'Invalid rating.' };

  const supabase = await createClient();
  const { error } = await supabase.from('ratings').upsert(
    {
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      stars: parsed.data.stars,
      session_id: parsed.data.session_id,
    },
    { onConflict: 'target_type,target_id,session_id' }
  );

  if (error) {
    console.error('submitRating error', error.message);
    return { success: false, message: 'Could not save your rating.' };
  }

  if (parsed.data.target_type === 'photo') revalidatePath('/photos');
  if (parsed.data.target_type === 'video') revalidatePath('/videos');
  return { success: true, message: 'Thanks for rating!' };
}

export async function submitLike(input: unknown): Promise<{ success: boolean; message: string; alreadyLiked?: boolean }> {
  const parsed = likeSubmitSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: 'Invalid request.' };

  const supabase = await createClient();
  const { error } = await supabase.from('content_likes').insert({
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    session_id: parsed.data.session_id,
  });

  if (error) {
    // Unique violation = already liked from this session; treat as a
    // non-error, idempotent outcome rather than surfacing a scary message.
    if (error.code === '23505') {
      return { success: true, message: 'Already liked', alreadyLiked: true };
    }
    console.error('submitLike error', error.message);
    return { success: false, message: 'Could not like this item.' };
  }

  return { success: true, message: 'Liked!' };
}
