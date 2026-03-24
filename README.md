# Statement Spending Analyzer (MVP)

Privacy-first web app for uploading one monthly credit card statement PDF (Chase US format), extracting transactions, categorizing spending, and showing a monthly report dashboard.

## Tech Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Recharts (ready to connect in dashboard expansion)
- OpenAI (planned fallback categorization + monthly summary)

## Current MVP Scope

- Email magic-link auth via Supabase
- Single ingestion endpoint: `POST /api/ingest`
- Chase parser v1 skeleton (text-based PDF extraction, no OCR)
- Transaction normalization + rule-based categorization
- Statement list page and statement detail page (summary cards + table)
- SQL migrations for schema + RLS policies

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Run Locally

```bash
npm install
npm run dev
```

## Important Files

- `supabase/migrations/0001_init.sql`: core schema
- `supabase/migrations/0002_rls.sql`: RLS policies
- `src/app/api/ingest/route.ts`: single ingestion flow
- `src/lib/parsing/chaseUsParser.ts`: Chase parser v1 skeleton
- `src/lib/parsing/normalizeTransactions.ts`: normalization utilities
- `src/lib/categorization/rules.ts`: rule-based categories
- `src/app/(app)/statements/new/page.tsx`: upload page
- `src/app/(app)/statements/[id]/page.tsx`: statement detail page
