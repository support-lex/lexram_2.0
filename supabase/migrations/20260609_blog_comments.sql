-- Blog comments table + RLS.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.blog_comments (
  id           uuid primary key default gen_random_uuid(),
  post_slug    text not null,
  author_name  text not null,
  author_email text,
  content      text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now()
);

create index if not exists blog_comments_slug_idx
  on public.blog_comments (post_slug, status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.blog_comments enable row level security;

-- Anyone can read approved comments.
drop policy if exists "blog_comments_read_approved" on public.blog_comments;
create policy "blog_comments_read_approved"
  on public.blog_comments for select
  using (status = 'approved');

-- Admins can read every comment (including pending / rejected).
drop policy if exists "blog_comments_read_admin" on public.blog_comments;
create policy "blog_comments_read_admin"
  on public.blog_comments for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Anyone (anon) can submit a new comment — only allowed with status = 'pending'.
drop policy if exists "blog_comments_insert_anon" on public.blog_comments;
create policy "blog_comments_insert_anon"
  on public.blog_comments for insert
  with check (status = 'pending');

-- Only admins can approve / reject / delete.
drop policy if exists "blog_comments_moderate_admin" on public.blog_comments;
create policy "blog_comments_moderate_admin"
  on public.blog_comments for all
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');