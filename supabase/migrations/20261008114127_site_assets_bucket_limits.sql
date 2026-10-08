-- Restrict uploads to the public site-assets bucket (reports, program covers, site images).
-- Applies to NEW uploads only; existing objects are untouched. Writes are already admin-only via RLS.
-- post-media is intentionally unchanged (it hosts mp4 video).
-- Idempotent: safe to re-run.
update storage.buckets
set file_size_limit = 15728640,  -- 15 MB
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'image/svg+xml'
    ]
where id = 'site-assets';
