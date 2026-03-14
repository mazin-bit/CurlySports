# Prisma – migrations and seed

## First-time setup

1. **Install and generate**
   ```bash
   yarn install
   yarn db:generate
   ```

2. **Run migrations** (creates tables in Supabase using `DIRECT_URL`)
   ```bash
   yarn db:migrate
   ```
   When prompted for a migration name, use e.g. `init`.

3. **Seed app_config**
   ```bash
   yarn db:seed
   ```

4. **Enable RLS in Supabase**  
   The app uses the Supabase JS client and needs Row Level Security. After migrations:
   - Open **Supabase Dashboard → SQL Editor**
   - Run the script **`supabase/rls-only.sql`** (copy/paste and Run)

## Env

Prisma reads **`.env`** in the project root (not `.env.local`). Use **`DATABASE_URL`** and **`DIRECT_URL`** only.

- **`DATABASE_URL`** – Transaction mode pooler (port **6543**). Use for Prisma Client at runtime.
- **`DIRECT_URL`** – Session mode pooler (port **5432**). Used by **`prisma migrate`**.

**If you get "Authentication failed"**: Your DB password may contain `{`, `}`, `;`, `#`, `&`. They must be URL-encoded in the URI. Either:

1. **Copy the full URI** from Supabase Dashboard → **Settings** → **Database** → **Connection string** → **URI** (Reveal and copy for Session and Transaction mode), and paste into `.env` as `DIRECT_URL` and `DATABASE_URL`.
2. **Or** generate encoded URLs:  
   `DB_PASSWORD='your-raw-password' node scripts/encode-db-urls.js`  
   then paste the printed lines into `.env`.

## Commands

| Command           | Description                    |
|-------------------|--------------------------------|
| `yarn db:generate`| Generate Prisma Client         |
| `yarn db:migrate` | Create and apply migrations    |
| `yarn db:push`    | Push schema without migrations |
| `yarn db:seed`    | Seed app_config                |
| `yarn db:studio`  | Open Prisma Studio             |
