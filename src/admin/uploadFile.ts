import { supabase } from '../lib/supabaseClient';

export type Bucket = 'site-assets' | 'post-media';

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * "Failed to fetch" from supabase-js on a real device almost always means
 * the request never completed a round trip — a dropped mobile connection,
 * a stalled cell handoff, a flaky wifi hop — not a server-side rejection
 * (those come back as a normal HTTP error with a status code and message
 * instead). Those transient failures are exactly what a retry fixes; a
 * genuine rejection (bad RLS, wrong bucket, oversized file) will fail the
 * same way every time and isn't worth retrying, so we only retry on the
 * network-shaped failure and surface everything else immediately.
 */
function isRetryableNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /fetch/i.test(error.message);
}

/**
 * Turns a raw thrown error into something an admin filling out a form
 * can actually act on. A retried-out network failure gets a message
 * pointing at the connection, since that's what it almost always is;
 * anything else (an RLS rejection, a Postgres constraint, etc.) keeps
 * its own message since that's already specific and actionable.
 */
export function describeUploadError(error: unknown): string {
  if (isRetryableNetworkError(error)) {
    return 'Upload failed after several attempts — your connection may be too weak or unstable right now. Try again on a stronger connection.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

/**
 * Uploads a file to the given public bucket under a random name (so
 * concurrent uploads never collide) and returns its public URL.
 * RLS on storage.objects requires the caller to be a signed-in admin
 * (see is_admin() policies) — this will throw for anyone else.
 *
 * Retries up to MAX_ATTEMPTS times with exponential backoff (1s, 2s,
 * 4s) on transient network failures, so a single dropped packet on a
 * weak connection doesn't force the admin to redo the whole form.
 */
export async function uploadToBucket(bucket: Bucket, file: File, folder?: string): Promise<string> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${folder ? `${folder}/` : ''}${crypto.randomUUID()}.${ext}`;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      if (isLastAttempt || !isRetryableNetworkError(err)) throw err;
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  // Unreachable (the loop always returns or throws), but keeps TypeScript happy.
  throw lastError;
}
