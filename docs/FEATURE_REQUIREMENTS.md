# LexRam — Feature Requirements Document (UI / UX)

**Document purpose:** Define every functional capability the product must support, in platform-agnostic terms, so designers can produce UI/UX without being constrained by the current visual implementation. This document describes *what* the product does and *what the user must be able to accomplish*, not *how it currently looks*.

**Product:** LexRam — AI-powered legal research, drafting, and practice-management platform for Indian legal professionals.
**Primary users:** Practicing advocates, in-house counsel, law firm partners, paralegals, legal researchers, students.
**Secondary users:** Platform administrators, content editors.

---

## 1. User Account & Identity

### 1.1 Sign-up
- The user must be able to create an account using **first name, last name, email, phone number (E.164), country, and password (≥ 8 characters with confirmation)**.
- Phone number is the primary identifier; email is required for receipts and notifications.
- After sign-up, the user must verify their phone via a **6-digit SMS OTP** before gaining full access.
- The user must be able to **resend the OTP** if not received, with a sensible cooldown.
- The system must surface validation errors inline (invalid phone, weak password, password mismatch, country missing).
- A new account must be granted a **starting balance of free credits** (currently 500) and surfaced clearly as a trial allowance.

### 1.2 Sign-in
- The user must be able to sign in with either **email + password** or **phone + password**.
- If a signed-in user has not yet verified their phone, the system must immediately prompt for OTP verification before granting access.
- The user must see clear feedback for incorrect credentials, locked accounts, or unverified accounts.
- A "Remember me / stay signed in" option is required.

### 1.3 Password recovery
- The user must be able to request a password reset by entering email or phone.
- A 6-digit OTP is sent via the chosen channel; the UX must make the channel choice explicit.
- After OTP verification, the user can set a new password.
- The reset flow must support **OTP resend**.

### 1.4 Session & sign-out
- A signed-in session must be persistent across reloads and visible on every device.
- The user must be able to sign out from a single, easy-to-find place.
- The system should auto-refresh sessions silently; expiry must redirect cleanly to sign-in with a return-to URL.

### 1.5 Roles
The system supports at least three role tiers; UX must accommodate role-conditional menu items, dashboards, and write actions:
- **Guest** — limited preview of public resources and capped trial of research.
- **Authenticated user** — full access to research, drafting, matters, billing.
- **Administrator** — content publishing, user oversight, platform configuration.

Role transitions (e.g., upgrading to admin) are out of scope for self-serve UX.

---

## 2. Onboarding

- A first-time signed-in user must see a **guided welcome** that sets context: what LexRam does, the trial credit balance, and the three primary jobs (Research, Draft, Track).
- Onboarding must offer a **skip** path and must not block access to any free-tier feature.
- The user must be able to complete or revisit profile setup (firm name, practice area, jurisdiction) at any time, not just on first login.
- The onboarding should highlight the keyboard shortcut palette and the search entry point at least once.
- Sample/demo content (a sample research session, a sample matter) should be available so the empty state is never blank.

---

## 3. Profile & Settings

The user must be able to view and edit settings organized into the following groups:

### 3.1 Personal profile
- First name, last name, email, phone (with verification status badge), country, avatar upload (image, max ~1 MB).
- Re-verification flow if phone or email is changed.

### 3.2 Firm / professional details
- Firm name, office address, firm phone, GSTIN (Indian tax identifier), bar council ID, primary practice area, jurisdiction.
- Used for invoice headers and matter context.

### 3.3 Notification preferences
Per-channel (in-app, email, SMS) toggles for at least:
- Hearing reminders (configurable lead time, default 1 day).
- Filing deadlines.
- Limitation period warnings.
- Research updates (new precedents, amendments to tracked acts).
- Billing events (low credits, payment receipts, payment failures).

### 3.4 Security
- Change password (current + new + confirm).
- View active sessions / sign out from other devices (recommended).
- Enable / disable phone-OTP step-up for sensitive actions.

