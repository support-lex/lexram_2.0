-- LexRam Network — fix RLS rejection inside trigger functions.
--
-- ROOT CAUSE: The original 20260516_network.sql created seven trigger
-- functions WITHOUT `SECURITY DEFINER`. That means they run with the calling
-- user's privileges, which forces their side-effects through row-level
-- security. The triggers all write rows on behalf of OTHER users (the
-- addressee of a connection, the author of a liked post, the participants
-- of a thread …) so RLS denies the side-effect and the entire transaction
-- rolls back with code 42501 ("row-level security policy violated").
--
-- That's why "Connect" / "Like" / "Comment" / "Send message" all return
-- 403 even though their own table policies allow the primary INSERT.
--
-- FIX: re-create every trigger function with SECURITY DEFINER so it runs
-- as the function owner (typically `postgres`) and bypasses RLS. The
-- function body is unchanged from 20260516_network.sql — only the
-- declaration has SECURITY DEFINER + an explicit search_path added.
--
-- Safe to run repeatedly (every statement uses CREATE OR REPLACE).

-- ─────────────────────────────────────────────────────────────────────────
-- Counter triggers — like / comment / repost counts on posts
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.bump_post_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if tg_table_name = 'network_post_likes' then
      update public.network_posts set likes_count = likes_count + 1 where id = new.post_id;
    elsif tg_table_name = 'network_post_comments' then
      update public.network_posts set comments_count = comments_count + 1 where id = new.post_id;
    elsif tg_table_name = 'network_post_reposts' then
      update public.network_posts set reposts_count = reposts_count + 1 where id = new.post_id;
    end if;
  elsif tg_op = 'DELETE' then
    if tg_table_name = 'network_post_likes' then
      update public.network_posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    elsif tg_table_name = 'network_post_comments' then
      update public.network_posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    elsif tg_table_name = 'network_post_reposts' then
      update public.network_posts set reposts_count = greatest(0, reposts_count - 1) where id = old.post_id;
    end if;
  end if;
  return null;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Counter trigger — applicants count on jobs
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.bump_job_applicants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.network_jobs set applicants_count = applicants_count + 1 where id = new.job_id;
  elsif tg_op = 'DELETE' then
    update public.network_jobs set applicants_count = greatest(0, applicants_count - 1) where id = old.job_id;
  end if;
  return null;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Thread bump — update last_message_at on a new message
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.touch_thread_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.network_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Notification fan-out triggers
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.notify_connection_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (new.addressee_id, new.requester_id, 'connection_request', jsonb_build_object('connection_id', new.id));
  end if;
  return new;
end;
$$;

create or replace function public.notify_connection_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (new.requester_id, new.addressee_id, 'connection_accepted', jsonb_build_object('connection_id', new.id));
  end if;
  return new;
end;
$$;

create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
begin
  select author_id into author from public.network_posts where id = new.post_id;
  if author is not null and author <> new.user_id then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (author, new.user_id, 'post_like', jsonb_build_object('post_id', new.post_id));
  end if;
  return new;
end;
$$;

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
begin
  select author_id into author from public.network_posts where id = new.post_id;
  if author is not null and author <> new.author_id then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (author, new.author_id, 'post_comment', jsonb_build_object('post_id', new.post_id, 'comment_id', new.id));
  end if;
  return new;
end;
$$;
