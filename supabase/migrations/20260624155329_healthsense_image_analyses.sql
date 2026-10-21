-- image_analyses table for Analyze page
CREATE TABLE IF NOT EXISTS image_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_name text,
  image_size int,
  condition_name text,
  confidence int,
  description text,
  possible_causes text[],
  recommendations text[],
  doctor_advice text,
  raw_response text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ia_sel" ON image_analyses;
DROP POLICY IF EXISTS "ia_ins" ON image_analyses;
DROP POLICY IF EXISTS "ia_del" ON image_analyses;
CREATE POLICY "ia_sel" ON image_analyses FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "ia_ins" ON image_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "ia_del" ON image_analyses FOR DELETE TO authenticated USING (auth.uid()=user_id);