### 3.5 Billing
- Current credit balance with refresh control.
- "Buy more credits" entry point.
- Invoice / receipt history with download.
- Saved billing details (firm name, GSTIN) used to generate compliant invoices.

### 3.6 Appearance & accessibility
- Theme selection — at minimum light, dark, and a high-contrast option; design must support multiple named visual themes.
- Font-size scale (default / large).
- Reduced-motion toggle (respect OS setting by default).

### 3.7 Keyboard shortcuts
A discoverable list of all shortcuts. Required shortcuts:
- Open command palette.
- Jump to Research, Drafting, Briefs, Matters.
- Close any modal / panel.
- New research session.
- Focus search.

### 3.8 Account lifecycle
- Export my data (JSON / archive).
- Delete account with explicit confirmation, downstream-impact notice, and a recovery window.

---

## 4. Global Navigation & Discovery

### 4.1 Primary navigation
A persistent navigation surface must expose, at minimum:
- Dashboard (home)
- Research
- Drafting
- Briefs
- Matters / Cases
- Documents
- Case Status (court tracker)
- Legislation (Acts, Sub-legislation, Amendments, Circulars)
- Analytics
- Resources / Knowledge base
- Blog
- Settings

The navigation must collapse gracefully on small screens and must indicate the current section.

### 4.2 Command palette
A keyboard-accessible global command palette must allow the user to:
- Jump to any page.
- Open a recent research session.
- Search documents, matters, cases, acts.
- Trigger common actions ("New research", "New draft", "Open settings").
- Surface results across types in a unified ranked list.

### 4.3 Global search
A unified search entry point must search across acts, sections, sub-legislation, case law, the user's documents, and the user's matters. Results must be grouped by type and filterable.

### 4.4 User menu
The user's identity (avatar, name, role) must be visible in the navigation, with quick links to Profile, Billing, Settings, Help, and Sign out.

### 4.5 Connectivity / system status
A subtle indicator must show backend health; if AI or RAG services are degraded, the user must be informed *before* attempting an action that depends on them.

---

## 5. Dashboard (Home)

