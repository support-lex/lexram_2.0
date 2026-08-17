-- Draft templates — user-uploaded documents whose extracted structure
-- is injected into the draft agent prompt so output matches the template's format.

create table if not exists public.draft_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  doc_type     text,                      -- e.g. "Writ Petition"
  structure    jsonb not null,            -- extracted structure JSON from Gemini
  raw_text     text,                      -- first 8000 chars of extracted text (for re-extraction)
  file_url     text,                      -- Supabase Storage path (optional)
  created_at   timestamptz not null default now()
);

alter table public.draft_templates enable row level security;

create policy "users manage own templates"
  on public.draft_templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists draft_templates_user_idx on public.draft_templates(user_id);
