import { createClient } from '@/lib/supabase/server';

/**
 * Resolves a storage_path (e.g. "1699999999-sunset.jpg") saved in the DB
 * into a public, CDN-served URL. Buckets are public-read (see
 * storage_policies.sql), so this is a cheap URL construction, not a signed
 * URL / extra network call — safe to call for every photo/video in a list.
 */
export async function getPublicStorageUrl(bucket: 'photos' | 'videos' | 'avatars', path: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
