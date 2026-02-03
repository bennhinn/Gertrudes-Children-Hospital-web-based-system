import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch messages for a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { conversationId } = await params

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .single()

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        if (conversation.caregiver_id !== user.id && conversation.staff_id !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Fetch messages
        const { data: messages, error: msgError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })

        if (msgError) {
            console.error('Error fetching messages:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        // Mark unread messages as read
        const unreadIds = (messages || [])
            .filter(m => !m.is_read && m.sender_id !== user.id)
            .map(m => m.id)

        if (unreadIds.length > 0) {
            await supabase
                .from('chat_messages')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .in('id', unreadIds)
        }

        // Transform to camelCase for frontend
        const transformedMessages = (messages || []).map(m => ({
            id: m.id,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            senderType: m.sender_type,
            content: m.content,
            createdAt: m.created_at,
            isRead: m.is_read,
            readAt: m.read_at,
            attachments: m.attachments
        }))

        return NextResponse.json({ messages: transformedMessages })
    } catch (error) {
        console.error('Error in GET /api/messages/[conversationId]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Send a message to a conversation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { conversationId } = await params
        const body = await request.json()
        const { content, attachments } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
        }

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .single()

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        if (conversation.caregiver_id !== user.id && conversation.staff_id !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Determine sender type
        const senderType = conversation.caregiver_id === user.id ? 'caregiver' : 'staff'

        // Create the message
        const { data: message, error: msgError } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                sender_type: senderType,
                content: content.trim(),
                attachments: attachments || [],
                is_read: false,
            })
            .select()
            .single()

        if (msgError) {
            console.error('Error creating message:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        return NextResponse.json({ message }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/messages/[conversationId]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
