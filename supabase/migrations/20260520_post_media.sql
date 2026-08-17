-- LexRam Network: post media (photo / video) + article title.
-- Apply via Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. NEW COLUMNS on network_posts
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.network_posts add column if not exists media_url  text;
alter table public.network_posts add column if not exists media_type text check (media_type in ('image', 'video'));
alter table public.network_posts add column if not exists title      text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. STORAGE BUCKET for post media (photos + videos)
-- Public read so the feed can render images/videos directly; owner-only write
-- scoped by the leading folder == auth.uid().
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('network-post-media', 'network-post-media', true)
on conflict (id) do nothing;

drop policy if exists "network_post_media_public_read" on storage.objects;
create policy "network_post_media_public_read" on storage.objects for select
  using (bucket_id = 'network-post-media');

drop policy if exists "network_post_media_owner_write" on storage.objects;
create policy "network_post_media_owner_write" on storage.objects for all
  to authenticated
  using (bucket_id = 'network-post-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'network-post-media' and (storage.foldername(name))[1] = auth.uid()::text);
