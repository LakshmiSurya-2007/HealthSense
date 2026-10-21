-- HealthSense AI — Complete Schema
-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_sel" ON profiles;
DROP POLICY IF EXISTS "prof_ins" ON profiles;
DROP POLICY IF EXISTS "prof_upd" ON profiles;
CREATE POLICY "prof_sel" ON profiles FOR SELECT TO authenticated USING (auth.uid()=id);
CREATE POLICY "prof_ins" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);
CREATE POLICY "prof_upd" ON profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

-- health_records
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  age int, gender text, height_cm numeric, weight_kg numeric, bmi numeric,
  glucose numeric, blood_pressure_sys int, blood_pressure_dia int,
  cholesterol numeric, heart_rate int,
  smoking_status text, alcohol_consumption text,
  sleep_hours numeric, physical_activity text,
  family_diabetes boolean DEFAULT false,
  family_heart boolean DEFAULT false,
  family_hypertension boolean DEFAULT false,
  family_kidney boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hr_sel" ON health_records;
DROP POLICY IF EXISTS "hr_ins" ON health_records;
DROP POLICY IF EXISTS "hr_del" ON health_records;
CREATE POLICY "hr_sel" ON health_records FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "hr_ins" ON health_records FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "hr_del" ON health_records FOR DELETE TO authenticated USING (auth.uid()=user_id);

-- predictions
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  health_record_id uuid REFERENCES health_records(id) ON DELETE SET NULL,
  diabetes_risk numeric NOT NULL DEFAULT 0,
  heart_risk numeric NOT NULL DEFAULT 0,
  kidney_risk numeric NOT NULL DEFAULT 0,
  hypertension_risk numeric NOT NULL DEFAULT 0,
  health_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pred_sel" ON predictions;
DROP POLICY IF EXISTS "pred_ins" ON predictions;
DROP POLICY IF EXISTS "pred_del" ON predictions;
CREATE POLICY "pred_sel" ON predictions FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "pred_ins" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "pred_del" ON predictions FOR DELETE TO authenticated USING (auth.uid()=user_id);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_sel" ON chat_messages;
DROP POLICY IF EXISTS "chat_ins" ON chat_messages;
DROP POLICY IF EXISTS "chat_del" ON chat_messages;
CREATE POLICY "chat_sel" ON chat_messages FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "chat_ins" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "chat_del" ON chat_messages FOR DELETE TO authenticated USING (auth.uid()=user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
