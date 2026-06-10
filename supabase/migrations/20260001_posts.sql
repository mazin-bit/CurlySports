-- ─── Posts system for Debates feed ───────────────────────────────────────────
-- Run this in your Supabase SQL editor to enable persistent posts/debates
--
-- NOTE: After running this SQL, also create a Supabase Storage bucket named
-- "post-images" with public read access for image uploads to work.

-- Posts table (Twitter-style)
create table if not exists posts (
  id            uuid        not null default gen_random_uuid() primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  author_name   text        not null,
  content       text        not null,
  sport         text        not null default 'football',
  tag           text        not null default 'DEBATE',
  image_url     text,
  -- poll JSON: {options: string[], votes: number[]} — null when no poll
  poll          jsonb,
  likes_count   int         not null default 0,
  comments_count int        not null default 0,
  created_at    timestamptz not null default now()
);

-- Post likes (unique per user per post)
create table if not exists post_likes (
  post_id    uuid        not null references posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Poll votes (one vote per user per post)
create table if not exists post_votes (
  post_id      uuid        not null references posts(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  option_index int         not null,
  created_at   timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Comments
create table if not exists post_comments (
  id           uuid        not null default gen_random_uuid() primary key,
  post_id      uuid        not null references posts(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  author_name  text        not null,
  content      text        not null,
  likes_count  int         not null default 0,
  created_at   timestamptz not null default now()
);

-- Comment likes
create table if not exists comment_likes (
  comment_id uuid        not null references post_comments(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists posts_sport_created on posts(sport, created_at desc);
create index if not exists posts_user on posts(user_id);
create index if not exists comments_post on post_comments(post_id, created_at asc);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table posts         enable row level security;
alter table post_likes    enable row level security;
alter table post_votes    enable row level security;
alter table post_comments enable row level security;
alter table comment_likes enable row level security;

-- Posts: anyone can read, authenticated users can insert/delete own
create policy "posts_select"  on posts for select using (true);
create policy "posts_insert"  on posts for insert with check (auth.uid() = user_id);
create policy "posts_delete"  on posts for delete using (auth.uid() = user_id);
create policy "posts_update"  on posts for update using (true);  -- for likes_count/comments_count updates via functions

-- Likes
create policy "post_likes_select" on post_likes for select using (true);
create policy "post_likes_insert" on post_likes for insert with check (auth.uid() = user_id);
create policy "post_likes_delete" on post_likes for delete using (auth.uid() = user_id);

-- Votes
create policy "post_votes_select" on post_votes for select using (true);
create policy "post_votes_insert" on post_votes for insert with check (auth.uid() = user_id);

-- Comments
create policy "comments_select" on post_comments for select using (true);
create policy "comments_insert" on post_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on post_comments for delete using (auth.uid() = user_id);
create policy "comments_update" on post_comments for update using (true);

-- Comment likes
create policy "clikes_select" on comment_likes for select using (true);
create policy "clikes_insert" on comment_likes for insert with check (auth.uid() = user_id);
create policy "clikes_delete" on comment_likes for delete using (auth.uid() = user_id);

-- ─── Helper functions (security definer = run as owner, bypasses RLS) ─────────

-- Toggle like on a post; returns new liked state (true/false)
create or replace function toggle_post_like(p_post_id uuid, p_user_id uuid)
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

-- Cast a poll vote; raises exception if already voted
create or replace function cast_post_vote(p_post_id uuid, p_user_id uuid, p_option_index int)
returns void
language plpgsql security definer as $$
begin
  if exists(select 1 from post_votes where post_id = p_post_id and user_id = p_user_id) then
    raise exception 'already_voted';
  end if;

  insert into post_votes(post_id, user_id, option_index)
  values (p_post_id, p_user_id, p_option_index);

  -- Increment vote count in the poll JSON array
  update posts
  set poll = jsonb_set(
    poll,
    array['votes', p_option_index::text],
    (coalesce(poll->'votes'->p_option_index, '0')::int + 1)::text::jsonb
  )
  where id = p_post_id;
end; $$;

-- Increment comments_count when a comment is added
create or replace function increment_comments_count()
returns trigger language plpgsql security definer as $$
begin
  update posts set comments_count = comments_count + 1 where id = new.post_id;
  return new;
end; $$;

create trigger after_comment_insert
  after insert on post_comments
  for each row execute function increment_comments_count();

-- Decrement comments_count when a comment is deleted
create or replace function decrement_comments_count()
returns trigger language plpgsql security definer as $$
begin
  update posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  return old;
end; $$;

create trigger after_comment_delete
  after delete on post_comments
  for each row execute function decrement_comments_count();

-- Toggle comment like
create or replace function toggle_comment_like(p_comment_id uuid, p_user_id uuid)
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
