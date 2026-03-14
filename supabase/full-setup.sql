-- Curly Sports – Full DB setup (tables + seed + RLS)
-- Run ONCE in Supabase Dashboard → SQL Editor → New query → Paste all → Run
-- No Prisma connection needed. Use this if prisma migrate fails (e.g. auth).

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT '',
  display_name text DEFAULT '',
  photo_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_login_date date,
  last_seen timestamptz,
  favorite_clubs jsonb NOT NULL DEFAULT '[]',
  favorite_players jsonb NOT NULL DEFAULT '[]',
  booked_tickets jsonb NOT NULL DEFAULT '{}',
  penalty_best int NOT NULL DEFAULT 0,
  super_over_best int NOT NULL DEFAULT 0,
  survey_interests jsonb,
  survey_completed boolean NOT NULL DEFAULT false,
  survey_skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON public.users (auth_id);

CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_auth_id text,
  email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  logged_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_logs_logged_at_idx ON public.login_logs (logged_at DESC);

CREATE TABLE IF NOT EXISTS public.app_config (
  id text PRIMARY KEY DEFAULT 'app',
  feature_flags jsonb NOT NULL DEFAULT '[]',
  sa_admins jsonb NOT NULL DEFAULT '[]',
  permissions jsonb NOT NULL DEFAULT '[]',
  maintenance boolean NOT NULL DEFAULT false,
  health jsonb NOT NULL DEFAULT '{}',
  audit_log jsonb NOT NULL DEFAULT '[]',
  enabled_sports jsonb NOT NULL DEFAULT '{}',
  super_admin_emails jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

-- ============ SEED app_config ============
INSERT INTO public.app_config (id, feature_flags, sa_admins, permissions, maintenance, health, audit_log, enabled_sports, super_admin_emails, updated_at)
VALUES (
  'app',
  '[{"key":"live_scores","label":"Live scores","description":"Show live scores to members","enabled":true},{"key":"streaks","label":"Streaks","description":"Enable streak tracking","enabled":true},{"key":"favorites","label":"Favorites","description":"Allow favorites (teams/players)","enabled":true},{"key":"leaderboard","label":"Leaderboard","description":"Show streak leaderboard","enabled":true},{"key":"news","label":"News","description":"Show news & updates","enabled":true}]'::jsonb,
  '[]'::jsonb,
  '[{"key":"admin_manage_users","label":"Manage users (view, ban, suspend)","enabled":true},{"key":"admin_view_leaderboard","label":"View streak leaderboard","enabled":true},{"key":"admin_engagement","label":"View engagement analytics","enabled":true},{"key":"admin_reset_streak","label":"Reset user streak","enabled":true}]'::jsonb,
  false,
  '{"server":"OK","db":"Connected","api":"OK","uptime":"99.9%"}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  feature_flags = EXCLUDED.feature_flags,
  sa_admins = EXCLUDED.sa_admins,
  permissions = EXCLUDED.permissions,
  maintenance = EXCLUDED.maintenance,
  health = EXCLUDED.health,
  audit_log = EXCLUDED.audit_log,
  enabled_sports = EXCLUDED.enabled_sports,
  super_admin_emails = EXCLUDED.super_admin_emails,
  updated_at = now();

-- ============ RLS ============
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth_id = auth.uid()::text);
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')));
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth_id = auth.uid()::text);
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth_id = auth.uid()::text);
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "login_logs_insert" ON public.login_logs;
CREATE POLICY "login_logs_insert" ON public.login_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "login_logs_select_admin" ON public.login_logs;
CREATE POLICY "login_logs_select_admin" ON public.login_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "app_config_select" ON public.app_config;
CREATE POLICY "app_config_select" ON public.app_config FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "app_config_update" ON public.app_config;
CREATE POLICY "app_config_update" ON public.app_config FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "app_config_insert" ON public.app_config;
CREATE POLICY "app_config_insert" ON public.app_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid()::text OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text));
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()::text OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text));

-- ============ TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
