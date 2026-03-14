-- Curly Sports – Seed data
-- Run this AFTER schema.sql in Supabase Dashboard → SQL Editor.
-- Inserts the single app_config row so the app can load settings.

INSERT INTO public.app_config (
  id,
  feature_flags,
  sa_admins,
  permissions,
  maintenance,
  health,
  audit_log,
  enabled_sports,
  super_admin_emails,
  updated_at
) VALUES (
  'app',
  '[
    {"key":"live_scores","label":"Live scores","description":"Show live scores to members","enabled":true},
    {"key":"streaks","label":"Streaks","description":"Enable streak tracking","enabled":true},
    {"key":"favorites","label":"Favorites","description":"Allow favorites (teams/players)","enabled":true},
    {"key":"leaderboard","label":"Leaderboard","description":"Show streak leaderboard","enabled":true},
    {"key":"news","label":"News","description":"Show news & updates","enabled":true}
  ]'::jsonb,
  '[]'::jsonb,
  '[
    {"key":"admin_manage_users","label":"Manage users (view, ban, suspend)","enabled":true},
    {"key":"admin_view_leaderboard","label":"View streak leaderboard","enabled":true},
    {"key":"admin_engagement","label":"View engagement analytics","enabled":true},
    {"key":"admin_reset_streak","label":"Reset user streak","enabled":true}
  ]'::jsonb,
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
