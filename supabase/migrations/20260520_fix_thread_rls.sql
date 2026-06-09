-- LexRam Network — fix RLS infinite-recursion on thread tables.
-- The original 20260516_network.sql policy on network_thread_participants
-- referenced the same table inside its own USING clause, which Postgres
-- detects as recursive and rejects with a 500 / "infinite recursion in
-- policy" error. That cascades into 500s on network_threads,
-- network_messages, and the realtime channel subscription.
--
-- Apply via Supabase SQL Editor; safe to re-run.

-- SECURITY DEFINER helper — bypasses RLS while doing the membership check,
-- which breaks the recursion cycle.
create or replace function public.user_is_in_thread(p_thread_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.network_thread_participants
    where thread_id = p_thread_id and user_id = auth.uid()
  );
$$;

revoke all on function public.user_is_in_thread(uuid) from public;
grant execute on function public.user_is_in_thread(uuid) to authenticated;

-- ── network_thread_participants ──────────────────────────────────────────
drop policy if exists "tp_read_participant" on public.network_thread_participants;
create policy "tp_read_participant" on public.network_thread_participants for select
  to authenticated using (
    user_id = auth.uid() or public.user_is_in_thread(thread_id)
  );

-- ── network_threads ──────────────────────────────────────────────────────
drop policy if exists "threads_read_participant" on public.network_threads;
create policy "threads_read_participant" on public.network_threads for select
  to authenticated using (public.user_is_in_thread(id));

drop policy if exists "threads_update_participant" on public.network_threads;
create policy "threads_update_participant" on public.network_threads for update
  to authenticated using (public.user_is_in_thread(id));

-- ── network_messages ─────────────────────────────────────────────────────
drop policy if exists "messages_read_participant" on public.network_messages;
create policy "messages_read_participant" on public.network_messages for select
  to authenticated using (public.user_is_in_thread(thread_id));

drop policy if exists "messages_insert_participant" on public.network_messages;
create policy "messages_insert_participant" on public.network_messages for insert
  to authenticated with check (
    sender_id = auth.uid() and public.user_is_in_thread(thread_id)
  );
