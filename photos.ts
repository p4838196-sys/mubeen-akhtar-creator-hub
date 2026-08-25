import { createClient } from '@/lib/supabase/server';
import { getPublicStorageUrl } from '@/lib/supabase/storage';
import type { Album, Photo } from '@/lib/types/database.types';

export interface PhotoWithUrl extends Photo {
  url: string;
  album: Pick<Album, 'id' | 'title' | 'slug'> | null;
}

const PAGE_SIZE = 24;

export async function getActiveAlbums(): Promise<Album[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('getActiveAlbums error', error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublishedPhotos(opts: { albumSlug?: string; page?: number } = {}): Promise<{
  photos: PhotoWithUrl[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('photos')
    .select('*, album:albums(id, title, slug)', { count: 'exact' })
    .eq('is_published', true);

  if (opts.albumSlug) {
    const { data: album } = await supabase.from('albums').select('id').eq('slug', opts.albumSlug).maybeSingle();
    if (album) query = query.eq('album_id', album.id);
    else return { photos: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  const { data, error, count } = await query
    .order('is_featured', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getPublishedPhotos error', error.message);
    return { photos: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  const photos = await Promise.all(
    (data ?? []).map(async (p) => ({
      ...(p as unknown as Photo & { album: Album | null }),
      url: await getPublicStorageUrl('photos', (p as unknown as Photo).storage_path),
    }))
  );

  return { photos, total: count ?? 0, page, pageSize: PAGE_SIZE };
}

export async function getFeaturedPhotos(limit = 6): Promise<PhotoWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*, album:albums(id, title, slug)')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getFeaturedPhotos error', error.message);
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (p) => ({
      ...(p as unknown as Photo & { album: Album | null }),
      url: await getPublicStorageUrl('photos', (p as unknown as Photo).storage_path),
    }))
  );
}

