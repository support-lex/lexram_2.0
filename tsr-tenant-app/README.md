# Lexram TSR — Per-Organisation Tenant App

One TSR codebase, deployed **once per organisation**. Each deploy is pinned to a
single org via `NEXT_PUBLIC_ORG_SLUG` (= the org's `schema_name`) and becomes that
org's own branded Title Scrutiny workspace, reading/writing **that org's Postgres
schema** (e.g. `avr.cases` / `avr.documents`).

Created by the super-admin console (`admin-console/`): provision an org there →
copy its deploy config from the org detail page → deploy this app with it.

## How it works

```
NEXT_PUBLIC_ORG_SLUG=avr
  → get_org_public_branding('avr')  ⇒ logo, name, banks, language, schema
  → all data via supabase.schema('avr').from('cases' | 'documents')   (per-user RLS)
  → auth gate: active organization_members row for this org (or super_admin)
  → AI pipeline via /api/tsr proxy → Lex-Doc-Analyzer (response persisted into avr.cases)
```

## Setup

```bash
cd tsr-tenant-app
cp .env.local.example .env.local     # set NEXT_PUBLIC_ORG_SLUG + Supabase + backend
npm install
npm run dev                          # http://localhost:3002
```

Prereqs on the Supabase project:
1. Migrations `20260601_org_schema_provisioning.sql` + `20260602_org_public_branding.sql` applied.
2. The org's schema (e.g. `avr`) added under **Settings → API → Exposed schemas**.

## Structure

| Path | Role |
|------|------|
| `lib/org-config.ts` + `app/_components/OrgProvider.tsx` | resolve + supply org branding/schema |
| `app/_components/useSession.ts` | auth + this-org membership gate |
| `lib/tsr-data.ts` | schema-aware cases/documents CRUD (+ public shadow bridge) |
| `lib/tsr-api.ts` | JWT-cached fetch to the Lex-Doc-Analyzer backend |
| `app/login`, `app/(workspace)/{my-cases,[id],team}` | branded TSR UI |
| `app/_components/{DashboardSidebar,NewReportModal,TsrPaymentModal,InvoiceView}.tsx` | UI |
| `app/api/tsr/**`, `app/api/org/**` | backend proxy, payments, member management |

## Known seams (by design, for now)

- **Pipeline bridge:** the Lex-Doc-Analyzer backend still keys off
  `public.tsr_clients`, so `createCase` writes a shadow row there (same id) and the
  app persists the pipeline's HTTP response into `avr.cases` itself. Drop the shadow
  write once the backend is schema-aware.
- **Payments** stay in central `public.tsr_payments` (already has `org_id`).
