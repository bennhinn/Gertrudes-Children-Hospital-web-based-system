'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
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

interface LabResultPreview {
    id: string
    test_name: string
    test_type: string
    completed_at: string
    abnormal_findings: string | null
    child: {
        full_name: string
    }
    results?: string | null
    result_notes?: string | null
    clinical_notes?: string | null
    special_instructions?: string | null
    reviewed_at?: string | null
}


const STAFF_TYPE_MAP: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
    doctor: { label: 'Doctor', icon: Stethoscope, color: 'from-blue-500 to-cyan-500' },
    pharmacy: { label: 'Pharmacy', icon: Pill, color: 'from-purple-500 to-pink-500' },
    lab: { label: 'Lab', icon: FlaskConical, color: 'from-green-500 to-emerald-500' },
    reception: { label: 'Reception', icon: ClipboardList, color: 'from-orange-500 to-amber-500' },
}

export default function StaffMessagesPage() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Lab result sharing params
    const labOrderId = searchParams.get('labOrderId')
    const testName = searchParams.get('testName')

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

    // Lab result preview state
    const [labResult, setLabResult] = useState<LabResultPreview | null>(null)
    const [loadingLabResult, setLoadingLabResult] = useState(false)

    // New Message Modal State
    const [showNewMessage, setShowNewMessage] = useState(false)
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState<StaffMember | null>(null)
    const [newConversationMessage, setNewConversationMessage] = useState('')
    const [newConversationSubject, setNewConversationSubject] = useState('')
    const [creatingConversation, setCreatingConversation] = useState(false)

    // Fetch lab result if sharing
    useEffect(() => {
        if (!labOrderId) return

        async function fetchLabResult() {
            setLoadingLabResult(true)
            try {
                const { data, error } = await supabase
                    .from('lab_orders')
                    .select(`
                        id,
                        test_name,
                        test_type,
                        completed_at,
                        results,
                        result_notes,
                        clinical_notes,
                        special_instructions,
                        abnormal_findings,
                        reviewed_at,
                        child:children(full_name)
                    `)
                    .eq('id', labOrderId)
                    .single()

                if (error) throw error
                // Fix: Convert child array to single object as expected by LabResultPreview
                const labResult: LabResultPreview = {
                    ...data,
                    child: Array.isArray(data.child) && data.child.length > 0 ? data.child[0] : { full_name: '' }
                }
                setLabResult(labResult)

                // Pre-fill message with full lab result details (no link)
                const message = `Lab Result: ${labResult.test_name || labResult.test_type}\nPatient: ${labResult.child?.full_name}\nCompleted: ${labResult.completed_at ? new Date(labResult.completed_at).toLocaleString() : 'N/A'}\n\nResults:\n${labResult.results || 'N/A'}\n\nLab Notes:\n${labResult.result_notes || 'N/A'}\n\nClinical Notes:\n${labResult.clinical_notes || 'N/A'}\n\nSpecial Instructions:\n${labResult.special_instructions || 'N/A'}\n\nAbnormal Findings:\n${labResult.abnormal_findings || 'None'}\n\nReviewed At: ${labResult.reviewed_at ? new Date(labResult.reviewed_at).toLocaleString() : 'N/A'}`
                setNewConversationMessage(message)
                setNewConversationSubject(`Lab Result: ${labResult.test_name || labResult.test_type}`)
            } catch (err) {
                console.error('Error fetching lab result:', err)
            } finally {
                setLoadingLabResult(false)
            }
        }

        fetchLabResult()
    }, [labOrderId, supabase])

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
    }

    // Auto-open modal if sharing lab result
    useEffect(() => {
        if (labOrderId && !showNewMessage && !selectedConversation) {
            handleOpenNewMessage()
        }
    }, [labOrderId])

    // Create new staff-to-staff conversation
    const handleCreateStaffConversation = async () => {
        if (!selectedRecipient || !newConversationMessage.trim()) return

        setCreatingConversation(true)
        try {
            const roleToType: Record<string, string> = {
                doctor: 'doctor',
                pharmacist: 'pharmacy',
                lab_tech: 'lab',
                receptionist: 'reception',
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
                    <a
                        key={idx}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-600"
                    >
                        {part}
                    </a>
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

    const getConversationName = (conv: Conversation) => {
        return conv.conversationType === 'staff_staff'
            ? conv.otherStaffName || 'Staff Member'
            : conv.caregiverName || 'Caregiver'
    }

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
    if (loading && !labOrderId) {
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
            <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)]">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <button
                        onClick={() => {
                            setSelectedConversation(null)
                            setMessages([])
                        }}
                        className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${convStyle.color} flex items-center justify-center text-white shadow-lg`}>
                            <ConvIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{getConversationName(selectedConversation)}</p>
                            <p className="text-xs text-slate-500 truncate">
                                {selectedConversation.conversationType === 'staff_staff'
                                    ? convStyle.label
                                    : (selectedConversation.subject || 'General Inquiry')}
                                {selectedConversation.childName && (
                                    <span className="ml-1">• About: {selectedConversation.childName}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No messages yet</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isMyMessage = message.senderId === currentUserId

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMyMessage
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                        : 'bg-slate-100 text-slate-900'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                                        <div className={`flex items-center gap-1 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'
                                            }`}>
                                            <span className={`text-[10px] ${isMyMessage ? 'text-white/70' : 'text-slate-400'
                                                }`}>
                                                {formatMessageTime(message.createdAt)}
                                            </span>
                                            {isMyMessage && (
                                                <CheckCheck className={`h-3.5 w-3.5 ${message.isRead ? 'text-white' : 'text-white/50'}`} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type a reply..."
                                disabled={sending}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-50"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                    <p className="text-slate-500 mt-1">
                        {conversations.filter(c => c.unreadCount > 0).length} unread conversations
                    </p>
                </div>
                <Button
                    onClick={handleOpenNewMessage}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                </Button>
            </div>

            {/* Lab Result Sharing Banner */}
            {labOrderId && labResult && (
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
                            <FlaskConical className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-blue-900 text-lg">
                                    Sharing Lab Result
                                </h3>
                                {labResult.abnormal_findings && (
                                    <Badge className="bg-amber-100 text-amber-700 border-0 font-medium">
                                        ⚠️ Abnormal
                                    </Badge>
                                )}
                            </div>
                            <p className="text-blue-800 font-medium">
                                {labResult.test_name || labResult.test_type}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                Patient: {labResult.child.full_name} • Completed: {new Date(labResult.completed_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-blue-700 mt-3">
                                💬 Select a recipient below to share this lab result
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'caregivers', label: 'Caregivers' },
                    { key: 'staff', label: 'Staff' },
                ].map((filter) => (
                    <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter.key
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
                        {filter.key === 'staff' && conversations.filter(c => c.conversationType === 'staff_staff').length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                                {conversations.filter(c => c.conversationType === 'staff_staff').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">
                            {searchQuery ? 'No conversations found' : 'No messages yet'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
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
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
                            >
                                <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${convStyle.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                    <ConvIcon className="h-6 w-6" />
                                    {conversation.conversationType === 'staff_staff' && (
                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                                            <Users className="h-3 w-3 text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900 truncate">{getConversationName(conversation)}</p>
                                            {conversation.conversationType === 'staff_staff' && (
                                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                                    {convStyle.label}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">{formatTimestamp(conversation.lastMessageTime)}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate mt-0.5">{conversation.lastMessage}</p>
                                    {conversation.childName && (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                            <Baby className="h-3 w-3" />
                                            <span>About: {conversation.childName}</span>
                                        </div>
                                    )}
                                </div>

                                {conversation.unreadCount > 0 && (
                                    <div className="h-6 min-w-6 px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {conversation.unreadCount}
                                    </div>
                                )}
                            </button>
                        )
                    })
                )}
            </div>

            {/* New Message Modal */}
            {showNewMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {labOrderId ? 'Share Lab Result' : 'New Message'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowNewMessage(false)
                                    setSelectedRecipient(null)
                                    if (!labOrderId) {
                                        setNewConversationMessage('')
                                        setNewConversationSubject('')
                                    }
                                }}
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Lab Result Preview (if sharing) */}
                            {labOrderId && labResult && (
                                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                                            <FlaskConical className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-blue-900 text-sm">
                                                    {labResult.test_name || labResult.test_type}
                                                </h3>
                                                {labResult.abnormal_findings && (
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                                        ⚠️
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-blue-700">
                                                Patient: {labResult.child.full_name}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {new Date(labResult.completed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recipient Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Recipient
                                </label>
                                {loadingStaff ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
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
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                                        {roleLabels[role] || role}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {members.map((staff) => (
                                                            <button
                                                                key={staff.id}
                                                                onClick={() => setSelectedRecipient(staff)}
                                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedRecipient?.id === staff.id
                                                                    ? 'bg-blue-50 border-2 border-blue-500'
                                                                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${roleColors[role] || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white`}>
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                                <span className="font-medium text-slate-900">{staff.full_name}</span>
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
                                            <p className="text-center text-slate-500 py-4">No staff members available</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Subject (Optional or Pre-filled) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Subject {!labOrderId && '(Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={newConversationSubject}
                                    onChange={(e) => setNewConversationSubject(e.target.value)}
                                    placeholder="e.g., Patient consultation, Lab results..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                                    rows={labOrderId ? 6 : 4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 flex gap-3">
                            <Button
                                onClick={() => {
                                    setShowNewMessage(false)
                                    setSelectedRecipient(null)
                                    if (!labOrderId) {
                                        setNewConversationMessage('')
                                        setNewConversationSubject('')
                                    }
                                }}
                                className="flex-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateStaffConversation}
                                disabled={!selectedRecipient || !newConversationMessage.trim() || creatingConversation}
                                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            >
                                {creatingConversation ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        {labOrderId ? 'Share Result' : 'Send Message'}
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