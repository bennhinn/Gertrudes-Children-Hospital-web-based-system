-- Create chat_conversations table (separate from existing messages table)
-- Supports: caregiver-to-staff AND staff-to-staff messaging
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- For caregiver conversations (nullable for staff-to-staff)
  caregiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Primary staff member
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_type TEXT NOT NULL CHECK (staff_type IN ('doctor', 'lab', 'pharmacy', 'support', 'nurse', 'receptionist', 'reception', 'admin')),
  -- Secondary staff member (for staff-to-staff conversations)
  staff_id_2 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_type_2 TEXT CHECK (staff_type_2 IN ('doctor', 'lab', 'pharmacy', 'support', 'nurse', 'receptionist', 'reception', 'admin')),
  -- Conversation type
  conversation_type TEXT DEFAULT 'caregiver_staff' CHECK (conversation_type IN ('caregiver_staff', 'staff_staff')),
  child_id UUID,
  subject TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns if table already exists (for existing databases)
DO $$
BEGIN
  -- Add staff_id_2 column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chat_conversations' AND column_name = 'staff_id_2') THEN
    ALTER TABLE chat_conversations ADD COLUMN staff_id_2 UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  -- Add staff_type_2 column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chat_conversations' AND column_name = 'staff_type_2') THEN
    ALTER TABLE chat_conversations ADD COLUMN staff_type_2 TEXT CHECK (staff_type_2 IN ('doctor', 'lab', 'pharmacy', 'support', 'nurse', 'receptionist', 'reception', 'admin'));
  END IF;
  
  -- Add conversation_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chat_conversations' AND column_name = 'conversation_type') THEN
    ALTER TABLE chat_conversations ADD COLUMN conversation_type TEXT DEFAULT 'caregiver_staff' CHECK (conversation_type IN ('caregiver_staff', 'staff_staff'));
  END IF;
END $$;

-- Add foreign key to children table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'children') THEN
    ALTER TABLE chat_conversations 
    ADD CONSTRAINT fk_chat_conversations_child 
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('caregiver', 'staff')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_caregiver ON chat_conversations(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_staff ON chat_conversations(staff_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_staff_2 ON chat_conversations(staff_id_2);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Caregivers can view own chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Staff can view assigned chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Caregivers can create chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Staff can create staff_staff chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Staff can create caregiver_staff chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Participants can update chat_conversations" ON chat_conversations;

-- Caregivers can see their own conversations
CREATE POLICY "Caregivers can view own chat_conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

-- Staff can see conversations assigned to them (as staff_id or staff_id_2)
CREATE POLICY "Staff can view assigned chat_conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid() OR staff_id_2 = auth.uid());

-- Caregivers can create conversations
CREATE POLICY "Caregivers can create chat_conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

-- Staff can create staff-to-staff conversations
CREATE POLICY "Staff can create staff_staff chat_conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_type = 'staff_staff' AND 
    (staff_id = auth.uid() OR staff_id_2 = auth.uid())
  );

-- Staff can create conversations with caregivers
CREATE POLICY "Staff can create caregiver_staff chat_conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_type = 'caregiver_staff' AND 
    staff_id = auth.uid() AND 
    caregiver_id IS NOT NULL
  );

-- Caregivers and staff can update their conversations
CREATE POLICY "Participants can update chat_conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (caregiver_id = auth.uid() OR staff_id = auth.uid() OR staff_id_2 = auth.uid());

-- RLS Policies for chat_messages
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view chat_messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send chat_messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update chat_messages" ON chat_messages;

-- Users can view messages in their conversations
CREATE POLICY "Users can view chat_messages in their conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.caregiver_id = auth.uid() OR c.staff_id = auth.uid() OR c.staff_id_2 = auth.uid())
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send chat_messages in their conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.caregiver_id = auth.uid() OR c.staff_id = auth.uid() OR c.staff_id_2 = auth.uid())
    )
  );

-- Users can update messages (mark as read)
CREATE POLICY "Users can update chat_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.caregiver_id = auth.uid() OR c.staff_id = auth.uid() OR c.staff_id_2 = auth.uid())
    )
  );

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_chat_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when new message is added
DROP TRIGGER IF EXISTS trigger_update_chat_conversation_last_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_last_message();

-- Enable real-time for chat tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Drop and recreate view for conversation with last message preview
DROP VIEW IF EXISTS chat_conversation_previews;

-- Create view for conversation with last message preview
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'children') THEN
    EXECUTE '
      CREATE OR REPLACE VIEW chat_conversation_previews AS
      SELECT 
        c.id,
        c.caregiver_id,
        c.staff_id,
        c.staff_type,
        c.staff_id_2,
        c.staff_type_2,
        c.conversation_type,
        c.child_id,
        c.subject,
        c.status,
        c.last_message_at,
        c.created_at,
        ch.full_name as child_name,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.staff_id) as staff_name,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.staff_id_2) as staff_name_2,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.caregiver_id) as caregiver_name,
        (SELECT m.content FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_id != c.caregiver_id) as unread_count
      FROM chat_conversations c
      LEFT JOIN children ch ON ch.id = c.child_id
    ';
  ELSE
    EXECUTE '
      CREATE OR REPLACE VIEW chat_conversation_previews AS
      SELECT 
        c.id,
        c.caregiver_id,
        c.staff_id,
        c.staff_type,
        c.staff_id_2,
        c.staff_type_2,
        c.conversation_type,
        c.child_id,
        c.subject,
        c.status,
        c.last_message_at,
        c.created_at,
        NULL::text as child_name,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.staff_id) as staff_name,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.staff_id_2) as staff_name_2,
        (SELECT p.full_name FROM profiles p WHERE p.id = c.caregiver_id) as caregiver_name,
        (SELECT m.content FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_id != c.caregiver_id) as unread_count
      FROM chat_conversations c
    ';
  END IF;
END $$;

-- Grant access to the view
GRANT SELECT ON chat_conversation_previews TO authenticated;
