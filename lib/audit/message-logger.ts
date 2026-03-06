// lib/audit/message-logger.ts
// Application-level message audit logging utilities.
// These supplement the database triggers (which are the safety net) with
// richer metadata like sender_email, sender_role, IP, user_agent.

import { SupabaseClient } from '@supabase/supabase-js'
import { logActivityServer, ActivityActions, getRequestMetadata } from '@/lib/activity-logger'

interface ChatMessageLogParams {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_type: 'caregiver' | 'staff'
  content: string
  has_attachments: boolean
  attachment_count?: number
  conversation_type?: string
  subject?: string
  request?: Request
}

interface LegacyMessageLogParams {
  message_id: string
  from_id: string
  to_id: string
  content: string
  appointment_id?: string | null
  lab_order_id?: string | null
  request?: Request
}

interface MessageReadLogParams {
  message_ids: string[]
  conversation_id: string
  reader_id: string
  request?: Request
}

/**
 * Log a chat message sent via the chat_messages system.
 * Called from the POST /api/messages/[conversationId] handler.
 */
export async function logChatMessageSent(
  supabase: SupabaseClient,
  params: ChatMessageLogParams
): Promise<void> {
  const requestMeta = params.request ? getRequestMetadata(params.request) : {}

  await logActivityServer(supabase, {
    action: ActivityActions.MESSAGE_SEND,
    action_type: 'create',
    action_category: 'chat',
    target_table: 'chat_messages',
    target_id: params.message_id,
    resource_name: params.subject || `Conversation ${params.conversation_id}`,
    description: `Message sent in conversation ${params.conversation_id}`,
    metadata: {
      conversation_id: params.conversation_id,
      sender_type: params.sender_type,
      content_preview: params.content.substring(0, 200),
      content_length: params.content.length,
      has_attachments: params.has_attachments,
      attachment_count: params.attachment_count || 0,
      conversation_type: params.conversation_type || 'caregiver_staff',
      source: 'application',
    },
    status: 'success',
    ...requestMeta,
  }, { autoUser: true })
}

/**
 * Log a message sent via the legacy messages table.
 */
export async function logLegacyMessageSent(
  supabase: SupabaseClient,
  params: LegacyMessageLogParams
): Promise<void> {
  const requestMeta = params.request ? getRequestMetadata(params.request) : {}

  await logActivityServer(supabase, {
    user_id: params.from_id,
    action: ActivityActions.MESSAGE_SEND,
    action_type: 'create',
    action_category: 'chat',
    target_table: 'messages',
    target_id: params.message_id,
    description: `Legacy message sent to ${params.to_id}`,
    metadata: {
      from_id: params.from_id,
      to_id: params.to_id,
      content_preview: params.content.substring(0, 200),
      content_length: params.content.length,
      appointment_id: params.appointment_id || null,
      lab_order_id: params.lab_order_id || null,
      source: 'application',
    },
    status: 'success',
    ...requestMeta,
  }, { autoUser: false }) // user_id explicitly provided
}

/**
 * Log message read receipts (batch).
 */
export async function logMessagesRead(
  supabase: SupabaseClient,
  params: MessageReadLogParams
): Promise<void> {
  if (params.message_ids.length === 0) return

  const requestMeta = params.request ? getRequestMetadata(params.request) : {}

  await logActivityServer(supabase, {
    user_id: params.reader_id,
    action: ActivityActions.MESSAGE_READ,
    action_type: 'update',
    action_category: 'chat',
    target_table: 'chat_messages',
    target_id: params.message_ids[0], // Primary reference
    description: `${params.message_ids.length} message(s) read in conversation ${params.conversation_id}`,
    metadata: {
      conversation_id: params.conversation_id,
      message_count: params.message_ids.length,
      message_ids: params.message_ids,
      source: 'application',
    },
    status: 'success',
    ...requestMeta,
  }, { autoUser: false })
}
