# TSR migration — making it production-grade for all lexram users

This document captures the three side-effecting steps required to finish
merging TSR onto the main lexram supabase. After these are done, every
signed-up lexram user automatically gets isolated, RLS-protected access
to the TSR feature — no per-user setup needed.

---

## 1. Apply the schema to the lexram supabase project

The schema + RLS lives in [`supabase/migrations/20260522_tsr_cases.sql`](supabase/migrations/20260522_tsr_cases.sql).
It is idempotent (`create table if not exists`, `drop policy if exists`),
so safe to re-run.

**Where:** Supabase Dashboard → project `pwzarravsoahyihrdbit` → SQL Editor
**Source:** paste the contents of `supabase/migrations/20260522_tsr_cases.sql`
**Verify:** confirm tables `public.cases` and `public.documents` exist and
RLS is on (`select * from pg_policies where tablename in ('cases','documents');`
should show four policies per table, all `auth.uid() = user_id`).

---

## 2. Repoint the Render backend at the lexram supabase

The backend at `lex-doc-analyzer.onrender.com` writes scrutiny reports
into the `cases` table via the `SUPABASE_URL` + `SUPABASE_KEY` env vars
on the Render service. Today these point at `ovghtwibustzkjkacvqo` (the
old TSR project). Change them.

**Where:** render.com → service `lex-doc-analyzer` → Environment tab
**Set:**

- `SUPABASE_URL` → `https://pwzarravsoahyihrdbit.supabase.co`
- `SUPABASE_KEY` → the **service_role** secret from the lexram supabase
  (Supabase Dashboard → project pwzarravsoahyihrdbit → Project Settings
  → API → `service_role` — copy the `service_role` key, **not** anon).

After saving, Render auto-redeploys. The backend will start writing
report payloads into the lexram supabase.

> **Why service_role and not anon?** The backend acts on behalf of every
> user — it needs to bypass per-user RLS to write reports for whichever
> user owns the case. Anon key would fail those writes.

---

## 3. Apply the GCS bucket CORS

Independent of the Supabase change. The bucket `lexram-enterprise-docs`
needs to allow PUT from `https://lexram-2-0-ui.vercel.app` so browser
uploads to signed URLs aren't blocked.

**Where:** Cloud Console → Cloud Storage → Buckets → `lexram-enterprise-docs`
→ Configuration tab → CORS Configuration → Edit
**Paste:** contents of [`gcs-cors.json`](gcs-cors.json) (already in the repo)
**Save.**

---

## 4. Deploy the frontend

The frontend change (TSR client points at lexram supabase via a compat
shim) is committed. After step 1+2+3 are done, run:

```bash
NODE_OPTIONS=--use-system-ca npx vercel deploy --prod --yes
```

(or just `npm run deploy:prod` if you have a script).

Vercel still has the unused `NEXT_PUBLIC_TSR_SUPABASE_URL` and
`NEXT_PUBLIC_TSR_SUPABASE_ANON_KEY` env vars set. They're harmless now —
the code no longer reads them. You can delete them from
vercel.com → lexram-2-0-ui → Settings → Environment Variables when convenient.

---

## What happens after this is live

| Action by user | What you see in the DB | Who can read it |
| --- | --- | --- |
| User signs up on lexram.ai | Row in `auth.users` | n/a |
| Creates a TSR case | Row in `public.cases` with `user_id` = their auth id | Only them (RLS) |
| Uploads a PDF | File in `gs://lexram-enterprise-docs/cases/{case_id}/{filename}` | Backend (signed URL); user via dashboard |
| Backend finishes Gemini analysis | `scrutiny_report` column populated; realtime push to frontend | Only the owning user |

Every new lexram signup gets all of this automatically. No bucket
permissions to grant, no manual onboarding, no shared anon key
vulnerability — RLS does the per-user isolation.
