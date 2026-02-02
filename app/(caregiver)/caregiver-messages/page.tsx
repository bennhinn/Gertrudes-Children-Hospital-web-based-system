'use client'

import { useState, useEffect } from 'react'
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
  Filter,
  MoreVertical,
  Phone,
  Video,
  X,
  Image as ImageIcon
} from 'lucide-react'

interface Conversation {
  id: string
  staffName: string
  staffType: 'doctor' | 'lab' | 'pharmacy' | 'support'
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  avatar?: string
  status: 'online' | 'offline' | 'away'
  childName?: string
}

interface Message {
  id: string
  senderId: string
  senderType: 'caregiver' | 'staff'
  text: string
  timestamp: string
  isRead: boolean
  attachments?: { name: string; type: string; url: string }[]
}

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: '1',
    staffName: 'Dr. Sarah Johnson',
    staffType: 'doctor',
    lastMessage: 'The test results look good. We can discuss further at the next appointment.',
    lastMessageTime: '2 hours ago',
    unreadCount: 2,
    status: 'online',
    childName: 'Mary Wanjiku',
  },
  {
    id: '2',
    staffName: 'Lab Department',
    staffType: 'lab',
    lastMessage: 'Sample collection reminder: Please bring your child tomorrow at 9 AM.',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    status: 'online',
  },
  {
    id: '3',
    staffName: 'Pharmacy',
    staffType: 'pharmacy',
    lastMessage: 'Your prescription is ready for pickup.',
    lastMessageTime: '2 days ago',
    unreadCount: 0,
    status: 'offline',
  },
  {
    id: '4',
    staffName: 'Support Team',
    staffType: 'support',
    lastMessage: 'Thank you for your feedback! We appreciate it.',
    lastMessageTime: '3 days ago',
    unreadCount: 0,
    status: 'away',
  },
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'caregiver',
    senderType: 'caregiver',
    text: 'Hi Dr. Johnson, I received Mary\'s CBC results and noticed the hemoglobin is slightly low. Should I be concerned?',
    timestamp: '9:30 AM',
    isRead: true,
  },
  {
    id: '2',
    senderId: 'doctor',
    senderType: 'staff',
    text: 'Thank you for reaching out. The hemoglobin is only slightly below the normal range, which is quite common in children. I recommend increasing iron-rich foods in her diet.',
    timestamp: '2:15 PM',
    isRead: true,
  },
  {
    id: '3',
    senderId: 'doctor',
    senderType: 'staff',
    text: 'The test results look good. We can discuss further at the next appointment.',
    timestamp: '2:20 PM',
    isRead: false,
  },
]

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'doctors' | 'lab' | 'pharmacy' | 'support'>('all')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setConversations(mockConversations)
      setLoading(false)
    }, 500)
  }, [])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessages(mockMessages)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: 'caregiver',
      senderType: 'caregiver',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isRead: false,
    }
    
    setMessages([...messages, message])
    setNewMessage('')
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

  const filteredConversations = conversations.filter(conv => {
    if (activeFilter !== 'all' && conv.staffType !== activeFilter.slice(0, -1)) {
      // Handle plural to singular conversion
      const filterType = activeFilter === 'doctors' ? 'doctor' : activeFilter
      if (conv.staffType !== filterType) return false
    }
    if (searchQuery) {
      return conv.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                <option value="">Select recipient...</option>
                <option value="doctor">Dr. Sarah Johnson</option>
                <option value="lab">Lab Department</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="support">General Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">About (Optional)</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                <option value="">Select child...</option>
                <option value="1">Mary Wanjiku</option>
                <option value="2">John Kamau</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                <option value="general">General Inquiry</option>
                <option value="appointment">Appointment</option>
                <option value="lab">Lab Results</option>
                <option value="prescription">Prescription</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <input 
                type="text"
                placeholder="Brief description of your inquiry"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea 
                rows={5}
                placeholder="Type your message here..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Attachments</label>
              <button className="w-full py-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Paperclip className="h-6 w-6" />
                  <span className="text-sm">Click to attach files (Max 5MB each)</span>
                </div>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowNewMessage(false)}
                className="flex-1 rounded-xl py-5"
              >
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Send className="h-4 w-4 mr-2" />
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
            onClick={() => setSelectedConversation(null)}
            className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className={`relative h-11 w-11 rounded-xl bg-gradient-to-br ${getStaffColor(selectedConversation.staffType)} flex items-center justify-center text-white shadow-lg`}>
              {getStaffIcon(selectedConversation.staffType)}
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                selectedConversation.status === 'online' ? 'bg-emerald-500' :
                selectedConversation.status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{selectedConversation.staffName}</p>
              <p className="text-xs text-slate-500">
                {selectedConversation.status === 'online' ? 'Online' : 
                 selectedConversation.status === 'away' ? 'Away' : 'Offline'}
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
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.senderType === 'caregiver' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  message.senderType === 'caregiver' ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-[10px] ${
                    message.senderType === 'caregiver' ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {message.timestamp}
                  </span>
                  {message.senderType === 'caregiver' && (
                    <CheckCheck className={`h-3.5 w-3.5 ${message.isRead ? 'text-white' : 'text-white/50'}`} />
                  )}
                </div>
              </div>
            </div>
          ))}
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
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="h-5 w-5" />
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
            onClick={() => setActiveFilter(filter as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter
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
                <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  conversation.status === 'online' ? 'bg-emerald-500' :
                  conversation.status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 truncate">{conversation.staffName}</p>
                  <span className="text-xs text-slate-400 shrink-0">{conversation.lastMessageTime}</span>
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
