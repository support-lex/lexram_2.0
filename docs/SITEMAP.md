# LexRam 2.0 — Complete Sitemap

## Public Pages (no auth required)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/about` | About page |
| `/features` | Features page |
| `/faq` | FAQ page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |
| `/contact` | Contact page |
| `/careers` | Careers page |
| `/refund-policy` | Refund policy |
| `/sign-in` | Sign-in / sign-up page |
| `/reset-password` | Password reset |
| `/acts` | Public acts listing |
| `/blog` | Public blog listing |
| `/blog/[slug]` | Individual blog post |
| `/blog/create` | Blog post creation |
| `/blog/admin` | Blog admin panel |
| `/payment/success` | Payment success callback |

---

## Public Dashboard Routes (no auth required, rate-limited)

| Route | Description |
|---|---|
| `/dashboard/research-2` | AI legal research — guest capped at 1 message |
| `/dashboard/resources` | Resources hub |
| `/dashboard/acts` | Acts listing |
| `/dashboard/acts/[actId]` | Individual act |
| `/dashboard/amendments` | Amendments listing |
| `/dashboard/amendments/tracker` | Amendments tracker |
| `/dashboard/sub-legislation` | Sub-legislation listing |
| `/dashboard/sub-legislation/[id]` | Individual sub-legislation |
| `/dashboard/circulars` | Circulars listing |
| `/dashboard/circulars/[circularId]` | Individual circular |
| `/dashboard/schedules` | Schedules |
| `/dashboard/domains` | Domains |
| `/dashboard/ministry` | Ministry |
| `/dashboard/timeline` | Timeline |
| `/dashboard/gov-docs` | Government documents |
| `/dashboard/case-law` | Case law |
| `/dashboard/version-tracker` | Version tracker |
| `/dashboard/matrix` | Matrix |
| `/dashboard/burden-index` | Burden index |
| `/dashboard/cross-industry` | Cross-industry |
| `/dashboard/amendment-chain` | Amendment chain |
| `/dashboard/legal-analytics` | Legal analytics |
| `/dashboard/industry-dashboard` | Industry dashboard |
| `/dashboard/cross-refs` | Cross-references |

---

## Protected Dashboard Routes (auth + phone verification required)

### Core Dashboard

| Route | Description |
|---|---|
| `/dashboard` | Dashboard home |
| `/dashboard/matters` | Case matters |
| `/dashboard/search` | Search |
| `/dashboard/documents` | Documents |
| `/dashboard/billing` | Billing & plans |
| `/dashboard/subscription` | Subscription management |
| `/dashboard/settings` | User settings |
| `/dashboard/ai` | AI assistant |
| `/dashboard/client` | Client management |
| `/dashboard/advocate` | Advocate management |
| `/dashboard/briefs` | Briefs |
| `/dashboard/deadlines` | Deadlines |
| `/dashboard/contracts` | Contracts |
| `/dashboard/activity` | Activity log |
| `/dashboard/network` | Professional network |
| `/dashboard/case-status` | Case status search |
| `/dashboard/case-status/[cnr]` | Case detail by CNR |

### Blog CMS

| Route | Description |
|---|---|
| `/dashboard/blog` | Blog management |
| `/dashboard/blog/create` | New blog post |
| `/dashboard/blog/[slug]` | Blog post detail / edit |
| `/dashboard/blog/admin` | Blog admin panel |

### Admin

| Route | Description |
|---|---|
| `/dashboard/admin` | Admin panel |
| `/dashboard/admin/stats` | Admin statistics |
| `/dashboard/crawler` | Web crawler (draft circulars) |

### TSR Module (Title Scrutiny Report)

