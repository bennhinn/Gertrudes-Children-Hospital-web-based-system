'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
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
        const recipientName = conversation.staffName || 'Unknown recipient'
        setSelectedConversation(conversation)
        fetchMessages(conversation.id)
        logActivity({
            action: 'conversation_open',
            action_category: 'chat',
            target_table: 'chat_conversations',
            target_id: conversation.id,
            resource_name: recipientName,
            description: `Opened conversation with ${recipientName}`
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

            const staffName = data.conversation?.staffName || selectedStaff?.name || 'Unknown'

            if (data.conversation) {
                // Ensure the conversation object has staffName for downstream use
                const enrichedConv = { ...data.conversation, staffName }
                handleSelectConversation(enrichedConv)
                logActivity({
                    action: ActivityActions.CONVERSATION_CREATE,
                    action_category: 'chat',
                    target_table: 'chat_conversations',
                    target_id: data.conversation.id,
                    resource_name: staffName,
                    description: `Created conversation with ${staffName}`
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
                return <Stethoscope size={20} />
            case 'lab':
                return <TestTube size={20} />
            case 'pharmacy':
                return <Pill size={20} />
            case 'support':
                return <HelpCircle size={20} />
            default:
                return <User size={20} />
        }
    }

    const getStaffColor = (type: string) => {
        switch (type) {
            case 'doctor':
                return 'linear-gradient(135deg, #3B82F6, #06B6D4)'
            case 'lab':
                return 'linear-gradient(135deg, #10B981, #14B8A6)'
            case 'pharmacy':
                return 'linear-gradient(135deg, #A855F7, #EC4899)'
            case 'support':
                return 'linear-gradient(135deg, #F59E0B, #F97316)'
            default:
                return 'linear-gradient(135deg, #64748B, #475569)'
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
                    <a key={idx} href={part} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--clay-accent)' }}>{part}</a>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="shimmer" style={{ height: '8.5rem', borderRadius: '1.5rem' }} />
                <div className="shimmer" style={{ height: '2.75rem', borderRadius: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={`f-${i}`} className="shimmer" style={{ height: '2.25rem', width: '5rem', borderRadius: '9999px' }} />
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="clay-card-static" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                            <div className="shimmer" style={{ height: '3rem', width: '3rem', borderRadius: '0.75rem', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                    <div className="shimmer" style={{ height: '1rem', width: '7rem', borderRadius: '0.25rem' }} />
                                    <div className="shimmer" style={{ height: '0.75rem', width: '3rem', borderRadius: '0.25rem' }} />
                                </div>
                                <div className="shimmer" style={{ height: '0.875rem', width: '75%', borderRadius: '0.25rem' }} />
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
                <div className="clay-empty-ico" style={{ background: 'linear-gradient(135deg, #FEE2E2, #FFF1F2)', marginBottom: '1.25rem', position: 'relative' }}>
                    <AlertCircle size={36} style={{ color: '#EF4444' }} />
                    <div className="live-dot" style={{ position: 'absolute', top: '-0.25rem', right: '-0.25rem', background: '#F87171' }} />
                </div>
                <p className="clay-display" style={{ color: 'var(--clay-text-dark)', fontSize: '1.125rem' }}>{error}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>Please check your connection and try again</p>
                <button
                    onClick={fetchConversations}
                    className="clay-cta"
                    style={{ marginTop: '1.25rem' }}
                >
                    <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
                    Retry
                </button>
            </div>
        )
    }

    // New Message Modal
    if (showNewMessage) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Compose header */}
                <div className="clay-hero">
                    <div className="deco-blob" style={{ top: '-2rem', right: '-2rem', width: '7rem', height: '7rem' }} />
                    <div className="deco-blob" style={{ bottom: '-1.5rem', left: '-1.5rem', width: '5rem', height: '5rem' }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowNewMessage(false)}
                            className="clay-btn-sec"
                            style={{ height: '2.5rem', width: '2.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                        >
                            <ArrowLeft size={20} color="white" />
                        </button>
                        <div>
                            <h1 className="clay-display" style={{ fontSize: '1.25rem', color: '#fff' }}>New Message</h1>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem' }}>Compose a new conversation</p>
                        </div>
                    </div>
                </div>

                <div className="clay-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="clay-label">To *</label>
                            <select
                                value={newConversation.staffId}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, staffId: e.target.value }))}
                                className="clay-field"
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
                            <label className="clay-label">About Child (Optional)</label>
                            <select
                                value={newConversation.childId}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, childId: e.target.value }))}
                                className="clay-field"
                            >
                                <option value="">Select child (if applicable)...</option>
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>{child.name}</option>
                                ))}
                            </select>
                            {children.length === 0 && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>No children registered under your account</p>
                            )}
                        </div>

                        <div>
                            <label className="clay-label">Subject</label>
                            <input
                                type="text"
                                value={newConversation.subject}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Brief description of your inquiry"
                                className="clay-field"
                            />
                        </div>

                        <div>
                            <label className="clay-label">Message *</label>
                            <textarea
                                rows={5}
                                value={newConversation.message}
                                onChange={(e) => setNewConversation(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Type your message here..."
                                className="clay-field" style={{ resize: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                            <button
                                onClick={() => setShowNewMessage(false)}
                                className="clay-btn-sec"
                                style={{ flex: 1, padding: '0.75rem' }}
                                disabled={creatingConversation}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateConversation}
                                disabled={creatingConversation || !newConversation.staffId || !newConversation.message.trim()}
                                className="clay-cta"
                                style={{ flex: 1, padding: '0.75rem' }}
                            >
                                {creatingConversation ? (
                                    <Loader2 size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <Send size={16} style={{ marginRight: '0.5rem' }} />
                                )}
                                Send Message
                            </button>
                        </div>
                </div>

                <div className="clay-card-static" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'linear-gradient(135deg, #FFFBEB, #FFF7ED)' }}>
                    <div className="clay-ico" style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)', flexShrink: 0 }}>
                        <Clock size={16} color="white" />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#78350F' }}>Expected Response Time</p>
                        <p style={{ fontSize: '0.8125rem', color: '#B45309', marginTop: '0.125rem' }}>Normal inquiries within 24-48 hours. For urgent medical concerns, please call our emergency line.</p>
                    </div>
                </div>
            </div>
        )
    }

    // Conversation Thread View
    if (selectedConversation) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12rem)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #E5E7EB' }}>
                    <button
                        onClick={() => {
                            setSelectedConversation(null)
                            setMessages([])
                        }}
                        className="clay-btn-sec"
                        style={{ height: '2.5rem', width: '2.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <ArrowLeft size={20} style={{ color: 'var(--clay-text-muted)' }} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div className="clay-avatar" style={{ position: 'relative', height: '2.75rem', width: '2.75rem', borderRadius: '0.75rem', background: getStaffColor(selectedConversation.staffType), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                            {getStaffIcon(selectedConversation.staffType)}
                            <div className="live-dot" style={{ position: 'absolute', bottom: '-0.125rem', right: '-0.125rem', background: '#34D399', border: '2px solid #fff' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, color: 'var(--clay-text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedConversation.staffName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedConversation.subject}
                                {selectedConversation.childName && ` • About: ${selectedConversation.childName}`}
                            </p>
                        </div>
                    </div>

                    <button className="clay-btn-sec" style={{ height: '2.5rem', width: '2.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MoreVertical size={20} style={{ color: 'var(--clay-text-muted)' }} />
                    </button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loadingMessages ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.75rem' }}>
                            <div className="clay-ico" style={{ background: 'linear-gradient(135deg, #DBEAFE, #ECFDF5)' }}>
                                <Loader2 size={20} style={{ color: 'var(--clay-accent)', animation: 'spin 1s linear infinite' }} />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', textAlign: 'center' }}>
                            <div className="clay-empty-ico" style={{ marginBottom: '1rem' }}>
                                <Sparkles size={28} style={{ color: 'var(--clay-accent)' }} />
                            </div>
                            <p style={{ fontWeight: 500, color: 'var(--clay-text-dark)' }}>Start the conversation</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem', maxWidth: '15rem' }}>Send your first message to begin chatting</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                style={{ display: 'flex', justifyContent: message.senderType === 'caregiver' ? 'flex-end' : 'flex-start' }}
                            >
                                <div className={message.senderType === 'caregiver' ? 'clay-msg-sent' : 'clay-msg-received'}>
                                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{renderMessageContent(message.content)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', justifyContent: message.senderType === 'caregiver' ? 'flex-end' : 'flex-start' }}>
                                        <span style={{ fontSize: '0.625rem', color: message.senderType === 'caregiver' ? 'rgba(255,255,255,0.7)' : 'var(--clay-text-muted)' }}>
                                            {formatMessageTime(message.createdAt)}
                                        </span>
                                        {message.senderType === 'caregiver' && (
                                            <CheckCheck size={14} style={{ color: message.isRead ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="clay-btn-sec" style={{ height: '2.75rem', width: '2.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Paperclip size={20} style={{ color: 'var(--clay-text-muted)' }} />
                        </button>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Type a message..."
                                disabled={sending}
                                className="clay-chat-input"
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="clay-send-btn"
                        >
                            {sending ? (
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Send size={20} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Hero Header */}
            <div className="clay-hero">
                <div className="deco-blob" style={{ top: '-2.5rem', right: '-2.5rem', width: '8rem', height: '8rem' }} />
                <div className="deco-blob" style={{ bottom: '-2rem', left: '-2rem', width: '6rem', height: '6rem' }} />
                <div className="deco-blob" style={{ top: '1rem', right: '1rem', width: '4rem', height: '4rem', opacity: 0.3 }} />

                <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', marginBottom: '0.75rem' }}>
                                <MessageSquare size={12} color="rgba(255,255,255,0.9)" />
                                <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>Messaging</span>
                            </div>
                            <h1 className="clay-display" style={{ fontSize: '1.5rem', color: '#fff' }}>Messages</h1>
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Chat with your care team</p>
                        </div>
                        <button
                            onClick={() => { logActivity({ action: 'opened_new_message_modal', action_category: 'chat', description: 'Opened new message modal' }).catch(() => { }); setShowNewMessage(true) }}
                            className="clay-cta"
                            style={{ background: '#fff', color: 'var(--clay-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                            <Plus size={16} />
                            <span>Compose</span>
                        </button>
                    </div>

                    {/* Quick stats row */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.15)' }}>
                            <Inbox size={14} color="rgba(255,255,255,0.8)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{conversations.length}</span>
                            <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>chats</span>
                        </div>
                        {totalUnread > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.2)' }}>
                                <div className="live-dot" style={{ height: '0.5rem', width: '0.5rem' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{totalUnread}</span>
                                <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)' }}>unread</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clay-text-muted)', zIndex: 1 }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="clay-search"
                    style={{ paddingLeft: '2.75rem' }}
                />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
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
                        className={activeFilter === key ? 'clay-pill-active' : 'clay-pill'}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Conversations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredConversations.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 0', textAlign: 'center' }}>
                        <div className="clay-empty-ico" style={{ marginBottom: '1rem' }}>
                            <Search size={28} style={{ color: 'var(--clay-text-muted)' }} />
                        </div>
                        <p style={{ fontWeight: 600, color: 'var(--clay-text-dark)' }}>No conversations found</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem', maxWidth: '16rem' }}>Start a new conversation to connect with your care team</p>
                        <button
                            onClick={() => { logActivity({ action: 'opened_new_message_modal', action_category: 'chat', description: 'Opened new message modal (start conversation)' }).catch(() => { }); setShowNewMessage(true) }}
                            className="clay-cta"
                            style={{ marginTop: '1.25rem' }}
                        >
                            <Plus size={16} style={{ marginRight: '0.5rem' }} />
                            Start Conversation
                        </button>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                            className={conversation.unreadCount > 0 ? 'clay-convo-active' : 'clay-convo'}
                        >
                            <div className="clay-avatar" style={{ position: 'relative', height: '2.75rem', width: '2.75rem', borderRadius: '0.75rem', background: getStaffColor(conversation.staffType), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                {getStaffIcon(conversation.staffType)}
                                {conversation.unreadCount > 0 && (
                                    <div className="live-dot" style={{ position: 'absolute', top: '-0.25rem', right: '-0.25rem', border: '2px solid #fff' }} />
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conversation.unreadCount > 0 ? 700 : 600, color: 'var(--clay-text-dark)' }}>{conversation.staffName}</p>
                                    <span style={{ fontSize: '0.625rem', color: 'var(--clay-text-muted)', flexShrink: 0 }}>{formatTimestamp(conversation.lastMessageTime)}</span>
                                </div>
                                <p style={{ fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.125rem', color: conversation.unreadCount > 0 ? 'var(--clay-text-dark)' : 'var(--clay-text-muted)', fontWeight: conversation.unreadCount > 0 ? 500 : 400 }}>{conversation.lastMessage}</p>
                                {conversation.childName && (
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--clay-accent)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>About: {conversation.childName}</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                                {conversation.unreadCount > 0 && (
                                    <span className="clay-badge" style={{ background: 'var(--clay-accent)', color: '#fff', fontSize: '0.625rem', fontWeight: 700 }}>
                                        {conversation.unreadCount}
                                    </span>
                                )}
                                <ChevronRight size={16} style={{ color: 'var(--clay-text-muted)' }} />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Response time info */}
            <div className="clay-card-static" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'linear-gradient(135deg, #EFF6FF, #ECFDF5)' }}>
                <div className="clay-ico" style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', flexShrink: 0 }}>
                    <Shield size={16} color="white" />
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E3A5F' }}>Secure & Confidential</p>
                    <p style={{ fontSize: '0.8125rem', color: '#3B82F6', marginTop: '0.125rem', lineHeight: 1.5 }}>
                        Messages are encrypted. Normal response: 24-48 hrs. Urgent: 4 hrs during office hours.
                    </p>
                </div>
            </div>
        </div>
    )
}
