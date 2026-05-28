-- Adds a view counter to published blog posts.
-- Apply via Supabase SQL Editor.

alter table public.blog_posts
  add column if not exists view_count int not null default 0;

-- Allow anon/authenticated to bump the counter on a published post via RPC,
-- without granting them broader UPDATE privileges (RLS still blocks direct UPDATE).
create or replace function public.increment_blog_view(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts
  set view_count = view_count + 1
  where slug = p_slug
    and status = 'published';
$$;

revoke all on function public.increment_blog_view(text) from public;
grant execute on function public.increment_blog_view(text) to anon, authenticated;
