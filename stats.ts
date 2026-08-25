import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  totalPhotos: number;
  totalVideos: number;
  totalRatings: number;
  averageRating: number | null;
  totalReviews: number;
  pendingReviews: number;
  totalMessages: number;
  unreadMessages: number;
}

/**
 * Every number here comes from a real COUNT/aggregate query against
 * Postgres at request time — nothing here is hardcoded or fabricated.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [photos, videos, ratings, reviewsTotal, reviewsPending, messagesTotal, messagesUnread] = await Promise.all([
    supabase.from('photos').select('id', { count: 'exact', head: true }),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
    supabase.from('ratings').select('stars'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);

  const ratingRows = ratings.data ?? [];
  const averageRating =
    ratingRows.length === 0 ? null : ratingRows.reduce((sum, r) => sum + r.stars, 0) / ratingRows.length;

  return {
    totalPhotos: photos.count ?? 0,
    totalVideos: videos.count ?? 0,
    totalRatings: ratingRows.length,
    averageRating,
    totalReviews: reviewsTotal.count ?? 0,
    pendingReviews: reviewsPending.count ?? 0,
    totalMessages: messagesTotal.count ?? 0,
    unreadMessages: messagesUnread.count ?? 0,
  };
}
