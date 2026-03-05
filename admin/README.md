# Admin & Super Admin Panels (separate from main sports app)

Next.js + Node.js (API routes) + PostgreSQL (Prisma). **Strict separation:** Members use the main sports analytics app (CRA). Admins and Super Admins use this app only.

## Access control (strict)

| Account type | Access | 403 for |
|--------------|--------|---------|
| **Member** | Main sports app only (not this app) | `/admin/*`, `/super-admin/*` |
| **Admin** | `/admin/*` only | `/super-admin/*`, Member content |
| **Super Admin** | `/super-admin/*` only | `/admin/*`, Member content |

- **Members** sign in on the main sports app. If they hit this app, they are redirected to `NEXT_PUBLIC_MAIN_APP_URL` (or see "members-use-main-app").
- **Admins** can only access the Admin panel. User management, streak leaderboard, engagement stats, ban/suspend. No system-level controls.
- **Super Admins** can only access the Super Admin panel. Create/delete admins, role assignment, feature flags, system logs, audit trail, server/DB health. No sports analytics, no leaderboard, no engagement UI.

No UI mixing between panels. Backend middleware returns **403** for unauthorized route access.

## Structure

```
src/app/
  admin/                  # Admin panel
    layout.tsx, page.tsx, users/, leaderboard/, engagement/
    _components/          # AdminSidebar, AdminStatCard
  super-admin/            # Super Admin panel (system control only)
    layout.tsx, page.tsx, admins/, roles/, logs/, audit/, feature-flags/, maintenance/, health/
    _components/          # SuperAdminSidebar, SuperAdminStatCard
  login/
```

## Admin panel (`/admin/*`)

- User management, streak leaderboard, engagement metrics, ban/suspend.
- No system-level controls (no feature flags, audit, or DB health here).

## Super Admin panel (`/super-admin/*`)

- Create/delete admins, assign roles, feature flags, maintenance mode, audit logs, server/DB health.
- No sports analytics, no leaderboard, no streak UI, no engagement dashboards.

## Security

- **Middleware** (`src/middleware.ts`): Validates JWT and role; returns **403** for unauthorized route access.
- **API routes**: Use `requireRole`, `requireAdminAccess`, or `requireSuperAdminAccess()` from `@/lib/require-role` and return 403 for wrong role.
- **JWT**: HTTP-only cookie, verified on each request. Set `JWT_SECRET` (32+ chars) in production.
- **Audit**: All role changes and sensitive actions logged; persist to PostgreSQL via `audit_log` table.
- **Privilege escalation**: Only Super Admin can assign roles; backend enforces.

## PostgreSQL (Prisma)

```bash
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET
npx prisma migrate dev
```

Schema: `users` (role, status, streaks), `audit_logs`, `feature_flags`, `system_config`. See `prisma/schema.prisma`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3001. Demo login:

- **Super Admin:** `super@test.com` → redirects to `/super-admin`
- **Admin:** `admin@test.com` → redirects to `/admin`
- **Member:** any other email → redirects to main app (set `NEXT_PUBLIC_MAIN_APP_URL` or `MAIN_APP_URL` in `.env`)

Password: any (demo). In production, validate against your auth/DB and set role from PostgreSQL.

**Main sports app:** Set `REACT_APP_ADMIN_PANEL_URL=http://localhost:3001` so Admin/Super Admin users are redirected from the CRA app to this panel.
