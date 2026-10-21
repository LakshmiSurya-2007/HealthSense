-- HealthSense AI: Health Assessments and Report-Specific Chat Migration
-- Creates health_assessments table, adds report_id to chat_conversations,
-- and configures complete Row Level Security (RLS) policies.

-- 1. Create health_assessments table
CREATE TABLE IF NOT EXISTS public.health_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date timestamptz NOT NULL DEFAULT now(),
  assessment_type text NOT NULL DEFAULT 'comprehensive_risk',
  health_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  diabetes_risk numeric NOT NULL DEFAULT 0,
  heart_risk numeric NOT NULL DEFAULT 0,
  hypertension_risk numeric NOT NULL DEFAULT 0,
  kidney_risk numeric NOT NULL DEFAULT 0,
  input_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_predictions jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  complete_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.health_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "ha_sel_own" ON public.health_assessments;
DROP POLICY IF EXISTS "ha_ins_own" ON public.health_assessments;
DROP POLICY IF EXISTS "ha_upd_own" ON public.health_assessments;
DROP POLICY IF EXISTS "ha_del_own" ON public.health_assessments;

-- RLS: Authenticated users can ONLY view, insert, update, and delete their own assessments
CREATE POLICY "ha_sel_own" ON public.health_assessments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ha_ins_own" ON public.health_assessments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ha_upd_own" ON public.health_assessments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ha_del_own" ON public.health_assessments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Performance indexes for health_assessments
CREATE INDEX IF NOT EXISTS idx_health_assessments_user_created
  ON public.health_assessments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_assessments_user_score
  ON public.health_assessments(user_id, health_score);

-- 2. Ensure chat_conversations table exists
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add report_id column to chat_conversations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'report_id'
  ) THEN
    ALTER TABLE public.chat_conversations ADD COLUMN report_id uuid REFERENCES public.health_assessments(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_sel" ON public.chat_conversations;
DROP POLICY IF EXISTS "conv_ins" ON public.chat_conversations;
DROP POLICY IF EXISTS "conv_upd" ON public.chat_conversations;
DROP POLICY IF EXISTS "conv_del" ON public.chat_conversations;

CREATE POLICY "conv_sel" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "conv_ins" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conv_upd" ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conv_del" ON public.chat_conversations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
  ON public.chat_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_report
  ON public.chat_conversations(user_id, report_id);

-- 3. Ensure chat_messages table exists with conversation_id
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','model')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure conversation_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.chat_messages ADD COLUMN conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_sel" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_ins" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_del" ON public.chat_messages;

CREATE POLICY "chat_sel" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chat_ins" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_del" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON public.chat_messages(conversation_id, created_at ASC);

-- 4. Backward-compatible tables (predictions and health_records)
CREATE TABLE IF NOT EXISTS public.health_records (
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
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_sel" ON public.health_records;
DROP POLICY IF EXISTS "hr_ins" ON public.health_records;
DROP POLICY IF EXISTS "hr_del" ON public.health_records;
CREATE POLICY "hr_sel" ON public.health_records FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "hr_ins" ON public.health_records FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "hr_del" ON public.health_records FOR DELETE TO authenticated USING (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  health_record_id uuid REFERENCES public.health_records(id) ON DELETE SET NULL,
  diabetes_risk numeric NOT NULL DEFAULT 0,
  heart_risk numeric NOT NULL DEFAULT 0,
  kidney_risk numeric NOT NULL DEFAULT 0,
  hypertension_risk numeric NOT NULL DEFAULT 0,
  health_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pred_sel" ON public.predictions;
DROP POLICY IF EXISTS "pred_ins" ON public.predictions;
DROP POLICY IF EXISTS "pred_del" ON public.predictions;
CREATE POLICY "pred_sel" ON public.predictions FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "pred_ins" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "pred_del" ON public.predictions FOR DELETE TO authenticated USING (auth.uid()=user_id);

-- 5. Profiles table and user signup trigger
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prof_sel" ON public.profiles;
DROP POLICY IF EXISTS "prof_ins" ON public.profiles;
DROP POLICY IF EXISTS "prof_upd" ON public.profiles;
CREATE POLICY "prof_sel" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=id);
CREATE POLICY "prof_ins" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);
CREATE POLICY "prof_upd" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

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
