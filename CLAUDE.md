# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Build for production (TypeScript + Vite)
npm run lint             # Run ESLint
npm run preview          # Preview built app locally
npx tsx scripts/migrate.ts  # Run database schema migration
```

For deployment: Push to `main` branch → Vercel auto-deploys frontend + serverless API functions.

## Project Overview

**Cashflow & P&L Financial Reporting App**

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Vercel serverless functions (Node.js, TypeScript)
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Client-side, env-var based (not production-grade)

**Core Features**:
1. Login with credentials from `VITE_AUTH_USERNAME` / `VITE_AUTH_PASSWORD`
2. Enter cash balances (opening + closing per quarter) across 4 sources
3. Upload CommBank CSV bank statement → auto-parsed & categorized
4. View P&L statement, cashflow chart, transaction table
5. Save quarters to Neon DB → compare across quarters

## Architecture

### Frontend Structure (`src/`)
```
src/
  components/
    # UI components (shadcn-based)
    LoginPage.tsx              # Auth form
    CashSourcesForm.tsx        # Opening + closing balance entry
    CsvUpload.tsx              # File upload with drag-drop
    SummaryCards.tsx           # 6 KPI cards (opening, closing, change, income, expense, profit)
    PLStatement.tsx            # P&L breakdown by category table
    CashflowChart.tsx          # Line chart of running balance
    TransactionsTable.tsx      # Filterable transaction list
    SaveQuarterDialog.tsx      # Modal to save quarter to DB
    QuarterComparison.tsx      # Chart + table comparing all quarters

    ui/                        # shadcn/ui components (auto-generated)

  lib/
    csvParser.ts              # CommBank CSV parsing + auto-categorization
    finance.ts                # Calculations: P&L, opening/closing totals, change
    queryClient.ts            # TanStack Query config
    schemas.ts                # Zod validation schemas
    utils.ts                  # shadcn utility (cn() function)

  types/
    finance.ts                # TypeScript interfaces (CashSource, Transaction, QuarterRecord, etc.)

  data/
    # (deleted - now using Neon DB instead)

  App.tsx                     # Main app layout, tab switching (Current Quarter / Compare)
  main.tsx                    # Entry point, QueryClientProvider wrapper
```

### Backend Structure (`api/`)
```
api/
  _db.ts                      # Shared Neon connection pool
  quarters/
    index.ts                  # GET all quarters, POST new quarter
    [id].ts                   # GET specific quarter, DELETE quarter
```

**API Routes**:
- `GET /api/quarters` → List all saved quarters with P&L summary
- `POST /api/quarters` → Save current quarter (cash sources + transactions + P&L)
- `GET /api/quarters/:id` → Fetch full quarter data
- `DELETE /api/quarters/:id` → Delete quarter

### Database Schema (`Neon`)
```sql
quarters (id, label, year, quarter, created_at)
  ↓ cascades on delete
