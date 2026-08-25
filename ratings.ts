import type { Rating, RatingSummary } from '@/lib/types/database.types';

export function summarizeRatings(ratings: Pick<Rating, 'stars'>[]): RatingSummary {
  const distribution: RatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    const key = r.stars as 1 | 2 | 3 | 4 | 5;
    if (key in distribution) distribution[key] += 1;
  }
  const count = ratings.length;
  const average = count === 0 ? null : ratings.reduce((sum, r) => sum + r.stars, 0) / count;
  return { average, count, distribution };
}
