import { supabase } from '../lib/supabaseClient';

export type Bucket = 'site-assets' | 'post-media';

/**
 * Uploads a file to the given public bucket under a random name (so
 * concurrent uploads never collide) and returns its public URL.
 * RLS on storage.objects requires the caller to be a signed-in admin
 * (see is_admin() policies) — this will throw for anyone else.
 */
export async function uploadToBucket(bucket: Bucket, file: File, folder?: string): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${folder ? `${folder}/` : ''}${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
