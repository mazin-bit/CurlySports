-- Fix overly permissive update policies
-- Posts and comments should only be updatable via security-definer functions
-- (likes_count, comments_count, poll votes), not directly by any authenticated user.

-- Drop the overly permissive policies
drop policy if exists "posts_update" on posts;
drop policy if exists "comments_update" on post_comments;

-- Posts: only security-definer functions (toggle_post_like, cast_post_vote,
-- increment/decrement_comments_count) can update posts.
-- No direct user updates needed — content editing is not a feature.
-- If content editing is added later, restrict to: auth.uid() = user_id

-- Comments: same — only toggle_comment_like (security definer) updates likes_count.
-- No direct user updates allowed.
