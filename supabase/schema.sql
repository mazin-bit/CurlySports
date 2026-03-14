-- Curly Sports – Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (Project: your project)
-- Then run seed.sql to insert initial app_config.

-- ============================================================
-- USERS
-- ============================================================
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

-- ============================================================
-- LOGIN LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_auth_id text,
  email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  logged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_logs_logged_at_idx ON public.login_logs (logged_at DESC);

-- ============================================================
-- APP CONFIG (single row: id = 'app')
-- ============================================================
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

-- ============================================================
-- NOTIFICATIONS (user_id stores auth_id or users.id::text)
-- ============================================================
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

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: read own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_id = auth.uid()::text);

-- Users: admins/super_admins can read all (for admin dashboard)
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  );

-- Users: insert own row (first login)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth_id = auth.uid()::text);

-- Users: update own row
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_id = auth.uid()::text);

-- Users: admins can update any (role/status/streak)
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  );

-- Login logs: any authenticated user can insert
CREATE POLICY "login_logs_insert" ON public.login_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Login logs: admins can read
CREATE POLICY "login_logs_select_admin" ON public.login_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  );

-- App config: anyone authenticated can read
CREATE POLICY "app_config_select" ON public.app_config
  FOR SELECT TO authenticated USING (true);

-- App config: authenticated can update (app restricts to super_admin in code)
CREATE POLICY "app_config_update" ON public.app_config
  FOR UPDATE TO authenticated USING (true);

-- App config: allow insert for initial seed (run as postgres or with service role)
CREATE POLICY "app_config_insert" ON public.app_config
  FOR INSERT WITH CHECK (true);

-- Notifications: read/update own (user_id = auth_id or user's internal id)
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text)
  );

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()::text
    OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text)
  );

-- ============================================================
-- TRIGGER: users.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
