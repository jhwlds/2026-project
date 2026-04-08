# Project log

Time spent on the Statement Spending Analyzer MVP (research, implementation, testing, and documentation). **Total: 35 hours** (within the ~30–40 h target). **Last working day: 4/7/2026.**

| Date | What I did | Hours |
| --- | --- | ---: |
| 3/27/2026 | Problem framing, privacy-first goals, low-fidelity UX sketches, MVP scope | 2.5 |
| 3/28/2026 | Next.js 16 (App Router), TypeScript, Tailwind, repo structure, lint/format | 2.0 |
| 3/29/2026 | Supabase project wiring, `.env` / keys, local dev loop with DB | 1.5 |
| 3/30/2026 | SQL migrations: statements, transactions, categories; align types in the app | 3.0 |
| 3/31/2026 | Supabase Auth (email magic link), protected routes, session on server/client | 3.0 |
| 4/1/2026 | Row Level Security policies; verify rows stay scoped per `auth.uid()` / `user_id` | 2.5 |
| 4/2/2026 | `POST /api/ingest` contract, PDF upload UI, basic validation and errors | 2.0 |
| 4/3/2026 | Chase credit-card PDF parser (lines, dates, amounts, merchants) | 3.0 |
| 4/4/2026 | UCCU parser, `banks.ts` + `parserRegistry` for multi-bank selection | 2.5 |
| 4/5/2026 | `normalizeTransactions` (merchant strings, dates, amounts) | 2.0 |
| 4/6/2026 | OpenAI categorization (`ai.ts`), JSON shape, batching, wire into ingest | 2.5 |
| 4/7/2026 | Statement list + detail pages (summary cards, table); bank selector flow; regression on uploads | 4.5 |
| 4/7/2026 | E2E testing, PDF edge cases, bug fixes; README final report, diagrams, demo video, project log | 4.0 |
| **Total** | | **35.0** |
