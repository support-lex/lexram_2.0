-- Lexram Network: profiles, connections, feed, jobs, messaging, notifications.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null default '',
  headline        text default '',
  location        text default '',
  about           text default '',
  avatar_url      text,
  cover_url       text,
  skills          text[] not null default '{}',
  languages       text[] not null default '{}',
  website         text,
  profile_views   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists network_profiles_display_name_idx on public.network_profiles using gin (to_tsvector('simple', display_name));

create table if not exists public.network_profile_experiences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  company       text not null,
  location      text,
  start_date    date,
  end_date      date,
  description   text,
  created_at    timestamptz not null default now()
);
create index if not exists network_exp_user_idx on public.network_profile_experiences (user_id, start_date desc);

create table if not exists public.network_profile_educations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  school        text not null,
  degree        text,
  field         text,
  start_year    int,
  end_year      int,
  description   text,
  created_at    timestamptz not null default now()
);
create index if not exists network_edu_user_idx on public.network_profile_educations (user_id, end_year desc);

-- updated_at trigger for profiles
create or replace function public.touch_network_profile_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_network_profile_updated_at on public.network_profiles;
create trigger trg_network_profile_updated_at
  before update on public.network_profiles
  for each row execute function public.touch_network_profile_updated_at();

-- Auto-create empty profile row when a user signs up.
create or replace function public.handle_new_network_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.network_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_network_new_user on auth.users;
create trigger trg_network_new_user
  after insert on auth.users
  for each row execute function public.handle_new_network_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CONNECTIONS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users(id) on delete cascade,
  addressee_id  uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'ignored')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index if not exists network_connections_addressee_idx on public.network_connections (addressee_id, status);
create index if not exists network_connections_requester_idx on public.network_connections (requester_id, status);

drop trigger if exists trg_network_connections_updated_at on public.network_connections;
create trigger trg_network_connections_updated_at
  before update on public.network_connections
  for each row execute function public.touch_network_profile_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FEED (posts, likes, comments, reposts)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null,
  visibility      text not null default 'public' check (visibility in ('public', 'connections')),
  likes_count     int not null default 0,
  comments_count  int not null default 0,
  reposts_count   int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists network_posts_created_idx on public.network_posts (created_at desc);
create index if not exists network_posts_author_idx on public.network_posts (author_id, created_at desc);

create table if not exists public.network_post_likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.network_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);
create index if not exists network_post_likes_post_idx on public.network_post_likes (post_id);
create index if not exists network_post_likes_user_idx on public.network_post_likes (user_id);

