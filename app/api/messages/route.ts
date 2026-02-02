import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch conversations for the current user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isCaregiver = profile?.role === 'caregiver'
        const isStaff = ['doctor', 'pharmacist', 'lab_tech', 'receptionist', 'admin'].includes(profile?.role || '')

        // Fetch conversations with previews
        let query = supabase
            .from('chat_conversations')
            .select(`
        id,
        caregiver_id,
        staff_id,
        staff_type,
        staff_id_2,
        staff_type_2,
        conversation_type,
        child_id,
        subject,
        status,
        last_message_at,
        created_at,
        chat_messages(
          id,
          content,
          sender_id,
          sender_type,
          is_read,
          created_at
        )
      `)
            .order('last_message_at', { ascending: false })

        if (isCaregiver) {
            query = query.eq('caregiver_id', user.id)
        } else if (isStaff) {
            // Staff can see conversations where they are staff_id OR staff_id_2
            query = query.or(`staff_id.eq.${user.id},staff_id_2.eq.${user.id}`)
        }

        const { data: conversations, error } = await query

        if (error) {
            console.error('Error fetching conversations:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get staff/caregiver names
        const conversationsWithNames = await Promise.all(
            (conversations || []).map(async (conv: any) => {
                let otherName = 'Unknown'
                let childName = null
                const convType = conv.conversation_type || 'caregiver_staff'

                if (isCaregiver) {
                    // Caregiver sees staff name
                    if (conv.staff_id) {
                        const { data: staffProfile } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .eq('id', conv.staff_id)
                            .single()
                        otherName = staffProfile?.full_name || 'Unknown'
                    }
                } else if (isStaff) {
                    // Staff user - determine who the other party is
                    if (convType === 'staff_staff') {
                        // Staff-to-staff: show the other staff member's name
                        const otherStaffId = conv.staff_id === user.id ? conv.staff_id_2 : conv.staff_id
                        if (otherStaffId) {
                            const { data: otherStaffProfile } = await supabase
                                .from('profiles')
                                .select('full_name')
                                .eq('id', otherStaffId)
                                .single()
                            otherName = otherStaffProfile?.full_name || 'Unknown'
                        }
                    } else {
                        // Caregiver-to-staff: show caregiver name
                        if (conv.caregiver_id) {
                            const { data: caregiverProfile } = await supabase
                                .from('profiles')
                                .select('full_name')
                                .eq('id', conv.caregiver_id)
                                .single()
                            otherName = caregiverProfile?.full_name || 'Unknown'
                        }
                    }
                }

                // Fetch child name if child_id exists
                if (conv.child_id) {
                    const { data: childData } = await supabase
                        .from('children')
                        .select('full_name')
                        .eq('id', conv.child_id)
                        .single()
                    childName = childData?.full_name || null
                }

                // Get last message and unread count
                const messages = conv.chat_messages || []
                const sortedMessages = messages.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                const lastMessage = sortedMessages[0]
                const unreadCount = messages.filter((m: any) =>
                    !m.is_read && m.sender_id !== user.id
                ).length

                // Return different structure for caregiver vs staff
                if (isCaregiver) {
                    return {
                        id: conv.id,
                        staffId: conv.staff_id,
                        staffName: otherName,
                        staffType: conv.staff_type,
                        childId: conv.child_id,
                        childName,
                        lastMessage: lastMessage?.content || 'No messages yet',
                        lastMessageTime: lastMessage?.created_at || conv.created_at,
                        unreadCount,
                        status: conv.status,
                        subject: conv.subject,
                        conversationType: convType,
                    }
                } else {
                    // For staff users
                    const isStaffStaff = convType === 'staff_staff'
                    const otherStaffType = conv.staff_id === user.id ? conv.staff_type_2 : conv.staff_type

                    return {
                        id: conv.id,
                        caregiverId: isStaffStaff ? null : conv.caregiver_id,
                        caregiverName: isStaffStaff ? null : otherName,
                        otherStaffId: isStaffStaff ? (conv.staff_id === user.id ? conv.staff_id_2 : conv.staff_id) : null,
                        otherStaffName: isStaffStaff ? otherName : null,
                        otherStaffType: isStaffStaff ? otherStaffType : null,
                        childId: conv.child_id,
                        childName,
                        lastMessage: lastMessage?.content || 'No messages yet',
                        lastMessageTime: lastMessage?.created_at || conv.created_at,
                        unreadCount,
                        status: conv.status,
                        subject: conv.subject,
                        conversationType: convType,
                    }
                }
            })
        )

        return NextResponse.json({ conversations: conversationsWithNames })
    } catch (error) {
        console.error('Error in GET /api/messages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const body = await request.json()
        const { staffId, staffType, staffId2, staffType2, childId, subject, initialMessage, conversationType } = body

        const isStaffStaff = conversationType === 'staff_staff'
        const isCaregiver = profile?.role === 'caregiver'

        if (!initialMessage) {
            return NextResponse.json(
                { error: 'Initial message is required' },
                { status: 400 }
            )
        }

        // Validate based on conversation type
        if (isStaffStaff) {
            if (!staffId2 || !staffType2) {
                return NextResponse.json(
                    { error: 'Recipient staff member is required for staff-to-staff messaging' },
                    { status: 400 }
                )
            }
        } else {
            if (!staffType && isCaregiver) {
                return NextResponse.json(
                    { error: 'Staff type is required' },
                    { status: 400 }
                )
            }
        }

        // Create the conversation based on type
        let conversationData: any = {
            status: 'active',
            subject: subject || null,
            conversation_type: isStaffStaff ? 'staff_staff' : 'caregiver_staff',
        }

        if (isStaffStaff) {
            // Staff-to-staff conversation
            // Get current user's staff type from their role
            const staffTypeMap: Record<string, string> = {
                doctor: 'doctor',
                pharmacist: 'pharmacy',
                lab_tech: 'lab',
                receptionist: 'reception',
                admin: 'admin',
            }
            const currentStaffType = staffTypeMap[profile?.role || ''] || 'staff'

            conversationData = {
                ...conversationData,
                staff_id: user.id,
                staff_type: currentStaffType,
                staff_id_2: staffId2,
                staff_type_2: staffType2,
                caregiver_id: null,
                child_id: null,
            }
        } else {
            // Caregiver-to-staff conversation
            conversationData = {
                ...conversationData,
                caregiver_id: user.id,
                staff_id: staffId || null,
                staff_type: staffType,
                child_id: childId || null,
            }
        }

        const { data: conversation, error: convError } = await supabase
            .from('chat_conversations')
            .insert(conversationData)
            .select()
            .single()

        if (convError) {
            console.error('Error creating conversation:', convError)
            return NextResponse.json({ error: convError.message }, { status: 500 })
        }

        // Determine sender type
        const senderType = isCaregiver ? 'caregiver' : (profile?.role || 'staff')

        // Create the initial message
        const { data: message, error: msgError } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                sender_type: senderType,
                content: initialMessage,
                is_read: false,
            })
            .select()
            .single()

        if (msgError) {
            console.error('Error creating message:', msgError)
            return NextResponse.json({ error: msgError.message }, { status: 500 })
        }

        return NextResponse.json({ conversation, message }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/messages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
