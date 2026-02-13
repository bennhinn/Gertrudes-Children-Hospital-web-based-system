'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import {
    MessageSquare,
    Send,
    ArrowLeft,
    Search,
    User,
    CheckCheck,
    MoreVertical,
    Loader2,
    RefreshCw,
    AlertCircle,
    Baby,
    Plus,
    X,
    Stethoscope,
    Pill,
    FlaskConical,
    ClipboardList,
    Users
} from 'lucide-react'

interface Conversation {
    id: string
    caregiverId?: string
    caregiverName?: string
    otherStaffId?: string
    otherStaffName?: string
    otherStaffType?: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    status: 'active' | 'archived' | 'closed'
    childId?: string
    childName?: string
    subject?: string
    conversationType: 'caregiver_staff' | 'staff_staff'
}

interface Message {
    id: string
    conversationId: string
    senderId: string
    senderType: string
    content: string
    createdAt: string
    isRead: boolean
    readAt?: string
}

interface StaffMember {
    id: string
    full_name: string
    role: string
}

const STAFF_TYPE_MAP: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    doctor: { label: 'Doctor', icon: Stethoscope, color: 'from-blue-500 to-cyan-500' },
    pharmacy: { label: 'Pharmacy', icon: Pill, color: 'from-purple-500 to-pink-500' },
    lab: { label: 'Lab', icon: FlaskConical, color: 'from-green-500 to-emerald-500' },
    reception: { label: 'Reception', icon: ClipboardList, color: 'from-orange-500 to-amber-500' },
}

