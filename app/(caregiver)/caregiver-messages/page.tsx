'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
    MessageSquare,
    Send,
    Paperclip,
    ArrowLeft,
    Search,
    Plus,
    User,
    Stethoscope,
    TestTube,
    Pill,
    HelpCircle,
    Clock,
    CheckCheck,
    MoreVertical,
    X,
    Loader2,
    RefreshCw,
    AlertCircle,
    Sparkles,
    Shield,
    ChevronRight,
    Inbox
} from 'lucide-react'

interface Conversation {
    id: string
    staffId: string
    staffName: string
    staffType: 'doctor' | 'lab' | 'pharmacy' | 'support'
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    status: 'active' | 'archived' | 'closed'
    childId?: string
    childName?: string
    subject?: string
}

interface Message {
    id: string
    conversationId: string
    senderId: string
    senderType: 'caregiver' | 'staff'
    content: string
    createdAt: string
    isRead: boolean
    readAt?: string
    attachments?: { name: string; type: string; url: string }[]
}

interface StaffMember {
    id: string
    name: string
    role: string
}

interface Child {
    id: string
    name: string
}

export default function MessagesPage() {
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
    const [showNewMessage, setShowNewMessage] = useState(false)
    const [activeFilter, setActiveFilter] = useState<'all' | 'doctors' | 'lab' | 'pharmacy' | 'support'>('all')

    // New message form state
    const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
    const [children, setChildren] = useState<Child[]>([])
    const [newConversation, setNewConversation] = useState({
        staffId: '',
        childId: '',
        subject: '',
        message: ''
    })
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

    // Log that the caregiver viewed the messages inbox
    useEffect(() => {
        logActivity({
            action: 'caregiver_messages_view',
            action_category: 'chat',
            description: 'Caregiver viewed messages inbox'
        }).catch(() => { })
    }, [])

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

    // Fetch available staff and children for new conversation
    const fetchStaffAndChildren = useCallback(async () => {
        try {
            // Fetch staff members from profiles (doctors, lab_tech, pharmacist, receptionist)
            const { data: staffData } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .in('role', ['doctor', 'lab_tech', 'pharmacist', 'receptionist', 'admin'])
                .order('role')
                .limit(100)

            if (staffData) {
                setAvailableStaff(staffData.map(s => ({
                    id: s.id,
                    name: s.full_name || 'Unknown',
                    role: s.role
                })))
            }

            // Fetch children under caregiver from caregivers table
            if (currentUserId) {
                const { data: childrenData } = await supabase
                    .from('children')
                    .select('id, full_name, caregiver_id, caregivers!inner(id)')
                    .eq('caregivers.id', currentUserId)

                // If no results with join, try direct caregiver_id
                if (!childrenData || childrenData.length === 0) {
                    const { data: directChildren } = await supabase
                        .from('children')
                        .select('id, full_name')
                        .eq('caregiver_id', currentUserId)

                    if (directChildren) {
                        setChildren(directChildren.map(c => ({
                            id: c.id,
                            name: c.full_name || 'Unknown'
                        })))
                    }
                } else {
                    setChildren(childrenData.map(c => ({
                        id: c.id,
                        name: c.full_name || 'Unknown'
                    })))
                }
            }
        } catch (err) {
            console.error('Error fetching staff/children:', err)
        }
    }, [currentUserId, supabase])

    // Initial load
    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    // Fetch staff/children when opening new message modal
    useEffect(() => {
        if (showNewMessage) {
            fetchStaffAndChildren()
        }
    }, [showNewMessage, fetchStaffAndChildren])

    // Real-time subscription for conversations
    useEffect(() => {
        if (!currentUserId) return

        const channel = supabase
            .channel('chat-conversations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_conversations',
                    filter: `caregiver_id=eq.${currentUserId}`
                },
                () => {
                    // Refetch conversations on any change
                    fetchConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
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
            .channel(`chat-messages-${selectedConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`
                },
                (payload) => {
                    // Add new message to the list
                    const newMsg = payload.new as any
                    setMessages(prev => {
                        // Check if message already exists
                        if (prev.some(m => m.id === newMsg.id)) return prev
                        return [...prev, {
                            id: newMsg.id,
                            conversationId: newMsg.conversation_id,
                            senderId: newMsg.sender_id,
                            senderType: newMsg.sender_type,
                            content: newMsg.content,
                            createdAt: newMsg.created_at,
                            isRead: newMsg.is_read,
                            readAt: newMsg.read_at,
                            attachments: newMsg.attachments
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
                    // Update message (e.g., read status)
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
        logActivity({
            action: 'conversation_open',
            action_category: 'chat',
            target_table: 'chat_conversations',
            target_id: conversation.id,
            resource_name: conversation.staffName,
            description: `Opened conversation with ${conversation.staffName}`
        }).catch(() => { })
    }

    // Send a message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const messageToSend = newMessage.trim()
            const response = await fetch(`/api/messages/${selectedConversation.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageToSend })
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            // Message will be added via real-time subscription
            setNewMessage('')

            // Log the sent message (client-side intake)
            logActivity({
                action: ActivityActions.MESSAGE_SEND,
                action_category: 'chat',
                target_table: 'chat_conversations',
                target_id: selectedConversation.id,
                description: messageToSend.substring(0, 200),
                metadata: { snippet: messageToSend.substring(0, 200) }
            }).catch(() => { })
        } catch (err) {
            console.error('Error sending message:', err)
            alert('Failed to send message. Please try again.')
        } finally {
            setSending(false)
        }
    }

    // Create new conversation
    const handleCreateConversation = async () => {
        if (!newConversation.staffId || !newConversation.message.trim()) {
            alert('Please select a recipient and enter a message')
            return
        }

        setCreatingConversation(true)
        try {
            const selectedStaff = availableStaff.find(s => s.id === newConversation.staffId)
            const staffType = selectedStaff?.role === 'doctor' ? 'doctor' :
                selectedStaff?.role === 'lab_tech' ? 'lab' :
                    selectedStaff?.role === 'pharmacist' ? 'pharmacy' :
                        selectedStaff?.role === 'receptionist' ? 'receptionist' : 'support'

            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: newConversation.staffId,
                    staffType,
                    childId: newConversation.childId || null,
                    subject: newConversation.subject || 'General Inquiry',
                    initialMessage: newConversation.message.trim()
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create conversation')
            }

            const data = await response.json()

            // Reset form and close modal
            setNewConversation({ staffId: '', childId: '', subject: '', message: '' })
            setShowNewMessage(false)

            // Refresh conversations and select the new one
            await fetchConversations()

            if (data.conversation) {
                handleSelectConversation(data.conversation)
                logActivity({
                    action: ActivityActions.CONVERSATION_CREATE,
                    action_category: 'chat',
                    target_table: 'chat_conversations',
                    target_id: data.conversation.id,
                    resource_name: data.conversation.staffName,
                    description: `Created conversation with ${data.conversation.staffName}`
                }).catch(() => { })
            }
        } catch (err) {
            console.error('Error creating conversation:', err)
            alert('Failed to create conversation. Please try again.')
        } finally {
            setCreatingConversation(false)
        }
    }

    const getStaffIcon = (type: string) => {
        switch (type) {
            case 'doctor':
                return <Stethoscope className="h-5 w-5" />
            case 'lab':
                return <TestTube className="h-5 w-5" />
            case 'pharmacy':
                return <Pill className="h-5 w-5" />
            case 'support':
                return <HelpCircle className="h-5 w-5" />
            default:
                return <User className="h-5 w-5" />
        }
    }

    const getStaffColor = (type: string) => {
        switch (type) {
            case 'doctor':
                return 'from-blue-500 to-cyan-500'
            case 'lab':
                return 'from-emerald-500 to-teal-500'
            case 'pharmacy':
                return 'from-purple-500 to-pink-500'
            case 'support':
                return 'from-amber-500 to-orange-500'
            default:
                return 'from-slate-500 to-slate-600'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'doctor': return 'Doctor'
            case 'lab_tech': return 'Lab Technician'
            case 'pharmacist': return 'Pharmacist'
            case 'admin': return 'Support Staff'
            default: return role
        }
    }

    const formatTimestamp = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''

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
        if (!dateString) return ''
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
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
        if (activeFilter !== 'all') {
            const filterType = activeFilter === 'doctors' ? 'doctor' : activeFilter
            if (conv.staffType !== filterType) return false
        }
        if (searchQuery) {
            return conv.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (conv.subject && conv.subject.toLowerCase().includes(searchQuery.toLowerCase()))
        }
        return true
    })

    // Loading state
    if (loading) {
        return (
            <div className="space-y-5">
                {/* Hero skeleton */}
                <div className="h-32 sm:h-36 rounded-2xl bg-linear-to-br from-blue-100 to-cyan-50 animate-pulse" />
                {/* Search skeleton */}
                <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                {/* Filter pills skeleton */}
                <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={`f-${i}`} className="h-9 w-20 rounded-full bg-slate-100 animate-pulse" />
                    ))}
                </div>
                {/* Conversation skeletons */}
                <div className="space-y-2.5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white ring-1 ring-slate-100">
                            <div className="h-12 w-12 rounded-xl bg-slate-200 animate-pulse shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex justify-between gap-4">
                                    <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                                    <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
                                </div>
                                <div className="h-3.5 w-3/4 bg-slate-100 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="relative h-18 w-18 rounded-2xl bg-linear-to-br from-red-100 to-rose-50 flex items-center justify-center mb-5 shadow-lg shadow-red-100/50">
                    <AlertCircle className="h-9 w-9 text-red-500" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-400 animate-pulse" />
                </div>
                <p className="text-slate-900 font-semibold text-lg">{error}</p>
                <p className="text-sm text-slate-500 mt-1">Please check your connection and try again</p>
                <Button
                    onClick={fetchConversations}
                    className="mt-5 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        )
    }

    // New Message Modal
    if (showNewMessage) {
        return (
            <div className="space-y-5">
                {/* Compose header */}
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-cyan-600 to-teal-500 p-5 sm:p-6">
                    <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                    <div className="relative flex items-center gap-3">
                        <button
                            onClick={() => setShowNewMessage(false)}
                            className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-white">New Message</h1>
                            <p className="text-xs text-white/70 mt-0.5">Compose a new conversation</p>
                        </div>
                    </div>
                </div>

                <Card className="overflow-hidden ring-1 ring-slate-100 border-0 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">To *</label>
                            <select
                                value={newConversation.staffId}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, staffId: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                            >
                                <option value="">Select recipient...</option>
                                {/* Group by Doctors */}
                                {availableStaff.filter(s => s.role === 'doctor').length > 0 && (
                                    <optgroup label="🩺 Doctors">
                                        {availableStaff.filter(s => s.role === 'doctor').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                Dr. {staff.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {/* Group by Lab */}
                                {availableStaff.filter(s => s.role === 'lab_tech').length > 0 && (
                                    <optgroup label="🧪 Laboratory">
                                        {availableStaff.filter(s => s.role === 'lab_tech').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {/* Group by Pharmacy */}
                                {availableStaff.filter(s => s.role === 'pharmacist').length > 0 && (
                                    <optgroup label="💊 Pharmacy">
                                        {availableStaff.filter(s => s.role === 'pharmacist').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {/* Group by Reception */}
                                {availableStaff.filter(s => s.role === 'receptionist').length > 0 && (
                                    <optgroup label="🏥 Reception">
                                        {availableStaff.filter(s => s.role === 'receptionist').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {/* Group by Support/Admin */}
                                {availableStaff.filter(s => s.role === 'admin').length > 0 && (
                                    <optgroup label="📞 Support">
                                        {availableStaff.filter(s => s.role === 'admin').map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">About Child (Optional)</label>
                            <select
                                value={newConversation.childId}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, childId: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                            >
                                <option value="">Select child (if applicable)...</option>
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.name}</option>
                                ))}
                            </select>
                            {children.length === 0 && (
                                <p className="text-xs text-slate-400 mt-1">No children registered under your account</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                            <input
                                type="text"
                                value={newConversation.subject}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Brief description of your inquiry"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
                            <textarea
                                rows={5}
                                value={newConversation.message}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Type your message here..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowNewMessage(false)}
                                className="flex-1 rounded-xl py-5 active:scale-[0.98] transition-all"
                                disabled={creatingConversation}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateConversation}
                                disabled={creatingConversation || !newConversation.staffId || !newConversation.message.trim()}
                                className="flex-1 rounded-xl py-5 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                            >
                                {creatingConversation ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Send Message
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 ring-1 ring-amber-200/60">
                    <div className="h-9 w-9 rounded-lg bg-linear-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Expected Response Time</p>
                        <p className="text-xs sm:text-sm text-amber-700 mt-0.5">Normal inquiries within 24-48 hours. For urgent medical concerns, please call our emergency line.</p>
                    </div>
                </div>
            </div>
        )
    }

    // Conversation Thread View
    if (selectedConversation) {
        return (
            <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)]">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <button
                        onClick={() => {
                            setSelectedConversation(null)
                            setMessages([])
                        }}
                        className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`relative h-11 w-11 rounded-xl bg-linear-to-br ${getStaffColor(selectedConversation.staffType)} flex items-center justify-center text-white shadow-lg shrink-0`}>
                            {getStaffIcon(selectedConversation.staffType)}
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{selectedConversation.staffName}</p>
                            <p className="text-xs text-slate-500 truncate">
                                {selectedConversation.subject}
                                {selectedConversation.childName && ` • About: ${selectedConversation.childName}`}
                            </p>
                        </div>
                    </div>

                    <button className="h-10 w-10 rounded-xl hover:bg-slate-100 active:scale-95 flex items-center justify-center transition-all shrink-0">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-100 to-cyan-50 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            </div>
                            <p className="text-sm text-slate-400">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-blue-100 to-cyan-50 flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles className="h-7 w-7 text-blue-500" />
                            </div>
                            <p className="font-medium text-slate-700">Start the conversation</p>
                            <p className="text-sm text-slate-400 mt-1 max-w-60">Send your first message to begin chatting</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 ${message.senderType === 'caregiver'
                                    ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white rounded-2xl rounded-br-md shadow-lg shadow-blue-500/15'
                                    : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-md'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{renderMessageContent(message.content)}</p>
                                    <div className={`flex items-center gap-1 mt-1.5 ${message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <span className={`text-[10px] ${message.senderType === 'caregiver' ? 'text-white/70' : 'text-slate-400'
                                            }`}>
                                            {formatMessageTime(message.createdAt)}
                                        </span>
                                        {message.senderType === 'caregiver' && (
                                            <CheckCheck className={`h-3.5 w-3.5 ${message.isRead ? 'text-white' : 'text-white/50'}`} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <button className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all shrink-0">
                            <Paperclip className="h-5 w-5 text-slate-500" />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type a message..."
                                disabled={sending}
                                className="w-full px-4 py-3 pr-4 rounded-full ring-1 ring-slate-200 border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50 bg-slate-50/80"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="h-11 w-11 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

    return (
        <div className="space-y-5">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-cyan-600 to-teal-500 p-5 sm:p-7">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-white/5 blur-lg" />

                <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-3">
                                <MessageSquare className="h-3 w-3 text-white/90" />
                                <span className="text-[11px] font-medium text-white/90">Messaging</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Messages</h1>
                            <p className="text-sm text-white/70 mt-1">Chat with your care team</p>
                        </div>
                        <Button
                            onClick={() => { logActivity({ action: 'opened_new_message_modal', action_category: 'chat', description: 'Opened new message modal' }).catch(() => { }); setShowNewMessage(true) }}
                            className="rounded-xl bg-white text-blue-600 hover:bg-white/90 shadow-lg shadow-blue-900/20 active:scale-95 transition-all font-semibold"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">Compose</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    </div>

                    {/* Quick stats row */}
                    <div className="flex gap-3 mt-5">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
                            <Inbox className="h-3.5 w-3.5 text-white/80" />
                            <span className="text-xs font-semibold text-white">{conversations.length}</span>
                            <span className="text-[10px] text-white/60">chats</span>
                        </div>
                        {totalUnread > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm ring-1 ring-white/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                                <span className="text-xs font-bold text-white">{totalUnread}</span>
                                <span className="text-[10px] text-white/60">unread</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl ring-1 ring-slate-200 border-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                {[
                    { key: 'all', label: 'All', icon: Inbox },
                    { key: 'doctors', label: 'Doctors', icon: Stethoscope },
                    { key: 'lab', label: 'Lab', icon: TestTube },
                    { key: 'pharmacy', label: 'Pharmacy', icon: Pill },
                    { key: 'support', label: 'Support', icon: HelpCircle },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveFilter(key as typeof activeFilter)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap active:scale-95 transition-all ${activeFilter === key
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-sm">
                            <Search className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-semibold">No conversations found</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-65">Start a new conversation to connect with your care team</p>
                        <Button
                            onClick={() => { logActivity({ action: 'opened_new_message_modal', action_category: 'chat', description: 'Opened new message modal (start conversation)' }).catch(() => { }); setShowNewMessage(true) }}
                            className="mt-5 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Start Conversation
                        </Button>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            className={`group w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-white ring-1 transition-all text-left active:scale-[0.98] ${conversation.unreadCount > 0
                                    ? 'ring-blue-200 shadow-md shadow-blue-100/40 hover:ring-blue-300'
                                    : 'ring-slate-100 shadow-sm hover:shadow-md hover:ring-slate-200'
                                }`}
                        >
                            <div className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-linear-to-br ${getStaffColor(conversation.staffType)} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform`}>
                                {getStaffIcon(conversation.staffType)}
                                {conversation.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-sm sm:text-base truncate ${conversation.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>{conversation.staffName}</p>
                                    <span className="text-[10px] sm:text-xs text-slate-400 shrink-0">{formatTimestamp(conversation.lastMessageTime)}</span>
                                </div>
                                <p className={`text-xs sm:text-sm truncate mt-0.5 ${conversation.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{conversation.lastMessage}</p>
                                {conversation.childName && (
                                    <p className="text-[10px] sm:text-xs text-blue-600 mt-1 truncate">About: {conversation.childName}</p>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {conversation.unreadCount > 0 && (
                                    <div className="h-5 min-w-5 px-1.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                        {conversation.unreadCount}
                                    </div>
                                )}
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Response time info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-linear-to-r from-blue-50 to-cyan-50 ring-1 ring-blue-100/60">
                <div className="h-9 w-9 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-blue-900">Secure & Confidential</p>
                    <p className="text-xs sm:text-sm text-blue-700/80 mt-0.5 leading-relaxed">
                        Messages are encrypted. Normal response: 24-48 hrs. Urgent: 4 hrs during office hours.
                    </p>
                </div>
            </div>
        </div>
    )
}