create table if not exists public.network_post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.network_posts(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists network_post_comments_post_idx on public.network_post_comments (post_id, created_at desc);

create table if not exists public.network_post_reposts (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.network_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Counter triggers to keep likes/comments/reposts counts fresh.
create or replace function public.bump_post_counts()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_likes_count on public.network_post_likes;
create trigger trg_likes_count after insert or delete on public.network_post_likes
  for each row execute function public.bump_post_counts();

drop trigger if exists trg_comments_count on public.network_post_comments;
create trigger trg_comments_count after insert or delete on public.network_post_comments
  for each row execute function public.bump_post_counts();

drop trigger if exists trg_reposts_count on public.network_post_reposts;
create trigger trg_reposts_count after insert or delete on public.network_post_reposts
  for each row execute function public.bump_post_counts();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. JOBS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_jobs (
  id                uuid primary key default gen_random_uuid(),
  posted_by         uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  company           text not null,
  location          text not null,
  remote            boolean not null default false,
  easy_apply        boolean not null default true,
  sponsored         boolean not null default false,
  salary_low        int,
  salary_high       int,
  level             text not null default 'Mid' check (level in ('Entry', 'Mid', 'Senior', 'Manager')),
  job_type          text not null default 'Full-time' check (job_type in ('Full-time', 'Part-time', 'Contract')),
  description       text not null default '',
  responsibilities  text[] not null default '{}',
  qualifications    text[] not null default '{}',
  benefits          text[] not null default '{}',
  applicants_count  int not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists network_jobs_created_idx on public.network_jobs (created_at desc);
create index if not exists network_jobs_level_idx on public.network_jobs (level);
create index if not exists network_jobs_type_idx on public.network_jobs (job_type);

create table if not exists public.network_job_applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.network_jobs(id) on delete cascade,
  applicant_id  uuid not null references auth.users(id) on delete cascade,
  cover_letter  text,
  status        text not null default 'submitted' check (status in ('submitted', 'reviewed', 'rejected', 'shortlisted')),
  created_at    timestamptz not null default now(),
  unique (job_id, applicant_id)
);
create index if not exists network_job_apps_job_idx on public.network_job_applications (job_id);
create index if not exists network_job_apps_applicant_idx on public.network_job_applications (applicant_id);

create table if not exists public.network_saved_jobs (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.network_jobs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (job_id, user_id)
);
create index if not exists network_saved_jobs_user_idx on public.network_saved_jobs (user_id);

create or replace function public.bump_job_applicants()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.network_jobs set applicants_count = applicants_count + 1 where id = new.job_id;
  elsif tg_op = 'DELETE' then
    update public.network_jobs set applicants_count = greatest(0, applicants_count - 1) where id = old.job_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_job_applicants_count on public.network_job_applications;
create trigger trg_job_applicants_count after insert or delete on public.network_job_applications
  for each row execute function public.bump_job_applicants();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MESSAGING
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_threads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.network_thread_participants (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.network_threads(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  joined_at     timestamptz not null default now(),
  unique (thread_id, user_id)
);
create index if not exists network_thread_part_user_idx on public.network_thread_participants (user_id);
create index if not exists network_thread_part_thread_idx on public.network_thread_participants (thread_id);

create table if not exists public.network_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.network_threads(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists network_messages_thread_idx on public.network_messages (thread_id, created_at);

-- Bump thread.last_message_at on new message
create or replace function public.touch_thread_on_message()
returns trigger language plpgsql as $$
begin
  update public.network_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists trg_thread_last_message on public.network_messages;
create trigger trg_thread_last_message after insert on public.network_messages
  for each row execute function public.touch_thread_on_message();

-- Realtime publication: messages + threads need to be on supabase_realtime.
-- (network_notifications is added in section 6 below, after that table is created.)
alter publication supabase_realtime add table public.network_messages;
alter publication supabase_realtime add table public.network_threads;
alter publication supabase_realtime add table public.network_thread_participants;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.network_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('connection_request', 'connection_accepted', 'post_like', 'post_comment', 'job_posted', 'message', 'profile_view')),
  payload     jsonb not null default '{}',
  unread      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists network_notifs_user_unread_idx on public.network_notifications (user_id, unread, created_at desc);

-- Realtime: notifications need to be on supabase_realtime so the bell badge updates live.
alter publication supabase_realtime add table public.network_notifications;

-- Auto-fan-out: on new connection request → notify addressee.
create or replace function public.notify_connection_request()
returns trigger language plpgsql as $$
begin
  if new.status = 'pending' then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (new.addressee_id, new.requester_id, 'connection_request', jsonb_build_object('connection_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notif_connection_request on public.network_connections;
create trigger trg_notif_connection_request after insert on public.network_connections
  for each row execute function public.notify_connection_request();

create or replace function public.notify_connection_accepted()
returns trigger language plpgsql as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.network_notifications (user_id, actor_id, kind, payload)
    values (new.requester_id, new.addressee_id, 'connection_accepted', jsonb_build_object('connection_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notif_connection_accepted on public.network_connections;
create trigger trg_notif_connection_accepted after update on public.network_connections
  for each row execute function public.notify_connection_accepted();

-- Auto-fan-out: on new post like → notify post author (unless self-like).
create or replace function public.notify_post_like()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_notif_post_like on public.network_post_likes;
create trigger trg_notif_post_like after insert on public.network_post_likes
  for each row execute function public.notify_post_like();

-- Auto-fan-out: on new comment → notify post author (unless self-comment).
create or replace function public.notify_post_comment()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_notif_post_comment on public.network_post_comments;
create trigger trg_notif_post_comment after insert on public.network_post_comments
  for each row execute function public.notify_post_comment();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

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

-- Profiles: everyone can read, only owner can write own.
drop policy if exists "profiles_read_all" on public.network_profiles;
create policy "profiles_read_all" on public.network_profiles for select using (true);

drop policy if exists "profiles_insert_self" on public.network_profiles;
create policy "profiles_insert_self" on public.network_profiles for insert
  to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.network_profiles;
create policy "profiles_update_self" on public.network_profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Experiences/Educations: public read, owner write.
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

-- Connections: visible to either side; insert only as requester; update only by addressee.
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

-- Posts: public read, authenticated write own.
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

-- Post likes / comments / reposts: public read; authenticated user can manage own row.
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

-- Jobs: public read, authenticated user can post + edit own.
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

-- Applications: applicant + poster can read; only applicant can create.
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

-- Saved jobs: owner only.
drop policy if exists "saved_jobs_self" on public.network_saved_jobs;
create policy "saved_jobs_self" on public.network_saved_jobs for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Threads: participants only.
drop policy if exists "threads_read_participant" on public.network_threads;
create policy "threads_read_participant" on public.network_threads for select
  to authenticated using (
    exists (select 1 from public.network_thread_participants p where p.thread_id = id and p.user_id = auth.uid())
  );
drop policy if exists "threads_insert_authed" on public.network_threads;
create policy "threads_insert_authed" on public.network_threads for insert
  to authenticated with check (true);
drop policy if exists "threads_update_participant" on public.network_threads;
create policy "threads_update_participant" on public.network_threads for update
  to authenticated using (
    exists (select 1 from public.network_thread_participants p where p.thread_id = id and p.user_id = auth.uid())
  );

-- Thread participants: participants can read; users can insert self (or be inserted by another participant via api).
drop policy if exists "tp_read_participant" on public.network_thread_participants;
create policy "tp_read_participant" on public.network_thread_participants for select
  to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.network_thread_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );
drop policy if exists "tp_insert_self_or_creator" on public.network_thread_participants;
create policy "tp_insert_self_or_creator" on public.network_thread_participants for insert
  to authenticated with check (true);
drop policy if exists "tp_update_self" on public.network_thread_participants;
create policy "tp_update_self" on public.network_thread_participants for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Messages: only thread participants can read/insert.
drop policy if exists "messages_read_participant" on public.network_messages;
create policy "messages_read_participant" on public.network_messages for select
  to authenticated using (
    exists (select 1 from public.network_thread_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );
drop policy if exists "messages_insert_participant" on public.network_messages;
create policy "messages_insert_participant" on public.network_messages for insert
  to authenticated with check (
    sender_id = auth.uid()
    and exists (select 1 from public.network_thread_participants p where p.thread_id = thread_id and p.user_id = auth.uid())
  );

-- Notifications: owner only.
drop policy if exists "notifs_owner" on public.network_notifications;
create policy "notifs_owner" on public.network_notifications for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- AVATARS STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('network-avatars', 'network-avatars', true)
on conflict (id) do nothing;

drop policy if exists "network_avatars_public_read" on storage.objects;
create policy "network_avatars_public_read" on storage.objects for select
  using (bucket_id = 'network-avatars');

drop policy if exists "network_avatars_owner_write" on storage.objects;
create policy "network_avatars_owner_write" on storage.objects for all
  to authenticated
  using (bucket_id = 'network-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'network-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
