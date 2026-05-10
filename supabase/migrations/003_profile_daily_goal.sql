-- Per-user daily practice goal (milliseconds). NULL = use client default.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goal_ms INTEGER
  CHECK (daily_goal_ms IS NULL OR (daily_goal_ms BETWEEN 600000 AND 7200000));
