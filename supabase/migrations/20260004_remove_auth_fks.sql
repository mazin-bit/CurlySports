-- Migration: Remove Supabase Auth dependencies from community tables
-- We're switching to JWT-based auth with Prisma users (cuid IDs)
-- All DB operations now use service role (bypasses RLS), so RLS is disabled

-- 1. Drop all RLS policies on affected tables
DO $$
DECLARE
  r RECORD;
  tables text[] := ARRAY['posts', 'post_likes', 'post_votes', 'post_comments', 'comment_likes', 'user_favorites', 'game_scores'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    FOR r IN (
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
      RAISE NOTICE 'Dropped policy % on %', r.policyname, t;
    END LOOP;
  END LOOP;
END $$;

-- 2. Disable RLS on affected tables (service role bypasses anyway)
ALTER TABLE IF EXISTS public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comment_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.game_scores DISABLE ROW LEVEL SECURITY;

-- 3. Drop all FK constraints that reference auth.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tc.table_schema, tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
    RAISE NOTICE 'Dropped FK constraint % on %.%', r.constraint_name, r.table_schema, r.table_name;
  END LOOP;
END $$;

-- 4. Convert user_id columns from uuid to text so they can store cuid strings
ALTER TABLE IF EXISTS public.posts ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.post_likes ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.post_votes ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.post_comments ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.comment_likes ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.user_favorites ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE IF EXISTS public.game_scores ALTER COLUMN user_id TYPE text USING user_id::text;
