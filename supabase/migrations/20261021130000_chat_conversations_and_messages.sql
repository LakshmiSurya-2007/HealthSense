-- Migration: Create chat_conversations and upgrade chat_messages
-- Supports saved AI conversations, title management, and conversation history

-- 1. Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) on chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conv_sel" ON chat_conversations;
DROP POLICY IF EXISTS "conv_ins" ON chat_conversations;
DROP POLICY IF EXISTS "conv_upd" ON chat_conversations;
DROP POLICY IF EXISTS "conv_del" ON chat_conversations;

CREATE POLICY "conv_sel" ON chat_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "conv_ins" ON chat_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_upd" ON chat_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_del" ON chat_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Add conversation_id column to chat_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Update RLS policies on chat_messages
DROP POLICY IF EXISTS "chat_sel" ON chat_messages;
DROP POLICY IF EXISTS "chat_ins" ON chat_messages;
DROP POLICY IF EXISTS "chat_del" ON chat_messages;

CREATE POLICY "chat_sel" ON chat_messages FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id AND (
      conversation_id IS NULL OR EXISTS (
        SELECT 1 FROM chat_conversations c
        WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "chat_ins" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      conversation_id IS NULL OR EXISTS (
        SELECT 1 FROM chat_conversations c
        WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "chat_del" ON chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
  ON chat_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created
  ON chat_messages(conversation_id, created_at ASC);
