-- Mirrors the migration recorded in the live database as 20261008114140 (site_assets_bucket_allow_svg).
-- The SVG allowance is also included in 20261008114127, so this is an idempotent no-op on a fresh
-- database and exists so local files match the remote migration history one-to-one.
update storage.buckets
set allowed_mime_types = array[
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'image/svg+xml'
    ]
where id = 'site-assets';
