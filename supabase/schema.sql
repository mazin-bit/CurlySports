-- Curly Sports Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables, indexes, and RLS policies

-- ============================================================
-- TABLES
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date TEXT,
  last_seen TIMESTAMPTZ,
  favorite_clubs JSONB DEFAULT '[]'::jsonb,
  favorite_players JSONB DEFAULT '[]'::jsonb,
  booked_tickets JSONB DEFAULT '{}'::jsonb,
  penalty_best INTEGER DEFAULT 0,
  super_over_best INTEGER DEFAULT 0,
  survey_interests JSONB,
  survey_completed BOOLEAN DEFAULT false,
  survey_skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read) WHERE read = false;

-- App config table (singleton)
CREATE TABLE IF NOT EXISTS public.app_config (
  id TEXT PRIMARY KEY DEFAULT 'app',
  feature_flags JSONB DEFAULT '[]'::jsonb,
  sa_admins JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  maintenance BOOLEAN DEFAULT false,
  health JSONB DEFAULT '{"server":"OK","db":"Connected","api":"OK","uptime":"99.9%"}'::jsonb,
  audit_log JSONB DEFAULT '[]'::jsonb,
  enabled_sports JSONB DEFAULT '{}'::jsonb,
  super_admin_emails JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default app config row
INSERT INTO public.app_config (id) VALUES ('app') ON CONFLICT (id) DO NOTHING;

-- Login logs
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_auth_id UUID,
  email TEXT DEFAULT '',
  display_name TEXT DEFAULT '',
  role TEXT DEFAULT 'member',
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_time ON public.login_logs(logged_at DESC);

-- ============================================================
-- AUTO-UPDATE TRIGGER for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_auth_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE auth_id = user_auth_id),
    'member'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check admin
CREATE OR REPLACE FUNCTION public.is_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role(user_auth_id) IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role(user_auth_id) = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users policies
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "users_admin_read_all" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id)
  WITH CHECK (
    auth.uid() = auth_id
    AND (
      -- Allow updating any column EXCEPT role: the new role must equal the existing role
      role = (SELECT u.role FROM public.users u WHERE u.auth_id = auth.uid())
    )
  );

CREATE POLICY "users_admin_update_others" ON public.users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- App config policies
CREATE POLICY "config_read_all" ON public.app_config
  FOR SELECT USING (true);

CREATE POLICY "config_update_admin" ON public.app_config
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "config_insert_admin" ON public.app_config
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Notifications policies
CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Login logs policies
CREATE POLICY "login_logs_admin_read" ON public.login_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "login_logs_insert_authenticated" ON public.login_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
