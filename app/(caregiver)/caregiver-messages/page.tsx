'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
    AlertCircle
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

            // Message will be added via real-time subscription
            setNewMessage('')
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

    // New Message Modal
    if (showNewMessage) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowNewMessage(false)}
                        className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">New Message</h1>
                </div>

                <Card className="border-slate-100">
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
                                className="flex-1 rounded-xl py-5"
                                disabled={creatingConversation}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateConversation}
                                disabled={creatingConversation || !newConversation.staffId || !newConversation.message.trim()}
                                className="flex-1 rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                        <strong>Expected Response Time:</strong> Normal inquiries within 24-48 hours. For urgent medical concerns, please call our emergency line.
                    </p>
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
                        className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        <div className={`relative h-11 w-11 rounded-xl bg-gradient-to-br ${getStaffColor(selectedConversation.staffType)} flex items-center justify-center text-white shadow-lg`}>
                            {getStaffIcon(selectedConversation.staffType)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{selectedConversation.staffName}</p>
                            <p className="text-xs text-slate-500 truncate">
                                {selectedConversation.subject}
                                {selectedConversation.childName && ` • About: ${selectedConversation.childName}`}
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
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.senderType === 'caregiver'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{renderMessageContent(message.content)}</p>
                                    <div className={`flex items-center gap-1 mt-1 ${message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'
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
                        <button className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
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
                    <p className="text-slate-500 mt-1">Chat with doctors and staff</p>
                </div>
                <Button
                    onClick={() => setShowNewMessage(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                </Button>
            </div>

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
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {['all', 'doctors', 'lab', 'pharmacy', 'support'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter as typeof activeFilter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
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
                        <p className="text-slate-500 font-medium">No conversations found</p>
                        <p className="text-sm text-slate-400 mt-1">Start a new conversation to connect with staff</p>
                        <Button
                            onClick={() => setShowNewMessage(true)}
                            className="mt-4 rounded-xl"
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
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
                        >
                            <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${getStaffColor(conversation.staffType)} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                {getStaffIcon(conversation.staffType)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-slate-900 truncate">{conversation.staffName}</p>
                                    <span className="text-xs text-slate-400 shrink-0">{formatTimestamp(conversation.lastMessageTime)}</span>
                                </div>
                                <p className="text-sm text-slate-500 truncate mt-0.5">{conversation.lastMessage}</p>
                                {conversation.childName && (
                                    <p className="text-xs text-blue-600 mt-1">About: {conversation.childName}</p>
                                )}
                            </div>

                            {conversation.unreadCount > 0 && (
                                <div className="h-6 min-w-[24px] px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    {conversation.unreadCount}
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Help Text */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900">Response Times</p>
                        <p className="text-sm text-blue-700 mt-0.5">
                            Normal inquiries: 24-48 hours<br />
                            Urgent: 4 hours during office hours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
