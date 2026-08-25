import { createClient } from '@/lib/supabase/server';
import { getPublicStorageUrl } from '@/lib/supabase/storage';
import type { Video } from '@/lib/types/database.types';

export interface VideoWithUrl extends Video {
  playback_url: string; // resolved storage URL OR external_url, whichever applies
}

const PAGE_SIZE = 12;

async function resolveVideoUrl(v: Video): Promise<string> {
  if (v.source_type === 'external') return v.external_url!;
  return getPublicStorageUrl('videos', v.storage_path!);
}

export async function getPublishedVideos(opts: { category?: string; page?: number } = {}): Promise<{
  videos: VideoWithUrl[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
}> {
  const supabase = await createClient();
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('videos').select('*', { count: 'exact' }).eq('is_published', true);
  if (opts.category) query = query.eq('category', opts.category);

  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getPublishedVideos error', error.message);
    return { videos: [], total: 0, page, pageSize: PAGE_SIZE, categories: [] };
  }

  const { data: allForCategories } = await supabase
    .from('videos')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null);

  const categories = Array.from(new Set((allForCategories ?? []).map((v) => v.category).filter(Boolean))) as string[];

  const videos = await Promise.all(
    (data ?? []).map(async (v) => ({ ...(v as Video), playback_url: await resolveVideoUrl(v as Video) }))
  );

  return { videos, total: count ?? 0, page, pageSize: PAGE_SIZE, categories };
}

export async function getFeaturedVideos(limit = 4): Promise<VideoWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getFeaturedVideos error', error.message);
    return [];
  }
  return Promise.all((data ?? []).map(async (v) => ({ ...(v as Video), playback_url: await resolveVideoUrl(v as Video) })));
}

export async function getVideoById(id: string): Promise<VideoWithUrl | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('videos').select('*').eq('id', id).eq('is_published', true).maybeSingle();
  if (error || !data) return null;
  return { ...(data as Video), playback_url: await resolveVideoUrl(data as Video) };
}
