import { createClient } from '@/lib/supabase/server';
import { summarizeRatings } from '@/lib/utils/ratings';
import type { Review } from '@/lib/types/database.types';

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getApprovedReviews error', error.message);
    return [];
  }
  return data ?? [];
}

export async function getAudienceRatingSummary() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('reviews').select('stars').eq('status', 'approved');
  if (error) {
    console.error('getAudienceRatingSummary error', error.message);
    return { average: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  return summarizeRatings(data ?? []);
}

export async function getAllReviewsAdmin(): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('getAllReviewsAdmin error', error.message);
    return [];
  }
  return data ?? [];
}
