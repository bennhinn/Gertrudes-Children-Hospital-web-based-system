-- =============================================================================
-- Migration: Auto-audit chat messages & legacy messages via database triggers
-- Purpose:   Ensure EVERY message in the system is captured in audit_logs,
--            even if application-level logging fails or is bypassed.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Trigger function for chat_messages (new messaging system)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_chat_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    action_type,
    action_category,
    target_table,
    target_id,
    description,
    metadata,
    status,
    created_at
  ) VALUES (
    NEW.sender_id,
    'message_send',
    'create',
    'chat',
    'chat_messages',
    NEW.id,
    'Chat message sent in conversation ' || NEW.conversation_id::text,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_type', NEW.sender_type,
      'content_preview', LEFT(NEW.content, 200),
      'content_length', LENGTH(NEW.content),
      'has_attachments', (NEW.attachments IS NOT NULL AND NEW.attachments != '[]'::jsonb),
      'trigger_source', 'database'
    ),
    'success',
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block message delivery due to audit failure
  RAISE WARNING 'audit_chat_message_insert trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_audit_chat_messages ON chat_messages;
CREATE TRIGGER trg_audit_chat_messages
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION audit_chat_message_insert();

-- ---------------------------------------------------------------------------
-- 2. Trigger function for messages (legacy messaging system)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_legacy_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    action_type,
    action_category,
    target_table,
    target_id,
    description,
    metadata,
    status,
    created_at
  ) VALUES (
    NEW.from_id,
    'message_send',
    'create',
    'chat',
    'messages',
    NEW.id,
    'Legacy message sent from ' || COALESCE(NEW.from_id::text, 'unknown') || ' to ' || COALESCE(NEW.to_id::text, 'unknown'),
    jsonb_build_object(
      'from_id', NEW.from_id,
      'to_id', NEW.to_id,
      'content_preview', LEFT(NEW.content, 200),
      'content_length', LENGTH(NEW.content),
      'appointment_id', NEW.appointment_id,
      'lab_order_id', NEW.lab_order_id,
      'trigger_source', 'database'
    ),
    'success',
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'audit_legacy_message_insert trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_audit_legacy_messages ON messages;
CREATE TRIGGER trg_audit_legacy_messages
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION audit_legacy_message_insert();

-- ---------------------------------------------------------------------------
-- 3. Trigger for chat message read receipts
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_chat_message_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when is_read changes from false to true
  IF OLD.is_read = false AND NEW.is_read = true THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      action_type,
      action_category,
      target_table,
      target_id,
      description,
      metadata,
      status,
      created_at
    ) VALUES (
      NEW.sender_id,  -- The reader's ID isn't on the message; app-level logging captures this
      'message_read',
      'update',
      'chat',
      'chat_messages',
      NEW.id,
      'Message marked as read in conversation ' || NEW.conversation_id::text,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'read_at', NEW.read_at,
        'trigger_source', 'database'
      ),
      'success',
      NOW()
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'audit_chat_message_read trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_audit_chat_message_read ON chat_messages;
CREATE TRIGGER trg_audit_chat_message_read
  AFTER UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION audit_chat_message_read();

-- ---------------------------------------------------------------------------
-- 4. Performance indexes for audit log queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category_created
  ON audit_logs (action_category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_chat_created
  ON audit_logs (created_at DESC)
  WHERE action_category = 'chat';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON audit_logs (target_table, target_id);
