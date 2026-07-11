# VarsityLine

Verified cut-off marks, courses, and admission dates for Nigerian universities — everything your admission depends on, in one place.

**Live site:** [varsityline.vercel.app](https://varsityline.vercel.app)

## What it does

VarsityLine aggregates admission-critical information for Nigerian universities and cross-checks it against each university's own admissions office, showing exactly when each entry was last confirmed.

- **University profiles** — key dates (Post-UTME screening, admission list release, O'Level upload deadline, JAMB cut-off), requirements (UTME subjects, O'Level, Direct Entry), fees, and a full course-by-course cut-off table
- **Search** — by university (name, state, type), by course (name, cut-off comparator), or combined (course + state/type filters)
- **PDF export** — download search results as a PDF
- **Subscriptions** — email/Telegram alerts for admission updates on chosen universities, paid via Paystack
- **Source transparency** — every course row links back to its source, and each university page shows a "last confirmed" timestamp

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (Postgres)
- **Styling:** Tailwind CSS
- **Icons:** lucide-react
- **Admin tooling:** MCP server (`mcp-handler`) exposing CRUD tools for universities, courses, and subscriptions, gated behind a secret key
- **Payments:** Paystack
- **Deployment:** Vercel

## Project structure

```
app/
  [slug]/page.tsx        # University detail page
  api/mcp/[key]/route.ts # MCP admin server (key-gated)
components/
  SearchPanel.tsx         # Multi-mode search UI
  StatusBadge.tsx
  SearchAccessGate.tsx
lib/
  supabase.ts
  generatePdf.ts
types/
  university.ts
```

## Data model

- **universities** — `slug`, `name`, `state`, `type` (Federal/State/Private), `jamb_cutoff`, `admission_status`, key dates, fees, `last_verified_at`
- **courses** — belongs to a university; `name`, `faculty`, `cutoff_mark`, `subject_combo`, `de_eligible`, `de_cutoff_mark`, `source_url`
- **links** — official site, WhatsApp, Facebook links per university
- **subscriptions** — email/Telegram alert subscriptions tied to Paystack payments, with per-university scoping and expiry

## Getting started

```bash
npm install
npm run dev
```

### Environment variables

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MCP_SECRET_KEY=
```

## Admin data management

Admin operations (creating/updating universities, courses, and subscriptions, marking records as verified) are handled through an MCP server at `/api/mcp/[key]`, authenticated by `MCP_SECRET_KEY`. Connect an MCP-compatible client (e.g. Claude) pointed at that endpoint to manage data conversationally instead of building a separate admin panel.

## Disclaimer

Meeting a course's cut-off mark does not guarantee admission — Post-UTME score and O'Level grades are also weighted. VarsityLine surfaces official figures but decisions rest with each university's admissions office.