After sign-in, the user must land on a personalized home that surfaces:
- A snapshot of the corpus the user has access to (counts: acts, sections, sub-legislation, circulars).
- Recently accessed documents and research sessions.
- Upcoming deadlines and hearings (configurable horizon).
- Pinned / starred items.
- Quick-action tiles: New research, New draft, New matter, Track a case.
- Credit balance and a path to top up.
- Suggested resources (new amendments in the user's practice areas, trending precedents).

The dashboard must remain useful in an empty state: replace metrics with prompts that guide first-use actions.

---

## 6. Legal Research (AI Chat)

This is the product's primary feature.

### 6.1 Asking a question
- The user must be able to enter a natural-language legal question (free text, multi-line).
- The user must be able to attach context to a query: a matter, a specific act, a case, or an uploaded document.
- The user must be able to choose a **research mode** with explicit cost/quality tradeoffs:
  - **Instant** — fast, lower-cost, good for quick lookups.
  - **Deep** — slower, higher-cost, broader retrieval and reasoning.
  - **Draft** — generates a draft document instead of an answer.
- The system must show an estimated credit cost *before* the user commits to a deep or draft run.
- The user must be able to send the query (Enter to send; Shift+Enter for newline).

### 6.2 Receiving an answer
- The answer must stream token-by-token; the UI must indicate streaming and allow the user to stop generation.
- Every factual claim must carry a **citation** that can be expanded inline.
- Citations must link to: the source act/section, the source case, or the source uploaded document — opened in a side panel without losing the chat.
- Where the AI is uncertain or the corpus has gaps, the answer must say so explicitly.

### 6.3 Multi-turn conversation
- The user must be able to ask follow-up questions in the same session, with the prior context preserved.
- The user must be able to **branch** a conversation (fork from a specific message) to explore an alternate line.
- The user must be able to copy any single message, copy the full transcript, or export to PDF / DOCX.

### 6.4 Sources panel
- A persistent panel must list the sources retrieved for the current answer, ranked by relevance.
- Each source must show: title, section/heading, snippet, source type, and a relevance score.
- The user must be able to **pin** sources to keep them visible across the session.
- The user must be able to **exclude** a source and re-run.
- Where sources cluster around a theme, those clusters must be surfaceable as filters.

### 6.5 Session management
The user must be able to manage research sessions like a chat history:
- See all past sessions, grouped by recency (Today, Yesterday, Last 7 days, Older).
- Search / filter sessions by keyword.
- Rename a session.
- Pin / star a session to the top.
- Archive a session (hidden from the main list).
- Delete a session with confirmation.
- Share a session via a link (with viewer-only access by default; permission levels may extend to comment / edit).

### 6.6 Per-session matter linkage
A research session may be linked to a specific **matter / case**. Once linked, the AI must use that matter's documents and prior context as additional grounding.

### 6.7 Guest research
A non-signed-in visitor must be able to issue a single research query as a preview, then be prompted to sign up to continue.

---

## 7. Document Drafting

### 7.1 Starting a draft
The user must be able to start a draft from:
- A blank canvas with a chosen template.
- A **template gallery** organized by practice area (criminal, constitutional, family, civil, commercial, IP, labour, tax, environmental, regulatory, etc.) with at least 20 categories.
- An existing matter (auto-pulls party names, court, case number).
- A research session ("Draft based on this answer").

### 7.2 Templates
Each template must capture:
- Required fields (parties, court, case number, dates, jurisdiction).
- Optional fields (specific facts, prayers, grounds).
- Drafting tone / style (formal, terse, persuasive).

The user must see which fields are required before generation begins.

### 7.3 Generation
- The draft must stream as it is generated.
- The user must be able to stop generation at any time, keep what's produced, and continue editing.
- Generation must be billable transparently — cost shown before commit.

### 7.4 Editing
The drafting surface must function as a competent editor:
- Rich text formatting (headings, bold/italic/underline, lists, tables, footnotes, page breaks).
- Track-changes / revision view.
- Inline citation insertion linked to research sources.
- Comments / annotations on a paragraph.
- "Improve this paragraph" / "Rewrite more formally" / "Shorten" inline AI actions.
- Find and replace.
- Word count and approximate page count.

### 7.5 Export
- Export to **PDF** with selectable text and embedded fonts.
- Export to **DOCX** preserving structure and formatting.
- Export to plain text / Markdown.
- Print directly.

### 7.6 Saving and versioning
- Drafts must auto-save.
- The user must be able to view a version history and restore any prior version.
- A draft can be attached to a matter or kept standalone.

---

## 8. Briefs

The user must be able to assemble a **brief** — a curated package of research findings, citations, and drafted sections — distinct from a single drafting session.

- Add research answers and document excerpts to a brief.
- Reorder sections by drag.
- Generate an executive summary of the brief.
- Export the entire brief as a single PDF/DOCX.
- Share with a collaborator or client (link, view-only or commenter).

---

## 9. Matters / Cases (Practice Management)

### 9.1 Matter list
The user must be able to view, search, filter, and sort a list of their matters. Columns must include matter name, client, court, case number / CNR, status, next hearing date, last activity.

### 9.2 Matter detail
For any matter, the user must see:
- Parties (petitioner / respondent / others) and counsel.
- Court, jurisdiction, case number, CNR.
- Filing date and stage.
- Hearing history with dates, outcomes, and uploaded orders.
- Linked documents (drafts, evidence, exhibits).
- Linked research sessions.
- Linked deadlines and reminders.
- Billing time entries (out of scope for v1 if heavy, but UI must reserve a slot).
- Internal notes.
- Activity log of all changes.

### 9.3 Matter actions
- Create a new matter (manual entry or by importing from court tracker).
- Edit any field.
- Archive / close a matter.
- Share a matter with a teammate or client at a chosen permission level.
- Export the entire matter as an archive.

---

## 10. Court Case Tracker

### 10.1 Search
The user must be able to look up a court case by:
- **CNR** (Case Number Registry — official identifier).
- Advocate name.
- Filing date / range.
- Party name.
- FIR number.
- Court / jurisdiction.

Search must support combinations of the above.

### 10.2 Case detail
The result must show:
- Full case metadata (title, parties, court, case type, filing date, current stage).
- Hearing history (date, judge, purpose, outcome, next date).
- Order copies / judgments where available.
- Linked acts and sections.

### 10.3 Tracking
The user must be able to:
- **Track** a case so updates surface in their dashboard and notifications.
- See a list of tracked cases with the most recent update first.
- Untrack at any time.
- Convert a tracked case into a managed matter.

### 10.4 Search history
Recent searches must persist for re-use; the user must be able to clear history.

---

## 11. Legislation Library

### 11.1 Acts
- Browse a list of acts, filterable by ministry, year, status (in force / amended / repealed), and practice area.
- Open an act and read it section by section, with a sticky table of contents.
- Within a section, see: cross-references, notifications/circulars affecting the section, amendment history, and case law citing the section.

### 11.2 Sub-legislation
- Rules, regulations, schedules, notifications, circulars associated with each act, browsable independently.
- Each item shows issuing authority, effective date, and supersession links.

### 11.3 Amendments tracker
- Per-act amendment timeline.
- "What changed" diff view between any two versions of a section.
- Subscribe to amendments for a specific act, section, or topic.

### 11.4 Circulars
- Browse government circulars and notifications, filterable by ministry, date, and tagged practice area.

### 11.5 Cross-references
- Given a section, see every other section in any act that cross-references it, and vice versa.

### 11.6 Case law
- Search precedents by court, judge, date, citation, party, keyword, and cited section.
- Open a case to see headnotes, full text, cited sections, and a list of subsequent cases that cited it.
- Save a case to a matter or a brief.

### 11.7 Reading a legislative document
A legislative reading view must offer:
- In-line definitions on hover.
- "Ask AI about this section" call-to-action that pre-fills a research query.
- "Used in N of my matters" indicator.
- Bookmark / highlight / note tools that persist per user.

---

## 12. Documents Library

The user must be able to manage their own document collection.

### 12.1 Upload
- Drag-drop or file picker.
- Accepted formats: PDF, DOCX, TXT, RTF, image formats (for OCR).
- Multi-file batch upload with per-file progress.
- Clear file-size limits surfaced before upload.

### 12.2 Library
- List view with name, type, size, source (uploaded / drafted / received), linked matter, last modified.
- Folder or tag organization.
- Search by name and full text.
- Filter by type, matter, date.

### 12.3 Document detail
- Inline preview (PDF, DOCX, image).
- Extracted text view.
- "Ask AI about this document" — opens a research session pre-grounded on the document.
- Annotations / highlights persisted per user.
- Version history if the document was edited within LexRam.

### 12.4 Document actions
- Download in original format.
- Convert to PDF / DOCX.
- Attach to a matter.
- Share with a teammate or client.
- Delete with confirmation.

---

## 13. Deadlines, Schedules & Calendar

- The user must be able to add a deadline manually, or have one created automatically when:
  - A matter's next hearing date is updated.
  - A draft is filed (limitation calculation).
- A calendar view (day / week / month) must show all deadlines, hearings, and reminders.
- The user must be able to filter by matter, type, and assignee.
- Each item must support a configurable reminder schedule (days before, channel).
- iCal / Google Calendar export.

---

## 14. Analytics & Insights

The user must have access to dashboards that surface:

### 14.1 Personal analytics
- Research volume over time.
- Most-used acts and sections.
- Drafts produced per practice area.
- Time saved (estimated).
- Credit usage trend.

### 14.2 Practice-area / industry insights
- Trending amendments and circulars.
- Frequently litigated sections in a domain.
- Recent landmark precedents.

### 14.3 Regulatory burden index
- A composite metric per industry / sector showing cumulative compliance load.
- Drill-down to the regulations driving the index.

### 14.4 Legislative matrix
- Side-by-side comparison of analogous provisions across multiple acts (e.g., bail provisions across criminal statutes).
- User-configurable rows (acts) and columns (provisions).

All analytics must be exportable as CSV / PNG.

---

## 15. Resources & Knowledge Base

A guest-accessible hub containing:
- Curated guides per practice area.
- Glossary of legal terms.
- Procedure walkthroughs (e.g., "How to file a writ petition").
- Sample drafts (read-only previews; full templates require sign-in).
- Help / FAQ.

The hub must be browsable without an account.

---

## 16. Blog

### 16.1 Reader experience
- Public list of posts with category and tag filters.
- Article reading view: title, subtitle, cover image, author, reading time, date, body, related posts.
- Social share controls.
- Per-post comments are out of scope for v1.

### 16.2 Author experience (admin only)
- Rich-text editor with formatting, embedded images, links, code blocks, callouts.
- AI-assisted writing (generate draft, rewrite paragraph, generate meta description).
- Cover image upload.
- Category and tag assignment.
- SEO fields: meta title, meta description, slug, canonical URL.
- Status transitions: draft → scheduled → published.
- Schedule publish at a future date/time.
- Edit and unpublish.

### 16.3 Admin index
- Table of all posts with status filter.
- Bulk actions (publish, unpublish, delete).
- Author and last-edited columns.

---

## 17. Billing & Payments

### 17.1 Credit model
- The product is priced in **credits**.
- The currency conversion rate (e.g., ₹2 = 1 credit) must be visible at every purchase point.
- Per-action cost depends on mode (instant / deep / draft) and output volume — the user must see the actual cost after each transaction.

### 17.2 Top-up (Paywall)
When a user runs out of credits, or proactively from Settings, they must be able to top up:
- Choose a preset amount (small / medium / large; medium marked as "popular") or enter a custom amount.
- See live credit equivalent as they type.
- Confirm phone number for the payment receipt.
- Pay via the integrated payment gateway in a modal that does not lose page state.
- On success, see a confirmation screen with order ID, amount, credits added, and a link to the receipt.
- On failure, see a clear error and a retry option.

### 17.3 Receipts and invoices
- Every purchase generates an invoice with: firm name, GSTIN, line items, totals, taxes, payment method, order ID.
- Invoices must be downloadable as PDF.
- Invoice history must be filterable by date and downloadable in bulk.

### 17.4 Low-balance & exhaustion
- The user must see proactive low-balance warnings (e.g., at 20% remaining).
- When credits hit zero, billable actions must surface the paywall *before* charging.
- A free / unmetered tier is environment-controlled; the UX must not assume credits are always required.

### 17.5 Transaction history
- A complete list of debits (per-action) and credits (top-ups, refunds, promotional grants) with running balance.
- Filter by type, date range, and matter.

---

## 18. Notifications

### 18.1 In-app
- A notification center accessible from the navigation bar.
- Unread badge with count.
- Per-notification: title, body, timestamp, action link, mark-read, dismiss.
- Group by type (deadline, billing, research update, system).

### 18.2 Email
- Transactional: signup verification, password reset, payment receipt, payment failure.
- Digest: weekly summary of tracked-case updates and amendments (opt-in).

### 18.3 SMS
- OTP delivery.
- Critical hearing reminders.

### 18.4 Quiet hours
- The user must be able to set quiet hours during which non-critical notifications are suppressed.

---

## 19. Sharing & Collaboration

The platform must support multi-actor collaboration on:
- A research session.
- A matter.
- A document or draft.
- A brief.

For each shareable object:
- The user must be able to invite by email or copy a link.
- Permission levels: **viewer**, **commenter**, **editor**.
- The owner must see who has access and be able to revoke at any time.
- Shared links must support expiry and password protection (optional).
- Activity on shared objects must surface in the owner's notification feed.

A team workspace concept (organization, multiple seats, role-per-seat) is a v2 expansion but the data model and UI affordances should not preclude it.

---

## 20. Help & Support

- A persistent **Help** entry point in the navigation.
- Searchable help center with articles.
- "Contact support" form that captures the user's context (current page, last action) automatically.
- Live chat widget (optional, behind a feature flag).
- Status page link for outages.
- "What's new" changelog accessible in-app.

---

## 21. Public / Marketing Site

Distinct from the application, the public site must include the following pages with self-contained content models:
- Home (hero, value prop, social proof, feature highlights, pricing, testimonials, FAQ, CTA).
- Features.
- Pricing.
- About.
- Careers.
- Contact (with form).
- Blog (shared with in-app blog).
- FAQ.
- Legal: Privacy Policy, Terms of Service, Cookie Policy, Refund Policy.

All marketing pages must be SEO-ready (per-page meta title, meta description, canonical, OpenGraph image).

---

## 22. Administration

A separate administrative surface for users with the admin role:

- **User management** — list users, view profile, change role, suspend, delete, impersonate (with audit trail).
- **Content moderation** — moderate blog posts, comments (when added), shared sessions reported as abusive.
- **Feature flags** — toggle environment-specific features (e.g., paywall on/off, beta features).
- **System health** — backend status, queue depths, error rates.
- **Audit log** — who did what, when, on which object.

The admin surface must reuse the same design system as the main app but be visually marked so admins know they are operating in elevated mode.

---

## 23. Cross-cutting UX Requirements

### 23.1 Empty, loading, and error states
Every screen must have explicit designs for:
- **Empty** — first-time, no-data state with a clear next action.
- **Loading** — skeleton or progress indicator that matches the eventual layout.
- **Partial** — when some sections load and others fail.
- **Error** — recoverable error with retry; permanent error with support link.
- **Offline** — degrades gracefully where possible (read cached content).

### 23.2 Streaming and long-running actions
- Any AI action must show progress, allow cancellation, and never block the rest of the UI.
- The user must be able to leave a streaming session and come back to it without losing state.

### 23.3 Confirmation and undo
- Destructive actions (delete, archive, unshare, sign-out-everywhere) must require explicit confirmation.
- Where possible, prefer **undo toasts** over modal confirmations for low-risk reversible actions.

### 23.4 Search-everywhere principle
Every list view (sessions, documents, matters, cases, acts, blog posts, transactions) must have a search input that filters that list inline.

### 23.5 Citations and provenance
- Anywhere AI-generated content appears, the user must be able to see the underlying sources.
- Anywhere a legal claim is made, the user must be able to drill into the act, section, or case backing it.

### 23.6 Cost transparency
- The user must always know whether the action they are about to take is billable, and what the estimated cost is, before it runs.
- Post-action, the actual cost must be reconciled against the estimate.

### 23.7 Keyboard parity
Every primary action available via mouse must have a keyboard equivalent. Power users must be able to navigate the entire app without a pointing device.

### 23.8 Responsive design
- The app must work on screens from 360 px to ultrawide.
- A mobile experience is required for: research, dashboard, deadlines, case tracker, settings, billing top-up.
- Drafting and analytics may be desktop-primary with a mobile read-only fallback.

### 23.9 Accessibility
The product must meet **WCAG 2.1 AA**, including:
- Sufficient color contrast in every theme.
- Visible focus states on all interactive elements.
- Semantic landmarks and heading hierarchy.
- ARIA labels for icon-only controls.
- Screen-reader announcements for streaming AI output.
- Reduced-motion alternatives for any animation.
- Form inputs with persistent labels and inline errors.

### 23.10 Internationalization readiness
- All strings must be externalized.
- Date, number, and currency formatting must be locale-aware (default `en-IN`, INR).
- The data model must allow for multilingual content (Hindi, regional languages) even if the v1 UI ships English-only.

### 23.11 Privacy and data control
- The user must be able to export all their data.
- The user must be able to delete their account and have a clear statement of what is deleted vs. retained for legal reasons.
- Sharing surfaces must always show the current visibility level prominently.

### 23.12 Performance budgets (UX-visible)
- Initial dashboard render under 2 s on a typical broadband connection.
- Research first-token latency should feel immediate; if backend exceeds 3 s before first token, show a "thinking" affordance with an explanation.
- Document upload progress must be visible from byte 1.

---

## 24. Information-Architecture Map (Conceptual)

```
LexRam
├── Public site
│   ├── Home, Features, Pricing, About, Careers, Contact, FAQ
│   ├── Blog
│   └── Legal (Privacy, Terms, Cookies, Refund)
│
├── Auth
│   ├── Sign in
│   ├── Sign up + OTP verify
│   └── Password reset
│
└── App (authenticated)
    ├── Dashboard (home)
    ├── Research
    │   ├── New session
    │   ├── Session list (history, pinned, archived, shared)
    │   └── Session detail (chat + sources panel)
    ├── Drafting
    │   ├── Template gallery
    │   ├── Editor
    │   └── Versions
    ├── Briefs
    ├── Matters
    │   ├── List
    │   ├── Matter detail (overview, hearings, documents, research, deadlines, notes, activity)
    │   └── Clients & Advocates
    ├── Court tracker
    │   ├── Search
    │   └── Tracked cases
    ├── Legislation
    │   ├── Acts
    │   ├── Sub-legislation
    │   ├── Amendments tracker
    │   ├── Circulars
    │   ├── Cross-references
    │   └── Case law
    ├── Documents
    ├── Calendar / deadlines
    ├── Analytics
    │   ├── Personal
    │   ├── Industry
    │   ├── Burden index
    │   └── Legislative matrix
    ├── Resources / knowledge base
    ├── Blog
    ├── Billing
    │   ├── Balance & top-up
    │   ├── Transactions
    │   └── Invoices
    ├── Notifications
    ├── Settings
    │   ├── Profile, Firm, Security, Notifications, Billing, Appearance, Shortcuts, Account
    └── Admin (admin only)
        ├── Users, Content, Flags, Audit, Health
```

---

## 25. Non-functional requirements (UX-relevant)

| Requirement | Target |
|---|---|
| Uptime visibility | Status indicator visible in navigation when degraded |
| Error budget | All API failures must be user-actionable (retry / contact) within one click |
| Localization | `en-IN` first; structure must accept additional locales |
| Currency | INR primary; structure must accept additional currencies |
| Time zones | Default IST; user-configurable; all timestamps shown with explicit zone |
| Audit | All data-modifying actions logged and visible to the actor |
| Data retention | User-controlled deletion; admin-controlled platform retention |
| Compliance | DPDP Act (India) ready; consent surfaces for data use |

---

## 26. Out of scope (v1)

The following are deliberately not in the v1 feature set but the IA should not preclude them:
- Team workspaces with org-level billing.
- In-document real-time co-editing.
- Public marketplace of templates from third-party authors.
- Voice input / dictation.
- Native mobile applications (iOS / Android).
- Browser extension for clipping web content into LexRam.

---

## 27. Glossary

- **Act** — A piece of primary legislation passed by Parliament or a state legislature.
- **Sub-legislation** — Rules, regulations, schedules, and notifications made under an act.
- **CNR** — Case Number Record, the unique identifier for a court case in India.
- **Circular** — An administrative communication from a government department clarifying or directing application of law.
- **Matter** — A unit of legal work for a client, typically a single case or transaction.
- **Brief** — A curated package of research, drafts, and citations prepared for a court appearance or client meeting.
- **Credit** — The unit of platform usage. Every billable action consumes credits.
- **Mode (Instant / Deep / Draft)** — The depth-of-work setting for an AI action, with corresponding cost and quality.
- **RAG** — Retrieval-Augmented Generation; the system that grounds AI answers in retrieved legal sources.

---

*End of feature requirements document.*
