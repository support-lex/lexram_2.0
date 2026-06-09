-- LexRam Network — idempotent re-sync of all network_* RLS policies.
--
-- The original 20260516_network.sql had an ordering bug (network_notifications
-- was added to the supabase_realtime publication BEFORE the table was created),
-- which caused that file to error mid-run on some applications. When that
-- happens, every statement AFTER the failure is skipped — including the
-- entire ROW LEVEL SECURITY block at the bottom of the file. The result:
-- RLS may be enabled on the tables but the policies don't exist, so every
-- query returns 403 Forbidden.
--
-- This file just re-applies the RLS block in full. Every statement is
-- `drop policy if exists` followed by `create policy` so it's safe to run
-- repeatedly — running it more than once is a no-op.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Ensure RLS is enabled on every network_* table
-- ─────────────────────────────────────────────────────────────────────────
alter table public.network_profiles enable row level security;
alter table public.network_profile_experiences enable row level security;
alter table public.network_profile_educations enable row level security;
alter table public.network_connections enable row level security;
alter table public.network_posts enable row level security;
alter table public.network_post_likes enable row level security;
alter table public.network_post_comments enable row level security;
alter table public.network_post_reposts enable row level security;
alter table public.network_jobs enable row level security;
alter table public.network_job_applications enable row level security;
alter table public.network_saved_jobs enable row level security;
alter table public.network_threads enable row level security;
alter table public.network_thread_participants enable row level security;
alter table public.network_messages enable row level security;
alter table public.network_notifications enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "profiles_read_all" on public.network_profiles;
create policy "profiles_read_all" on public.network_profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.network_profiles;
create policy "profiles_insert_self" on public.network_profiles for insert
  to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.network_profiles;
create policy "profiles_update_self" on public.network_profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "exp_read_all" on public.network_profile_experiences;
create policy "exp_read_all" on public.network_profile_experiences for select using (true);
drop policy if exists "exp_write_self" on public.network_profile_experiences;
create policy "exp_write_self" on public.network_profile_experiences for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "edu_read_all" on public.network_profile_educations;
create policy "edu_read_all" on public.network_profile_educations for select using (true);
drop policy if exists "edu_write_self" on public.network_profile_educations;
create policy "edu_write_self" on public.network_profile_educations for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CONNECTIONS  ← this is the one that's 403-ing on Connect right now
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "connections_read_involved" on public.network_connections;
create policy "connections_read_involved" on public.network_connections for select
  to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "connections_insert_requester" on public.network_connections;
create policy "connections_insert_requester" on public.network_connections for insert
  to authenticated with check (requester_id = auth.uid());

drop policy if exists "connections_update_addressee" on public.network_connections;
create policy "connections_update_addressee" on public.network_connections for update
  to authenticated using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());

drop policy if exists "connections_delete_either" on public.network_connections;
create policy "connections_delete_either" on public.network_connections for delete
  to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 4. FEED — posts, likes, comments, reposts
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "posts_read_all" on public.network_posts;
create policy "posts_read_all" on public.network_posts for select using (true);

drop policy if exists "posts_insert_self" on public.network_posts;
create policy "posts_insert_self" on public.network_posts for insert
  to authenticated with check (author_id = auth.uid());

drop policy if exists "posts_update_self" on public.network_posts;
create policy "posts_update_self" on public.network_posts for update
  to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "posts_delete_self" on public.network_posts;
create policy "posts_delete_self" on public.network_posts for delete
  to authenticated using (author_id = auth.uid());

drop policy if exists "likes_read_all" on public.network_post_likes;
create policy "likes_read_all" on public.network_post_likes for select using (true);
drop policy if exists "likes_write_self" on public.network_post_likes;
create policy "likes_write_self" on public.network_post_likes for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "comments_read_all" on public.network_post_comments;
create policy "comments_read_all" on public.network_post_comments for select using (true);
drop policy if exists "comments_write_self" on public.network_post_comments;
create policy "comments_write_self" on public.network_post_comments for all
  to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "reposts_read_all" on public.network_post_reposts;
