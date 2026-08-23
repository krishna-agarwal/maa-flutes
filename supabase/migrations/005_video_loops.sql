-- Saved YouTube practice loops: one row per A/B loop a user saves
CREATE TABLE IF NOT EXISTS public.video_loops (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id       TEXT NOT NULL,                    -- YouTube 11-char video id
  title          TEXT NOT NULL DEFAULT '',         -- user label, defaults to the video title
  start_seconds  REAL NOT NULL,
  end_seconds    REAL NOT NULL,
  playback_rate  REAL NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT video_loops_range CHECK (start_seconds >= 0 AND end_seconds > start_seconds)
);

CREATE INDEX idx_video_loops_user_created ON public.video_loops (user_id, created_at DESC);

ALTER TABLE public.video_loops ENABLE ROW LEVEL SECURITY;

-- Users can only access their own loops
CREATE POLICY "own video loops"
  ON public.video_loops
  FOR ALL
  USING (auth.uid() = user_id);
