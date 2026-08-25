'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ReviewStatus } from '@/lib/types/database.types';

export type ActionResult = { success: boolean; message: string };

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
  if (error) return { success: false, message: `Could not update: ${error.message}` };
  revalidatePath('/admin/reviews');
  revalidatePath('/reviews');
  revalidatePath('/');
  return { success: true, message: `Review ${status}.` };
}

export async function setReviewFeatured(id: string, featured: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('reviews').update({ is_featured: featured }).eq('id', id);
  if (error) return { success: false, message: `Could not update: ${error.message}` };
  revalidatePath('/admin/reviews');
  revalidatePath('/reviews');
  return { success: true, message: featured ? 'Marked as featured.' : 'Unfeatured.' };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { success: false, message: `Could not delete: ${error.message}` };
  revalidatePath('/admin/reviews');
  revalidatePath('/reviews');
  return { success: true, message: 'Review deleted.' };
}
