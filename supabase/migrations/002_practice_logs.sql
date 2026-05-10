-- Practice logs: one row per session
CREATE TABLE IF NOT EXISTS public.practice_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration    INTEGER NOT NULL,          -- milliseconds
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_practice_logs_user_date ON public.practice_logs (user_id, date DESC);

ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own logs
CREATE POLICY "own practice logs"
  ON public.practice_logs
  FOR ALL
  USING (auth.uid() = user_id);