cash_sources (quarter_id, source_id, label, opening_balance, closing_balance)
transactions (quarter_id, date, description, amount, balance, category, type)
pl_summaries (quarter_id, total_income, total_expenses, net_profit)
```

## Key Design Patterns

### Cash Source Tracking
- Each account (PayPal, Stripe, CommBank Transaction, CommBank Saver) stores **opening** and **closing** balance
- Net cash change = closing - opening
- Should align with P&L profit when P&L income/expense matches cash flows
- Q2 opening should equal Q1 closing (quarter-to-quarter continuity check)

### CSV Parsing
- **CommBank format**: Date, Amount, Description, Balance
- **Auto-categorization**: Keyword matching in `csvParser.ts` (Sales, Payroll, Marketing, Operations, Tax, Other)
- **Amount sign convention**: Positive = income (credit), Negative = expense (debit)
- Date format support: `DD/MM/YYYY` and `DD Mon YYYY`

### State Management
- Frontend uses React hooks + TanStack Query for API calls
- Form state via React Hook Form + Zod validation
- No Redux/Context yet (could add for auth state in future)

### TypeScript Strict Mode
- `tsconfig.app.json` has `strict: true` and `noUnusedLocals: true`
- Import types with `import type { ... } from '...'` (verbatimModuleSyntax enabled)
- API handlers use `VercelRequest` / `VercelResponse` types

## Adding Features

### New UI Component
1. Create in `src/components/YourComponent.tsx`
2. Use shadcn/ui components from `src/components/ui/` (Card, Button, Table, Select, etc.)
3. Import types from `src/types/finance.ts`
4. Add to `src/App.tsx` if it's a page-level component

### New API Endpoint
1. Create `api/resource/[method].ts` (Vercel routing: `[param]` is dynamic)
2. Import `query` helper from `api/_db.ts` for SQL queries
3. Use Neon connection pool (auto-reused across requests)
4. Return JSON via `res.status(200).json(...)`

### New Database Table
1. Update `scripts/migrate.ts` with CREATE TABLE statement
2. Run `npx tsx scripts/migrate.ts` to apply
3. Add types to `src/types/finance.ts`
4. Update API endpoints to query the new table

### New Validation
1. Add Zod schema to `src/lib/schemas.ts`
2. Use in form: `zodResolver(schema)` with React Hook Form
3. Or validate in API: `const validation = schema.safeParse(body)`

## Environment Variables

**Required** (add to `.env` and Vercel project settings):
```
DATABASE_URL=postgres://...              # Neon connection string
VITE_AUTH_USERNAME=admin                 # Login username (exposed to client!)
VITE_AUTH_PASSWORD=password123           # Login password (exposed to client!)
```

Note: `VITE_` prefix makes variables available in browser. This is **not** secure—only for demo purposes.

## Dependencies to Know

| Package | Purpose | Notes |
|---------|---------|-------|
| `@tanstack/react-query` | Data fetching + caching | Queries for API calls |
| `react-hook-form` + `@hookform/resolvers` | Form handling | With Zod validation |
| `zod` | Schema validation | For forms + API payloads |
| `papaparse` | CSV parsing | Handles CommBank CSV format |
| `recharts` | Charts | Via shadcn/ui chart component |
| `@neondatabase/serverless` | Neon client | Pool-based connections |
| `tailwindcss` v4 + `@tailwindcss/vite` | Styling | CSS-first config (no tailwind.config.js needed) |
| `@vitejs/plugin-react` | React HMR | Via Vite |

## Performance & Type Safety

- **HMR**: Vite's React plugin handles fast refresh
- **Code splitting**: Vite automatically chunks routes (not explicitly configured)
- **Type checking**: Run `npm run build` before deploying (catches TS errors)
- **Database**: Neon serverless pool handles cold starts; stateless Vercel functions (no sessions)

## Deployment

- **Frontend + API**: Vercel auto-detects Vite app + `/api/` functions
- **vercel.json**: Minimal config (`{"framework": "vite"}`)
- **Secrets**: Set `DATABASE_URL`, `VITE_AUTH_USERNAME`, `VITE_AUTH_PASSWORD` in Vercel project settings
- **Build**: `npm run build` runs `tsc -b && vite build` (TypeScript check first)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API 404 | Check Vercel routing: `api/quarters/index.ts` maps to `/api/quarters` |
| CSV import fails | Validate CommBank format: Date, Amount, Description, Balance columns |
| Type errors on edit | Use `import type { }` for type-only imports (verbatimModuleSyntax) |
| Database connection fails | Verify `DATABASE_URL` in `.env` and Vercel secrets |
| Cashflow chart missing | Ensure CSV has Balance column (running balance per transaction) |

## Git Workflow

- Main branch: `main` (production)
- Commits include context (why, not just what)
- Use feature branches for major changes (not enforced)
- Vercel deploys on push to `main`