| Route | Description |
|---|---|
| `/dashboard/tsr` | TSR home |
| `/dashboard/tsr/[id]` | TSR case detail |
| `/dashboard/tsr/my-cases` | My TSR cases |
| `/dashboard/tsr/team` | Team management |
| `/dashboard/tsr/onboarding` | Onboarding |
| `/dashboard/tsr/onboarding/pending` | Pending onboarding |
| `/dashboard/tsr/onboarding/organization` | Organization onboarding |
| `/dashboard/tsr/admin` | TSR admin |
| `/dashboard/tsr/admin/[id]` | TSR admin case detail |
| `/dashboard/tsr/admin/new` | New TSR case |
| `/dashboard/tsr/admin/requests` | TSR admin requests |

---

## Redirects

| Source | Action | Target |
|---|---|---|
| `/dashboard/research-3` | 302 redirect | `/dashboard/research-2` |
| `/dashboard/research-3/*` | 302 redirect | `/dashboard/research-2` |

---

## API Routes

### Auth & Onboarding
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/onboarding/individual` | Individual user onboarding |
| `GET` | `/api/org-requests` | List organization requests |

### Admin API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/org-requests` | List org requests (admin) |
| `POST` | `/api/admin/org-requests/[id]/approve` | Approve org request |
| `POST` | `/api/admin/org-requests/[id]/reject` | Reject org request |
| `GET` | `/api/admin/orgs` | List organizations |
| `GET` | `/api/admin/orgs/[id]` | Get organization detail |

### Organization API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/org/members` | List members |
| `*` | `/api/org/members/[id]` | Get/update/delete member |
| `GET` | `/api/org/[orgId]/members` | List members by org |

### AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai` | AI chat / research |
| `POST` | `/api/ai/blog` | AI blog assistant |
| `POST` | `/api/ai/billing` | AI billing operations |

### Payments & Credits
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments` | Payment operations |
| `POST` | `/api/payments/create-order` | Create CashFree order |
| `GET` | `/api/credits/balance` | Get credit balance |
| `GET` | `/api/credits/transactions` | List credit transactions |

### RAG (Retrieval-Augmented Generation)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rag` | RAG query |
| `POST` | `/api/rag/moefcc` | MOEFCC RAG query |
| `POST` | `/api/rag/moefcc/search` | MOEFCC search |
| `POST` | `/api/rag/moefcc/stream` | MOEFCC stream |
| `GET` | `/api/rag/moefcc/clusters` | MOEFCC clusters |

### Search & Proxy
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/lexram-db/search` | LexRam DB search |
| `POST` | `/api/lexram-search` | LexRam search |
| `*` | `/api/lexram/[...path]` | LexRam catch-all proxy |
| `*` | `/api/acts-fastapi/[...path]` | Acts FastAPI proxy |

### Chat & Cron
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/title` | Generate chat title |
| `POST` | `/api/cron/publish-scheduled` | Publish scheduled blog posts |

---

## Proxy Rewrites

| Frontend Path | Proxied To |
|---|---|
| `/backend/*` | `http://<backend-server>:8000/*` |
| `/legal-api/*` | `http://<legal-api-server>:8124/*` |

---

## Special Pages

| Route | Description |
|---|---|
| `/not-found` | Custom 404 page |

---

## Route Counts

| Category | Count |
|---|---|
| Public pages | 18 |
| Public dashboard routes | 26 |
| Protected core dashboard routes | 17 |
| Blog CMS routes | 4 |
| Admin routes | 3 |
| TSR routes | 11 |
| API routes | 27 |
| **Total page routes** | **79** |
| **Total API endpoints** | **27** |

---

## Authentication Flow

```
All Routes
├── Non-dashboard (/, /about, /blog, /sign-in, etc.)
│   └── No middleware auth gate — open to all
│
└── /dashboard/*
    ├── PUBLIC_DASHBOARD_PATHS (research-2, acts, resources, circulars, etc.)
    │   └── No auth required — guest access with rate limits
    │
    └── Everything else (matters, admin, settings, tsr, billing, etc.)
        ├── Auth required (Supabase session)
        └── Phone verified required (phone_confirmed_at check)
```

---

*Generated: May 2026 | Project: LexRam 2.0 UI V2*
