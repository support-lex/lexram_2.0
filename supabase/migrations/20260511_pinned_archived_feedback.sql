-- Pinned / archived sessions + message feedback. Replaces the previous
-- localStorage-only persistence so the state is shared across devices and
-- survives cache clears.
--
-- Apply via Supabase SQL Editor or `supabase db push`.
--
-- session_id is `text` (not a FK) because the LexRam backend mints session
-- ids outside Supabase — the chat_sessions mirror uses the same id as its
-- primary key, but a session can exist in LexRam without yet having been
-- mirrored locally. Keeping this loose avoids spurious FK violations.

-- ─────────────────────────────────────────────────────────────────────────────
-- pinned_sessions
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.pinned_sessions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index if not exists pinned_sessions_user_idx
  on public.pinned_sessions (user_id, created_at desc);

alter table public.pinned_sessions enable row level security;

drop policy if exists "pinned_sessions_owner_select" on public.pinned_sessions;
create policy "pinned_sessions_owner_select"
  on public.pinned_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "pinned_sessions_owner_insert" on public.pinned_sessions;
create policy "pinned_sessions_owner_insert"
  on public.pinned_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "pinned_sessions_owner_delete" on public.pinned_sessions;
create policy "pinned_sessions_owner_delete"
  on public.pinned_sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- archived_sessions
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.archived_sessions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index if not exists archived_sessions_user_idx
  on public.archived_sessions (user_id, created_at desc);

alter table public.archived_sessions enable row level security;

drop policy if exists "archived_sessions_owner_select" on public.archived_sessions;
create policy "archived_sessions_owner_select"
  on public.archived_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "archived_sessions_owner_insert" on public.archived_sessions;
create policy "archived_sessions_owner_insert"
  on public.archived_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "archived_sessions_owner_delete" on public.archived_sessions;
create policy "archived_sessions_owner_delete"
  on public.archived_sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- message_feedback (thumbs up/down per AI message)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Schema reconciliation block: an earlier version of this table shipped to
-- the LexRam Supabase project with the rating column named `value` (and no
-- `updated_at`). Every frontend POST has been 400ing as a result. This DO
-- block renames the column so existing rows are preserved and the rest of
-- the migration matches reality. Safe to re-run.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'message_feedback'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'message_feedback'
        and column_name = 'value'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'message_feedback'
        and column_name = 'rating'
    ) then
      alter table public.message_feedback rename column value to rating;
    end if;
  end if;
end $$;

create table if not exists public.message_feedback (
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  text not null,
  message_id  text not null,
  rating      text not null check (rating in ('up', 'down')),
  -- Optional free-text report the user types into the "what's wrong?" popup
  -- after a down-vote. Nullable so a plain thumbs-up still upserts cleanly.
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, session_id, message_id)
);

-- Backfill missing columns/constraints for tables created by earlier
-- versions of this migration. All idempotent.
alter table public.message_feedback
  add column if not exists comment text;

alter table public.message_feedback
  add column if not exists rating text;

alter table public.message_feedback
  add column if not exists updated_at timestamptz not null default now();

-- Re-assert the rating CHECK constraint in case it was dropped or never
-- attached to the renamed column. Done by name so we can drop-then-add.
alter table public.message_feedback
  drop constraint if exists message_feedback_rating_check;
alter table public.message_feedback
  add constraint message_feedback_rating_check
    check (rating in ('up', 'down'));

create index if not exists message_feedback_user_session_idx
  on public.message_feedback (user_id, session_id);

create or replace function public.touch_message_feedback_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_message_feedback_updated_at on public.message_feedback;
create trigger trg_message_feedback_updated_at
  before update on public.message_feedback
  for each row execute function public.touch_message_feedback_updated_at();

alter table public.message_feedback enable row level security;

drop policy if exists "message_feedback_owner_select" on public.message_feedback;
create policy "message_feedback_owner_select"
  on public.message_feedback for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "message_feedback_owner_upsert" on public.message_feedback;
create policy "message_feedback_owner_upsert"
  on public.message_feedback for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "message_feedback_owner_update" on public.message_feedback;
create policy "message_feedback_owner_update"
  on public.message_feedback for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "message_feedback_owner_delete" on public.message_feedback;
create policy "message_feedback_owner_delete"
  on public.message_feedback for delete
  to authenticated
  using (user_id = auth.uid());