export default function StaffMessagesPage() {
    const supabase = createClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'caregivers' | 'staff'>('all')

    // New Message Modal State
    const [showNewMessage, setShowNewMessage] = useState(false)
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState<StaffMember | null>(null)
    const [newConversationMessage, setNewConversationMessage] = useState('')
    const [newConversationSubject, setNewConversationSubject] = useState('')
    const [creatingConversation, setCreatingConversation] = useState(false)

    // Fetch current user
    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }
        getCurrentUser()
    }, [supabase.auth])

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            setError(null)
            const response = await fetch('/api/messages')
            if (!response.ok) {
                throw new Error('Failed to fetch conversations')
            }
            const data = await response.json()
            setConversations(data.conversations || [])
        } catch (err) {
            console.error('Error fetching conversations:', err)
            setError('Failed to load conversations')
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    // Log messages/inbox view after load
    useEffect(() => {
        if (!loading) {
            logActivity({
                action: ActivityActions.MESSAGE_READ,
                description: 'Viewed messages inbox',
                metadata: {},
            }).catch(() => {})
        }
    }, [loading])

    // Fetch staff members for new message
    const fetchStaffMembers = useCallback(async () => {
        try {
            setLoadingStaff(true)
            let q: any = supabase
                .from('profiles')
                .select('id, full_name, role')
                .in('role', ['doctor', 'pharmacist', 'lab_tech', 'receptionist'])

            if (currentUserId) {
                q = q.neq('id', currentUserId)
            }

            q = q.order('role').order('full_name')

            const { data, error } = await q

            if (error) throw error
            setStaffMembers(data || [])
        } catch (err) {
            console.error('Error fetching staff:', err)
        } finally {
            setLoadingStaff(false)
        }
    }, [supabase, currentUserId])

    // Open new message modal
    const handleOpenNewMessage = () => {
        setShowNewMessage(true)
        fetchStaffMembers()
        // Log opening new message modal
        logActivity({
            action: ActivityActions.CONVERSATION_CREATE,
            description: 'Opened new message modal',
        }).catch(() => {})
    }

    // Create new staff-to-staff conversation
    const handleCreateStaffConversation = async () => {
        if (!selectedRecipient || !newConversationMessage.trim()) return

        setCreatingConversation(true)
        try {
            // Map role to staff type
            const roleToType: Record<string, string> = {
                doctor: 'doctor',
                pharmacist: 'pharmacy',
                lab_tech: 'lab',
                receptionist: 'receptionist',
            }

            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId2: selectedRecipient.id,
                    staffType2: roleToType[selectedRecipient.role] || 'staff',
                    subject: newConversationSubject || null,
                    initialMessage: newConversationMessage.trim(),
                    conversationType: 'staff_staff',
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create conversation')
            }

            const data = await response.json()

            // Reset form and close modal
            setShowNewMessage(false)
            setSelectedRecipient(null)
            setNewConversationMessage('')
            setNewConversationSubject('')

            // Refresh conversations and open the new one
            await fetchConversations()

            // Select the new conversation
            const newConv: Conversation = {
                id: data.conversation.id,
                otherStaffId: selectedRecipient.id,
                otherStaffName: selectedRecipient.full_name,
                otherStaffType: roleToType[selectedRecipient.role] || 'staff',
                lastMessage: newConversationMessage.trim(),
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                status: 'active',
                subject: newConversationSubject || undefined,
                conversationType: 'staff_staff',
            }
            handleSelectConversation(newConv)
            // Log conversation creation
            logActivity({
                action: ActivityActions.CONVERSATION_CREATE,
                description: `Created conversation with ${selectedRecipient?.full_name}`,
                target_id: data.conversation?.id || null,
                metadata: { recipientId: selectedRecipient?.id },
            }).catch(() => {})

        } catch (err) {
            console.error('Error creating conversation:', err)
            alert('Failed to create conversation. Please try again.')
        } finally {
            setCreatingConversation(false)
        }
    }

    // Group staff by role for display
    const groupedStaff = staffMembers.reduce((acc, staff) => {
        const role = staff.role
        if (!acc[role]) acc[role] = []
        acc[role].push(staff)
        return acc
    }, {} as Record<string, StaffMember[]>)

    // Real-time subscription for conversations
    useEffect(() => {
        if (!currentUserId) return

        // Subscribe to conversations where user is staff_id
        const channel1 = supabase
            .channel('staff-chat-conversations-1')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_conversations',
                    filter: `staff_id=eq.${currentUserId}`
                },
                () => {
                    fetchConversations()
                }
            )
            .subscribe()

        // Subscribe to conversations where user is staff_id_2
        const channel2 = supabase
            .channel('staff-chat-conversations-2')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_conversations',
                    filter: `staff_id_2=eq.${currentUserId}`
                },
                () => {
                    fetchConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel1)
            supabase.removeChannel(channel2)
        }
    }, [currentUserId, fetchConversations, supabase])

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            setLoadingMessages(true)
            const response = await fetch(`/api/messages/${conversationId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch messages')
            }
            const data = await response.json()
            setMessages(data.messages || [])
        } catch (err) {
            console.error('Error fetching messages:', err)
        } finally {
            setLoadingMessages(false)
        }
    }, [])

    // Real-time subscription for messages
    useEffect(() => {
        if (!selectedConversation) return

        const channel = supabase
            .channel(`staff-chat-messages-${selectedConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                },
                (payload) => {
                    const newMsg = payload.new as any
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, {
                            id: newMsg.id,
                            conversationId: newMsg.conversation_id,
                            senderId: newMsg.sender_id,
                            senderType: newMsg.sender_type,
                            content: newMsg.content,
                            createdAt: newMsg.created_at,
                            isRead: newMsg.is_read,
                            readAt: newMsg.read_at
                        }]
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                },
                (payload) => {
                    const updatedMsg = payload.new as any
                    setMessages(prev => prev.map(m =>
                        m.id === updatedMsg.id
                            ? { ...m, isRead: updatedMsg.is_read, readAt: updatedMsg.read_at }
                            : m
                    ))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedConversation, supabase])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle selecting a conversation
    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation)
        fetchMessages(conversation.id)
        // Log conversation opened / messages viewed
        logActivity({
            action: ActivityActions.MESSAGE_READ,
            description: `Opened conversation ${conversation.id}`,
            target_id: conversation.id,
            metadata: { conversationType: conversation.conversationType },
        }).catch(() => {})
    }

    // Send a message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const response = await fetch(`/api/messages/${selectedConversation.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() })
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            setNewMessage('')
            // Log message send
            logActivity({
                action: ActivityActions.MESSAGE_SEND,
                description: `Sent message in conversation ${selectedConversation?.id}`,
                target_id: selectedConversation?.id || null,
                metadata: { snippet: newMessage.trim().slice(0, 120) },
            }).catch(() => {})
        } catch (err) {
            console.error('Error sending message:', err)
            alert('Failed to send message. Please try again.')
        } finally {
            setSending(false)
        }
    }

    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    function renderMessageContent(text: string) {
        if (!text) return null
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = text.split(urlRegex)
        return parts.map((part, idx) => {
            if (part.startsWith('http://') || part.startsWith('https://')) {
                return (
                    <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{part}</a>
                )
            }
            return <span key={idx}>{part}</span>
        })
    }

    const filteredConversations = conversations.filter(conv => {
        if (activeFilter === 'unread' && conv.unreadCount === 0) return false
        if (activeFilter === 'caregivers' && conv.conversationType !== 'caregiver_staff') return false
        if (activeFilter === 'staff' && conv.conversationType !== 'staff_staff') return false
        if (searchQuery) {
            const name = conv.conversationType === 'staff_staff'
                ? (conv.otherStaffName || '')
                : (conv.caregiverName || '')
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (conv.subject && conv.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (conv.childName && conv.childName.toLowerCase().includes(searchQuery.toLowerCase()))
        }
        return true
    })

    // Get conversation display name
    const getConversationName = (conv: Conversation) => {
        return conv.conversationType === 'staff_staff'
            ? conv.otherStaffName || 'Staff Member'
            : conv.caregiverName || 'Caregiver'
    }

    // Get conversation icon/color based on type
    const getConversationStyle = (conv: Conversation) => {
        if (conv.conversationType === 'staff_staff' && conv.otherStaffType) {
            const staffInfo = STAFF_TYPE_MAP[conv.otherStaffType]
            return {
                icon: staffInfo?.icon || Users,
                color: staffInfo?.color || 'from-slate-500 to-slate-600',
                label: staffInfo?.label || 'Staff',
            }
        }
        return {
            icon: User,
            color: 'from-blue-500 to-cyan-500',
            label: 'Caregiver',
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-slate-900 font-medium">{error}</p>
                <Button
                    onClick={fetchConversations}
                    className="mt-4 rounded-xl"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        )
    }

    // Conversation Thread View
    if (selectedConversation) {
        const convStyle = getConversationStyle(selectedConversation)
        const ConvIcon = convStyle.icon

        return (
            <div className="flex flex-col h-[calc(100dvh-8rem)] lg:h-[calc(100vh-10rem)]">
                {/* Header - Compact on Mobile */}
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 lg:gap-3 lg:pb-4">
                    <button
                        onClick={() => {
                            setSelectedConversation(null)
                            setMessages([])
                        }}
                        className="h-9 w-9 flex-shrink-0 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors lg:h-10 lg:w-10"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-600 lg:h-5 lg:w-5" />
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0 lg:gap-3">
                        <div className={`h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br ${convStyle.color} flex items-center justify-center text-white shadow-lg lg:h-11 lg:w-11`}>
                            <ConvIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate lg:text-base">{getConversationName(selectedConversation)}</p>
                            <p className="text-[10px] text-slate-500 truncate lg:text-xs">
                                {selectedConversation.conversationType === 'staff_staff'
                                    ? convStyle.label
                                    : (selectedConversation.subject || 'General Inquiry')}
                            </p>
                        </div>
                    </div>

                    <button className="h-9 w-9 flex-shrink-0 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors lg:h-10 lg:w-10">
                        <MoreVertical className="h-4 w-4 text-slate-400 lg:h-5 lg:w-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 lg:py-4 lg:space-y-4">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No messages yet</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isMyMessage = message.senderId === currentUserId

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] lg:max-w-[80%] rounded-2xl px-3 py-2.5 lg:px-4 lg:py-3 ${isMyMessage
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                        : 'bg-slate-100 text-slate-900'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{renderMessageContent(message.content)}</p>
                                        <div className={`flex items-center gap-1 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'
                                            }`}>
                                            <span className={`text-[10px] ${isMyMessage ? 'text-white/70' : 'text-slate-400'
                                                }`}>
                                                {formatMessageTime(message.createdAt)}
                                            </span>
                                            {isMyMessage && (
                                                <CheckCheck className={`h-3 w-3 ${message.isRead ? 'text-white' : 'text-white/50'}`} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input - Larger touch targets */}
                <div className="pt-3 border-t border-slate-100 lg:pt-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type a reply..."
                                disabled={sending}
                                className="w-full px-4 py-3 pr-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50 text-sm lg:text-base"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="h-11 w-11 flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {sending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Inbox View
    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Header - Compact on Mobile */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-slate-900 lg:text-2xl">Messages</h1>
                    <p className="text-xs text-slate-500 mt-0.5 lg:text-sm lg:mt-1">
                        {conversations.filter(c => c.unreadCount > 0).length} unread
                    </p>
                </div>
                <Button
                    onClick={handleOpenNewMessage}
                    size="sm"
                    className="h-9 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 lg:h-10"
                >
                    <Plus className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">New Message</span>
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 lg:h-5 lg:w-5" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm lg:pl-12 lg:text-base"
                />
            </div>

            {/* Filters - Horizontal Scroll on Mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible lg:flex-wrap">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'caregivers', label: 'Caregivers' },
                    { key: 'staff', label: 'Staff' },
                ].map((filter) => (
                    <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter.key
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {filter.label}
                        {filter.key === 'unread' && conversations.filter(c => c.unreadCount > 0).length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                                {conversations.filter(c => c.unreadCount > 0).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-10 lg:py-12">
                        <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4 lg:h-16 lg:w-16">
                            <MessageSquare className="h-7 w-7 text-slate-400 lg:h-8 lg:w-8" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm lg:text-base">
                            {searchQuery ? 'No conversations found' : 'No messages yet'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 lg:text-sm">
                            {searchQuery ? 'Try a different search term' : 'Start a conversation with a colleague'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => {
                        const convStyle = getConversationStyle(conversation)
                        const ConvIcon = convStyle.icon

                        return (
                            <button
                                key={conversation.id}
                                onClick={() => handleSelectConversation(conversation)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left active:scale-[0.99] lg:gap-4 lg:p-4"
                            >
                                <div className={`relative h-11 w-11 flex-shrink-0 rounded-xl bg-gradient-to-br ${convStyle.color} flex items-center justify-center text-white shadow-lg lg:h-12 lg:w-12`}>
                                    <ConvIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                                    {conversation.conversationType === 'staff_staff' && (
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center lg:h-5 lg:w-5">
                                            <Users className="h-2.5 w-2.5 text-slate-600 lg:h-3 lg:w-3" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <p className="font-semibold text-slate-900 text-sm truncate lg:text-base">{getConversationName(conversation)}</p>
                                            {conversation.conversationType === 'staff_staff' && (
                                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium lg:text-xs lg:px-2">
                                                    {convStyle.label}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 flex-shrink-0 lg:text-xs">{formatTimestamp(conversation.lastMessageTime)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-0.5 lg:text-sm">{conversation.lastMessage}</p>
                                </div>

                                {conversation.unreadCount > 0 && (
                                    <div className="h-5 min-w-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 lg:h-6 lg:min-w-6 lg:text-xs">
                                        {conversation.unreadCount}
                                    </div>
                                )}
                            </button>
                        )
                    })
                )}
            </div>

            {/* New Message Modal - Full Screen on Mobile */}
            {showNewMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 lg:items-center lg:p-4">
                    <div className="bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl w-full max-h-[90dvh] overflow-hidden lg:max-w-md lg:max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-900 lg:text-lg">New Message</h2>
                            <button
                                onClick={() => {
                                    setShowNewMessage(false)
                                    setSelectedRecipient(null)
                                    setNewConversationMessage('')
                                    setNewConversationSubject('')
                                }}
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[50dvh] lg:max-h-[60vh]">
                            {/* Recipient Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Recipient
                                </label>
                                {loadingStaff ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-3 lg:space-y-4">
                                        {Object.entries(groupedStaff).map(([role, members]) => {
                                            const roleLabels: Record<string, string> = {
                                                doctor: 'Doctors',
                                                pharmacist: 'Pharmacy',
                                                lab_tech: 'Lab Technicians',
                                                receptionist: 'Reception',
                                            }
                                            const roleColors: Record<string, string> = {
                                                doctor: 'from-blue-500 to-cyan-500',
                                                pharmacist: 'from-purple-500 to-pink-500',
                                                lab_tech: 'from-green-500 to-emerald-500',
                                                receptionist: 'from-orange-500 to-amber-500',
                                            }

                                            return (
                                                <div key={role}>
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 lg:text-xs lg:mb-2">
                                                        {roleLabels[role] || role}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {members.map((staff) => (
                                                            <button
                                                                key={staff.id}
                                                                onClick={() => setSelectedRecipient(staff)}
                                                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all active:scale-[0.98] lg:p-3 ${selectedRecipient?.id === staff.id
                                                                    ? 'bg-blue-50 border-2 border-blue-500'
                                                                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${roleColors[role] || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white lg:h-10 lg:w-10`}>
                                                                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                                                                </div>
                                                                <span className="font-medium text-slate-900 text-sm lg:text-base">{staff.full_name}</span>
                                                                {selectedRecipient?.id === staff.id && (
                                                                    <div className="ml-auto h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                                        <CheckCheck className="h-3 w-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {Object.keys(groupedStaff).length === 0 && (
                                            <p className="text-center text-slate-500 py-4 text-sm">No staff members available</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Subject (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Subject (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={newConversationSubject}
                                    onChange={(e) => setNewConversationSubject(e.target.value)}
                                    placeholder="e.g., Patient consultation..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm lg:text-base"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={newConversationMessage}
                                    onChange={(e) => setNewConversationMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none text-sm lg:text-base lg:rows-4"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowNewMessage(false)
                                    setSelectedRecipient(null)
                                    setNewConversationMessage('')
                                    setNewConversationSubject('')
                                }}
                                className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateStaffConversation}
                                disabled={!selectedRecipient || !newConversationMessage.trim() || creatingConversation}
                                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            >
                                {creatingConversation ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
