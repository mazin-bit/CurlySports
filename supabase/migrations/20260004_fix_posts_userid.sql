-- ─── Fix posts system: remove auth.users FK dependency ──────────────────────
-- The app now uses JWT + Prisma auth with cuid user IDs (text), NOT Supabase
-- Auth UUIDs. This migration changes user_id columns from uuid→text and drops
-- the foreign key constraints to auth.users so any string user ID works.
--
-- Run this in your Supabase SQL editor.

-- 1. Drop dependent triggers first
drop trigger if exists after_comment_insert on post_comments;
drop trigger if exists after_comment_delete on post_comments;

-- 2. Drop dependent functions
drop function if exists toggle_post_like(uuid, uuid);
drop function if exists cast_post_vote(uuid, uuid, int);
drop function if exists toggle_comment_like(uuid, uuid);
drop function if exists increment_comments_count();
drop function if exists decrement_comments_count();

-- 3. Drop existing RLS policies (we'll recreate them)
drop policy if exists "posts_select"       on posts;
drop policy if exists "posts_insert"       on posts;
drop policy if exists "posts_delete"       on posts;
drop policy if exists "posts_update"       on posts;
drop policy if exists "post_likes_select"  on post_likes;
drop policy if exists "post_likes_insert"  on post_likes;
drop policy if exists "post_likes_delete"  on post_likes;
drop policy if exists "post_votes_select"  on post_votes;
drop policy if exists "post_votes_insert"  on post_votes;
drop policy if exists "comments_select"    on post_comments;
drop policy if exists "comments_insert"    on post_comments;
drop policy if exists "comments_delete"    on post_comments;
drop policy if exists "comments_update"    on post_comments;
drop policy if exists "clikes_select"      on comment_likes;
drop policy if exists "clikes_insert"      on comment_likes;
drop policy if exists "clikes_delete"      on comment_likes;

-- 4. Drop foreign key constraints and change column types
-- post_comments depends on posts, comment_likes depends on post_comments
-- post_likes and post_votes depend on posts

-- comment_likes
alter table comment_likes
  drop constraint if exists comment_likes_user_id_fkey,
  alter column user_id type text using user_id::text;

-- post_comments
alter table post_comments
  drop constraint if exists post_comments_user_id_fkey,
  alter column user_id type text using user_id::text;

-- post_likes
alter table post_likes
  drop constraint if exists post_likes_user_id_fkey,
  alter column user_id type text using user_id::text;

-- post_votes
alter table post_votes
  drop constraint if exists post_votes_user_id_fkey,
  alter column user_id type text using user_id::text;

-- posts (main table)
alter table posts
  drop constraint if exists posts_user_id_fkey,
  alter column user_id type text using user_id::text;

-- 5. Recreate RLS policies (using service role, so open policies are fine)
-- Service role bypasses RLS anyway, but keep policies for safety
create policy "posts_select"  on posts for select using (true);
create policy "posts_insert"  on posts for insert with check (true);
create policy "posts_delete"  on posts for delete using (true);
create policy "posts_update"  on posts for update using (true);

create policy "post_likes_select" on post_likes for select using (true);
create policy "post_likes_insert" on post_likes for insert with check (true);
create policy "post_likes_delete" on post_likes for delete using (true);

create policy "post_votes_select" on post_votes for select using (true);
create policy "post_votes_insert" on post_votes for insert with check (true);

create policy "comments_select" on post_comments for select using (true);
create policy "comments_insert" on post_comments for insert with check (true);
create policy "comments_delete" on post_comments for delete using (true);
create policy "comments_update" on post_comments for update using (true);

create policy "clikes_select" on comment_likes for select using (true);
create policy "clikes_insert" on comment_likes for insert with check (true);
create policy "clikes_delete" on comment_likes for delete using (true);

-- 6. Recreate helper functions with text user_id type

create or replace function toggle_post_like(p_post_id uuid, p_user_id text)
returns boolean
language plpgsql security definer as $$
declare
  already boolean;
begin
  select exists(
    select 1 from post_likes where post_id = p_post_id and user_id = p_user_id
  ) into already;

  if already then
    delete from post_likes where post_id = p_post_id and user_id = p_user_id;
    update posts set likes_count = greatest(0, likes_count - 1) where id = p_post_id;
    return false;
  else
    insert into post_likes(post_id, user_id) values (p_post_id, p_user_id);
    update posts set likes_count = likes_count + 1 where id = p_post_id;
    return true;
  end if;
end; $$;

create or replace function cast_post_vote(p_post_id uuid, p_user_id text, p_option_index int)
returns void
language plpgsql security definer as $$
begin
  if exists(select 1 from post_votes where post_id = p_post_id and user_id = p_user_id) then
    raise exception 'already_voted';
  end if;

  insert into post_votes(post_id, user_id, option_index)
  values (p_post_id, p_user_id, p_option_index);

  update posts
  set poll = jsonb_set(
    poll,
    array['votes', p_option_index::text],
    (coalesce(poll->'votes'->p_option_index, '0')::int + 1)::text::jsonb
  )
  where id = p_post_id;
end; $$;

create or replace function increment_comments_count()
returns trigger language plpgsql security definer as $$
begin
  update posts set comments_count = comments_count + 1 where id = new.post_id;
  return new;
end; $$;

create trigger after_comment_insert
  after insert on post_comments
  for each row execute function increment_comments_count();

create or replace function decrement_comments_count()
returns trigger language plpgsql security definer as $$
begin
  update posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  return old;
end; $$;

create trigger after_comment_delete
  after delete on post_comments
  for each row execute function decrement_comments_count();

create or replace function toggle_comment_like(p_comment_id uuid, p_user_id text)
returns boolean
language plpgsql security definer as $$
declare
  already boolean;
begin
  select exists(
    select 1 from comment_likes where comment_id = p_comment_id and user_id = p_user_id
  ) into already;

  if already then
    delete from comment_likes where comment_id = p_comment_id and user_id = p_user_id;
    update post_comments set likes_count = greatest(0, likes_count - 1) where id = p_comment_id;
    return false;
  else
    insert into comment_likes(comment_id, user_id) values (p_comment_id, p_user_id);
    update post_comments set likes_count = likes_count + 1 where id = p_comment_id;
    return true;
  end if;
end; $$;

-- 7. Fix game_scores and user_favorites tables (same FK issue)

-- game_scores
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'game_scores') then
    -- Drop all RLS policies
    execute (select string_agg('drop policy if exists ' || quote_ident(policyname) || ' on public.game_scores;', ' ')
             from pg_policies where schemaname = 'public' and tablename = 'game_scores');
    -- Drop FK and change type
    alter table game_scores drop constraint if exists game_scores_user_id_fkey;
    alter table game_scores alter column user_id type text using user_id::text;
    -- Disable RLS (service role bypasses anyway)
    alter table game_scores disable row level security;
  end if;
end $$;

-- user_favorites
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_favorites') then
    execute (select string_agg('drop policy if exists ' || quote_ident(policyname) || ' on public.user_favorites;', ' ')
             from pg_policies where schemaname = 'public' and tablename = 'user_favorites');
    alter table user_favorites drop constraint if exists user_favorites_user_id_fkey;
    alter table user_favorites alter column user_id type text using user_id::text;
    alter table user_favorites disable row level security;
  end if;
end $$;
