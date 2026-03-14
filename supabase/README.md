# Supabase setup for Curly Sports

The app uses **Supabase** for auth and data (users, app_config, login_logs, notifications). The frontend connects via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` — no direct `DATABASE_URL` is needed for the app to run.

## 1. Create tables and seed data

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Run **schema.sql** first (creates `users`, `login_logs`, `app_config`, `notifications` and RLS policies).
4. Run **seed.sql** (inserts the initial `app_config` row so the app can load settings).

If you get “relation already exists”, the tables are already there; you can skip schema and run only seed, or run seed alone to reset app_config defaults.

## 2. Database connection (optional, for CLI tools)

The `.env` keys `DATABASE_URL` and `DIRECT_URL` are only needed if you run **migrations or scripts from your machine** (e.g. Drizzle, Prisma, or custom Node scripts). The Curly Sports app does **not** use them; it talks to Supabase via the JS client and your project’s API URL + anon key.

If you do use CLI tools:

- Get the connection strings from **Supabase Dashboard → Project Settings → Database**.
- Replace `[YOUR-PASSWORD]` in `.env` with your database password.
- Use the **Connection string** (URI) for `DATABASE_URL` (port 6543 for pooler) and **Direct connection** for `DIRECT_URL` (port 5432) if your tool needs it.

## 3. After schema + seed

- Restart the app (`yarn dev` or `npm run dev`) and sign in. The first login will create a row in `users` and the dashboard will load `app_config` and other data.
