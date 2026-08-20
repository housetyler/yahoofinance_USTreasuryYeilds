# RM Select Benchmarking — Client Portal

A secure Next.js portal where external clients log in and see their Domo dashboards — filtered so each client sees **only their own data**.

---

## Quick Start (local development)

### 1. Install dependencies
```bash
cd richey-may-portal
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```

Open `.env` and fill in:
| Variable | Value |
|---|---|
| `DATABASE_URL` | Leave as `file:./prisma/dev.db` for local dev |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `DOMO_CLIENT_ID` | Already filled in (see `.env.example`) |
| `DOMO_CLIENT_SECRET` | Your Domo client secret (keep this private!) |
| `DOMO_INSTANCE` | `richeymay.domo.com` |

### 3. Set up the database
```bash
npm run db:migrate   # Creates the SQLite database and tables
npm run db:generate  # Generates the Prisma client
npm run db:seed      # Creates the first admin user
```

### 4. Start the dev server
```bash
npm run dev
```

Visit **http://localhost:3000**

### 5. Test login
| | |
|---|---|
| **URL** | http://localhost:3000/admin |
| **Email** | rmselect@richeymay.com |
| **Password** | R1ch3yM4y! |

---

## Adding client users

1. Log in as admin → go to **http://localhost:3000/admin**
2. Under **Add Company**: enter the company name **exactly as it appears in the `Client_Name` column of your Domo dataset**
3. Under **Add User**: enter the client's email, a temporary password, and select their company
4. Share the credentials with your client — they log in at the root URL (`/`)

---

## How the Domo embed works (plain English)

1. When a client logs in and loads `/dashboard`, the server (not the browser) calls Domo's API using your Client ID and Secret.
2. Domo returns a short-lived **embed token** that includes a data filter: `Client_Name = "<client's company>" OR Client_Name = "Peer Group"`.
3. That token is used to load an iframe — clients only ever see a Richey May URL and your branding. Domo is invisible.
4. The Client Secret **never** leaves the server and is never in the browser.

---

## Adding your logo

Drop your logo image into:
```
richey-may-portal/public/logo.png
```
Then replace the placeholder `<div>` blocks in `pages/index.js`, `pages/dashboard.js`, and `pages/admin.js` with:
```jsx
<img src="/logo.png" alt="RM Select" className="navbar__logo" />
```

---

## Deploying to Vercel

### Switch to Postgres (required for Vercel — SQLite doesn't persist there)

1. Create a free Postgres database at [neon.tech](https://neon.tech) or use **Vercel Postgres** from your Vercel dashboard.
2. Copy your Postgres connection string (looks like `******host/db?sslmode=require`).
3. In `prisma/schema.prisma`, change **one line**:
   ```prisma
   // Before:
   provider = "sqlite"
   // After:
   provider = "postgresql"
   ```
4. Set these environment variables in your Vercel project settings:
   - `DATABASE_URL` = your Postgres connection string
   - `NEXTAUTH_SECRET` = same random secret you generated locally
   - `NEXTAUTH_URL` = your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
   - `DOMO_CLIENT_ID`, `DOMO_CLIENT_SECRET`, `DOMO_INSTANCE` = same as local
5. Run the migration against your production database:
   ```bash
   npx prisma migrate deploy
   ```
6. Re-run the seed to create the admin user on the production database:
   ```bash
   node prisma/seed.js
   ```

That's the **only** change needed — the schema models, all pages, and all API routes work identically with Postgres.

---

## Project structure

```
richey-may-portal/
├── .env.example          ← template — copy to .env and fill in secrets
├── .gitignore            ← .env and node_modules excluded
├── next.config.js
├── package.json
├── lib/
│   ├── auth.js           ← NextAuth config (credentials provider)
│   └── domo.js           ← server-side Domo embed token + filtering
├── prisma/
│   ├── schema.prisma     ← User + Company tables (SQLite locally, Postgres on Vercel)
│   └── seed.js           ← creates the first admin user
├── pages/
│   ├── _app.js           ← session provider wrapper
│   ├── index.js          ← login page
│   ├── dashboard.js      ← embedded Domo dashboard
│   ├── admin.js          ← admin: manage users & companies
│   └── api/
│       ├── auth/[...nextauth].js   ← NextAuth handler
│       ├── embed-token.js          ← returns filtered Domo token
│       └── admin/
│           ├── users.js            ← CRUD users
│           └── companies.js        ← CRUD companies
├── styles/
│   └── globals.css       ← RM Select brand colors + base styles
└── public/
    └── (drop logo.png here)
```
