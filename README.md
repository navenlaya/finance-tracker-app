# Finance Tracker Demo

A modern, full-featured personal finance tracking application built to demonstrate clean architecture, excellent UI/UX, and production-ready development practices. Connect your bank with Plaid or use demo data to explore accounts, transactions, budgets, and analytics.


## Features

- **Dashboard** - KPI cards, spending trends, category breakdown, recent transactions
- **Accounts** - View connected accounts with balances, connect via Plaid or add manually
- **Transactions** - Search, filter, categorize, add notes, manual entry
- **Budgets** - Monthly budgets by category with progress tracking and overspend alerts
- **Analytics** - Charts, category donut, spending trends
- **Demo Mode** - Instant access with anonymous sign-in, no account required
- **Reset Demo** - Start fresh with new sample data anytime
- **Dark Mode** - Full light/dark theme support
- **Responsive** - Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui + Radix UI |
| Data Fetching | TanStack Query |
| Charts | Recharts |
| Icons | Lucide |
| Auth & DB | Supabase |
| Bank Connection | Plaid |
| Validation | Zod |
| Testing | Vitest |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Next.js   │  │  TanStack   │  │   Plaid     │          │
│  │   Pages     │──│   Query     │──│   Link      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ /api/    │  │ /api/    │  │ /api/    │  │ /api/    │     │
│  │ accounts │  │ transact │  │ budgets  │  │ plaid/*  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│        Supabase         │    │         Plaid           │
│  ┌─────────┐ ┌────────┐ │    │  (Sandbox/Production)   │
│  │  Auth   │ │Postgres│ │    │                         │
│  │(anon +  │ │  + RLS │ │    │  Exchange tokens,       │
│  │ social) │ │        │ │    │  Sync transactions      │
│  └─────────┘ └────────┘ │    └─────────────────────────┘
└─────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account (free tier works)
- Plaid account (optional, for bank connection)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd finance-tracker
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your project URL and anon key
3. Go to **Authentication > Settings** and enable "Allow anonymous sign-ins"
4. Run the database migrations:

```bash
# Option A: Using Supabase Dashboard
# Go to SQL Editor and paste the contents of:
# supabase/migrations/20240101000000_initial_schema.sql

# Option B: Using Supabase CLI (if installed)
supabase db push
```

### 3. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for Plaid (optional feature)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-sandbox-secret
PLAID_ENV=sandbox

# Required for token encryption
ENCRYPTION_KEY=<generate with: openssl rand -base64 32>

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click "Enter Demo" to start!

## Plaid Sandbox Setup

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com)
2. Get your sandbox credentials from **Developers > Keys**
3. Add them to your `.env.local`

### Test Credentials

When connecting a bank in the Plaid Link flow, use these sandbox credentials:

| Username | Password | Description |
|----------|----------|-------------|
| `user_good` | `pass_good` | Normal successful flow |
| `user_good` | `mfa_device` | MFA with device selection |
| `user_good` | `mfa_questions` | MFA with security questions |

> **Note:** This is a sandbox environment. No real bank data is accessed.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel's dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PLAID_CLIENT_ID` (optional)
   - `PLAID_SECRET` (optional)
   - `PLAID_ENV` (optional, default: sandbox)
   - `ENCRYPTION_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
4. Deploy!

### Configure Supabase for Production

1. In Supabase dashboard, go to **Authentication > URL Configuration**
2. Add your Vercel URL to "Site URL" and "Redirect URLs":
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`

## Development

### Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript check
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
```

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── plaid/
│   │   └── transactions/
│   ├── app/               # Protected app pages
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   └── settings/
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── app/               # App shell, navigation
│   ├── dashboard/         # Dashboard widgets
│   ├── transactions/      # Transaction components
│   ├── budgets/           # Budget components
│   └── settings/          # Settings components
├── hooks/                 # React Query hooks
├── lib/                   # Utilities, Supabase client
├── types/                 # TypeScript types
└── test/                  # Test setup
```

## Infra / Platform Learning Steps

This project is designed for learning modern infrastructure patterns. Here's how to extend it:

### 1. Docker & Containerization

The included `Dockerfile` creates a production-ready container:

```bash
# Build the image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> \
  -t finance-tracker .

# Run locally
docker run -p 3000:3000 \
  -e ENCRYPTION_KEY=<key> \
  -e PLAID_CLIENT_ID=<id> \
  -e PLAID_SECRET=<secret> \
  finance-tracker
```

### 2. CI/CD with GitHub Actions

The included `.github/workflows/ci.yml` runs on every push:
- Linting
- Type checking
- Tests
- Build verification

### 3. Homelab / Self-Hosting

For self-hosting behind a reverse proxy:

```yaml
# docker-compose.yml example
version: '3.8'
services:
  finance-tracker:
    build: .
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - PLAID_CLIENT_ID=${PLAID_CLIENT_ID}
      - PLAID_SECRET=${PLAID_SECRET}
    expose:
      - "3000"

  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
```

```
# Caddyfile
finance.yourdomain.com {
    reverse_proxy finance-tracker:3000
}
```

**Security considerations for homelab:**
- Use a VPN (Tailscale, WireGuard) for access
- Never expose Supabase dashboard publicly
- Keep all secrets in environment variables
- Use HTTPS (Caddy handles this automatically)

### 4. Background Jobs (Future Enhancement)

The `/api/plaid/sync` endpoint is designed to be called as a background job. To implement scheduled syncing:

**Option A: Vercel Cron**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-all",
    "schedule": "0 */6 * * *"
  }]
}
```

**Option B: External scheduler (e.g., GitHub Actions, Upstash QStash)**

### 5. Observability

Recommended additions for production:
- **Logging**: Add structured logging with Pino
- **Monitoring**: Integrate Sentry for error tracking
- **Analytics**: Add PostHog or Plausible

## Demo Script (60 seconds)

For recruiters evaluating this project:

1. **Landing** (5s): Note the clean design and clear value proposition
2. **Enter Demo** (5s): Click "Enter Demo" - instant anonymous auth
3. **Dashboard** (15s): See KPIs, charts, recent transactions
4. **Transactions** (15s): Search, filter, click to edit a transaction
5. **Budgets** (10s): View budget progress, create a new budget
6. **Settings** (10s): See account management, Plaid connection option
7. **Responsive** (5s): Resize browser to see mobile layout
8. **Reset** (5s): Use "Reset Demo" to start fresh

## License

MIT

---

Built with care to demonstrate modern full-stack development practices.
