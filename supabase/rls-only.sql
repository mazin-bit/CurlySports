-- Run this in Supabase SQL Editor AFTER Prisma migrations have created the tables.
-- Enables RLS and policies so the app (Supabase JS client) can access data correctly.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_select_admin" ON public.users;
CREATE POLICY "users_select_admin" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth_id = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_admin" ON public.users;
CREATE POLICY "users_update_admin" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "login_logs_insert" ON public.login_logs;
CREATE POLICY "login_logs_insert" ON public.login_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "login_logs_select_admin" ON public.login_logs;
CREATE POLICY "login_logs_select_admin" ON public.login_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid()::text AND u.role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "app_config_select" ON public.app_config;
CREATE POLICY "app_config_select" ON public.app_config FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "app_config_update" ON public.app_config;
CREATE POLICY "app_config_update" ON public.app_config FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "app_config_insert" ON public.app_config;
CREATE POLICY "app_config_insert" ON public.app_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()::text OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text)
);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid()::text OR user_id IN (SELECT id::text FROM public.users WHERE auth_id = auth.uid()::text)
);
