-- Blog posts table + RLS + storage bucket for cover/inline images.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  subtitle        text,
  cover_image_url text,
  content_html    text not null default '',
  category        text,
  tags            text[] not null default '{}',
  status          text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  scheduled_for   timestamptz,
  reading_time    int,
  meta_title      text,
  meta_description text,
  author_id       uuid references auth.users(id) on delete set null,
  author_name     text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_author_idx on public.blog_posts (author_id);
create index if not exists blog_posts_category_idx on public.blog_posts (category);

-- updated_at trigger
create or replace function public.touch_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_blog_posts_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.blog_posts enable row level security;

-- Anyone (incl. anon) can read published posts.
drop policy if exists "blog_posts_read_published" on public.blog_posts;
create policy "blog_posts_read_published"
  on public.blog_posts for select
  using (status = 'published');

-- Admins can read every post (including drafts/scheduled).
drop policy if exists "blog_posts_read_admin" on public.blog_posts;
create policy "blog_posts_read_admin"
  on public.blog_posts for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Only admins can insert/update/delete.
drop policy if exists "blog_posts_write_admin" on public.blog_posts;
create policy "blog_posts_write_admin"
  on public.blog_posts for all
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for blog images (cover + inline)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public can read images from this bucket.
drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Only admins can upload / replace / delete.
drop policy if exists "blog_images_admin_write" on storage.objects;
create policy "blog_images_admin_write"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'blog-images'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'blog-images'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
