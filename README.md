# Vibe Athletics — Admin Panel

Full-stack jersey business management system.
**Stack:** Next.js 14 (App Router) · Prisma · PostgreSQL · Better Auth · TanStack Query · Tailwind · Recharts

---

## 1. Install dependencies

```bash
cd vibe-athletics
npm install
```

## 2. Set up PostgreSQL

Easiest option — free serverless Postgres:

1. Go to [neon.tech](https://neon.tech), sign up, create a project.
2. Copy the connection string it gives you.

(Or use local Postgres / Docker if you prefer.)

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
DATABASE_URL="your-neon-connection-string"
BETTER_AUTH_SECRET="any-random-32+-character-string"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

ADMIN_NAME="Your Name"
ADMIN_EMAIL="you@vibeathletics.com"
ADMIN_PASSWORD="pick-a-real-password"
```

> Generate a secret quickly with: `openssl rand -base64 32`

## 4. Create the database tables

```bash
npx prisma migrate dev --name init
```

This reads `prisma/schema.prisma` and creates every table in your Postgres database.

## 5. Seed the admin account + 3 team members

```bash
npm run prisma:seed
```

This creates:
- 1 **ADMIN** account (your `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`)
- 3 **MEMBER** accounts: Tawhid, Ovi, Rabbi (edit their emails/passwords directly in `prisma/seed.ts` before running if you want different values)

## 6. Run the app

```bash
npm run dev
```

Open **http://localhost:3000** → it redirects to `/login`.
Log in with your admin email/password from step 3.

---

## What's included

**Backend (API routes under `src/app/api`)**
- `POST /api/jerseys` — add jersey + size-wise stock
- `PUT /api/jerseys/[id]` — edit jersey + adjust stock
- `POST /api/orders` — **the core endpoint**: validates stock, deducts it, snapshots buying/selling price, creates the order — all inside one Prisma `$transaction`, so it can never leave stock/sales half-updated
- `GET /api/dashboard/stats` — every dashboard number (stock, sold, sales, cost, profit, best-seller, size/team/member breakdowns, low-stock alerts)
- `GET/POST /api/auth/[...all]` — handled entirely by Better Auth

**Frontend (`src/app/(dashboard)`)**
- Dashboard — stat cards, 14-day sales chart, best sellers, size/team/member breakdowns, stock alerts
- Jerseys — list with stock badges, add/edit form with dynamic size rows
- Orders — list with search, add-order form with live total calculation, order detail page
- Customers — list with lifetime stats, detail page with order history
- Reports — sales / inventory / product / member reports

**Business rules baked in (matches the spec exactly)**
- Orders are always `COMPLETED` the instant they're created — there is no status-update UI anywhere
- Stock can never go negative — the order transaction checks availability before deducting
- Historical price protection — every `OrderItem` stores the `buyingPrice`/`sellingPrice` **at the time of that order**, so editing a jersey's price later never changes old orders' profit

---

## Theme

Brand tokens live in `tailwind.config.ts`:
- `ink` (#0B1220) — dark navy, used for the sidebar and headings
- `volt` (#C6FF3D) — signature electric accent for primary actions, active states, highlights
- `flame` (#FF5A3C) — used for cost/warning indicators

Display numbers (stat cards, logo) use the **Teko** condensed font for an athletic, scoreboard feel; body/UI text uses **Inter**. Change either in `src/app/layout.tsx`.

---

## Adding real image uploads later

The `image` field on Jersey currently just stores a URL string. When you're ready for real uploads, wire up Cloudinary:
```bash
npm install cloudinary
```
and add an upload API route — happy to build that next if you want it.

## Deploying

- **App:** push to GitHub → import into [Vercel](https://vercel.com) → add the same env vars from `.env`
- **Database:** your Neon/Railway Postgres already works from anywhere, no extra setup needed
- After deploying, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` to your live domain, then redeploy

---

## Troubleshooting

- **"Not enough stock" on an order that should have stock** → check `npx prisma studio` → `JerseyStock` table for the actual quantity for that size.
- **Login fails silently** → make sure you ran `npm run prisma:seed` and that `.env` has the same `ADMIN_EMAIL`/`ADMIN_PASSWORD` you're typing in.
- **Prisma errors about missing engine/checksum** → run `npx prisma generate` manually once after `npm install`.