create policy "reposts_read_all" on public.network_post_reposts for select using (true);
drop policy if exists "reposts_write_self" on public.network_post_reposts;
create policy "reposts_write_self" on public.network_post_reposts for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 5. JOBS
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "jobs_read_all" on public.network_jobs;
create policy "jobs_read_all" on public.network_jobs for select using (true);

drop policy if exists "jobs_insert_self" on public.network_jobs;
create policy "jobs_insert_self" on public.network_jobs for insert
  to authenticated with check (posted_by = auth.uid());

drop policy if exists "jobs_update_self" on public.network_jobs;
create policy "jobs_update_self" on public.network_jobs for update
  to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());

drop policy if exists "jobs_delete_self" on public.network_jobs;
create policy "jobs_delete_self" on public.network_jobs for delete
  to authenticated using (posted_by = auth.uid());

drop policy if exists "apps_read_involved" on public.network_job_applications;
create policy "apps_read_involved" on public.network_job_applications for select
  to authenticated using (
    applicant_id = auth.uid()
    or exists (select 1 from public.network_jobs j where j.id = job_id and j.posted_by = auth.uid())
  );
drop policy if exists "apps_insert_self" on public.network_job_applications;
create policy "apps_insert_self" on public.network_job_applications for insert
  to authenticated with check (applicant_id = auth.uid());
drop policy if exists "apps_update_poster" on public.network_job_applications;
create policy "apps_update_poster" on public.network_job_applications for update
  to authenticated using (
    exists (select 1 from public.network_jobs j where j.id = job_id and j.posted_by = auth.uid())
  );

drop policy if exists "saved_jobs_self" on public.network_saved_jobs;
create policy "saved_jobs_self" on public.network_saved_jobs for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 6. MESSAGING — use the SECURITY DEFINER helper from 20260520_fix_thread_rls.sql
--    to avoid the RLS recursion bug. If you haven't applied that migration
--    yet, run it before this one (it creates the user_is_in_thread function).
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "tp_read_participant" on public.network_thread_participants;
create policy "tp_read_participant" on public.network_thread_participants for select
  to authenticated using (
    user_id = auth.uid() or public.user_is_in_thread(thread_id)
  );

drop policy if exists "tp_insert_self_or_creator" on public.network_thread_participants;
create policy "tp_insert_self_or_creator" on public.network_thread_participants for insert
  to authenticated with check (true);

drop policy if exists "tp_update_self" on public.network_thread_participants;
create policy "tp_update_self" on public.network_thread_participants for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "threads_read_participant" on public.network_threads;
create policy "threads_read_participant" on public.network_threads for select
  to authenticated using (public.user_is_in_thread(id));

drop policy if exists "threads_insert_authed" on public.network_threads;
create policy "threads_insert_authed" on public.network_threads for insert
  to authenticated with check (true);

drop policy if exists "threads_update_participant" on public.network_threads;
create policy "threads_update_participant" on public.network_threads for update
  to authenticated using (public.user_is_in_thread(id));

drop policy if exists "messages_read_participant" on public.network_messages;
create policy "messages_read_participant" on public.network_messages for select
  to authenticated using (public.user_is_in_thread(thread_id));

drop policy if exists "messages_insert_participant" on public.network_messages;
create policy "messages_insert_participant" on public.network_messages for insert
  to authenticated with check (
    sender_id = auth.uid() and public.user_is_in_thread(thread_id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 7. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "notifs_owner" on public.network_notifications;
create policy "notifs_owner" on public.network_notifications for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Quick sanity check — should return roughly 25+ rows. If any of the
--    network_* tables is missing from this list, the policy didn't apply.
-- ─────────────────────────────────────────────────────────────────────────
-- select tablename, policyname, cmd
-- from pg_policies
-- where tablename like 'network_%'
-- order by tablename, policyname;
