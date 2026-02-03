'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useFAQ } from '@/hooks/UseFAQ'
import FAQItem from '@/components/faq-item'
import {
  User,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Smartphone,
  MessageSquare,
  Calendar,
  TestTube,
  Pill,
  FileText,
  ExternalLink,
  LogOut,
  Trash2,
  Download,
  CheckCircle,
  Search,
  Loader2
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
}

interface NotificationSettings {
  pushEnabled: boolean
  appointmentReminder1Day: boolean
  appointmentReminder1Hour: boolean
  labResultsNotification: boolean
  prescriptionNotification: boolean
  messageNotification: boolean
  emailWeeklySummary: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushEnabled: true,
    appointmentReminder1Day: true,
    appointmentReminder1Hour: true,
    labResultsNotification: true,
    prescriptionNotification: true,
    messageNotification: true,
    emailWeeklySummary: true,
  })
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [saving, setSaving] = useState(false)

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'compliment' | 'general'>('general')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  // FAQ state
  const [showFAQs, setShowFAQs] = useState(false)
  const [faqSearchQuery, setFaqSearchQuery] = useState('')
  const { items: faqItems, loading: faqLoading, searchFAQ, markHelpful } = useFAQ({ popular: true, limit: 10 })

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUser({
        id: user.id,
        email: user.email || '',
        fullName: (user.user_metadata as any)?.full_name || 'User',
        phone: (user.user_metadata as any)?.phone || '',
      })
    }
    setLoading(false)
  }

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSendFeedback = async () => {
    if (!feedbackContent.trim()) return

    setFeedbackSending(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          content: feedbackContent.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send feedback')
      }

      setFeedbackSuccess(true)
      setFeedbackContent('')

      // Close modal after showing success
      setTimeout(() => {
        setShowFeedbackModal(false)
        setFeedbackSuccess(false)
        setFeedbackType('general')
      }, 2000)
    } catch (error) {
      console.error('Error sending feedback:', error)
      alert('Failed to send feedback. Please try again.')
    } finally {
      setFeedbackSending(false)
    }
  }

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Personal information & contact details',
      icon: User,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Reminders & alerts preferences',
      icon: Bell,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Password, 2FA & data settings',
      icon: Shield,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Theme, language & display',
      icon: Palette,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'FAQs, contact & feedback',
      icon: HelpCircle,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version & information',
      icon: Info,
      color: 'text-slate-600 bg-slate-100',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Profile Section View
  if (activeSection === 'profile') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information</p>
        </div>

        <Card className="border-slate-100">
          <CardContent className="p-6 space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <Button variant="secondary" size="sm" className="rounded-lg">
                  Change Photo
                </Button>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 5MB</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.fullName}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    disabled
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  defaultValue={user?.phone}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                <textarea
                  rows={3}
                  placeholder="Enter your address"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Emergency Contact</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <Button className="w-full rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Notifications Section View
  if (activeSection === 'notifications') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Manage how you receive updates</p>
        </div>

        <Card className="border-slate-100">
          <CardContent className="p-0 divide-y divide-slate-100">
            {/* Push Notifications Master Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Push Notifications</p>
                  <p className="text-sm text-slate-500">Enable all push notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('pushEnabled')}
                className={`relative w-12 h-6 rounded-full transition-colors ${notifications.pushEnabled ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications.pushEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
              </button>
            </div>

            {/* Appointment Reminders */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <p className="font-medium text-slate-900">Appointment Reminders</p>
              </div>
              <div className="space-y-3 pl-13">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600">1 day before</span>
                  <button
                    onClick={() => handleNotificationToggle('appointmentReminder1Day')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${notifications.appointmentReminder1Day ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.appointmentReminder1Day ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600">1 hour before</span>
                  <button
                    onClick={() => handleNotificationToggle('appointmentReminder1Hour')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${notifications.appointmentReminder1Hour ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.appointmentReminder1Hour ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Medical Updates */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TestTube className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="font-medium text-slate-900">Medical Updates</p>
              </div>
              <div className="space-y-3 pl-13">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600">Lab results ready</span>
                  <button
                    onClick={() => handleNotificationToggle('labResultsNotification')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${notifications.labResultsNotification ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.labResultsNotification ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600">Prescription updates</span>
                  <button
                    onClick={() => handleNotificationToggle('prescriptionNotification')}
                    className={`relative w-10 h-5 rounded-full transition-colors ${notifications.prescriptionNotification ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.prescriptionNotification ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                  </button>
                </label>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">New Messages</p>
                  <p className="text-sm text-slate-500">From doctors & staff</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('messageNotification')}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifications.messageNotification ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.messageNotification ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </button>
            </div>

            {/* Email */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Weekly Summary Email</p>
                  <p className="text-sm text-slate-500">Activity digest every Monday</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('emailWeeklySummary')}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifications.emailWeeklySummary ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications.emailWeeklySummary ? 'translate-x-5' : 'translate-x-0'
                  }`} />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Privacy & Security Section View
  if (activeSection === 'privacy') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Privacy & Security</h1>
          <p className="text-slate-500 mt-1">Protect your account and data</p>
        </div>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Account Security</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-500">Update your password</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add extra security layer</p>
                </div>
              </div>
              <button className="relative w-10 h-5 rounded-full bg-slate-200 transition-colors">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Fingerprint className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Biometric Login</p>
                  <p className="text-sm text-slate-500">Face ID / Fingerprint</p>
                </div>
              </div>
              <button className="relative w-10 h-5 rounded-full bg-blue-500 transition-colors">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm translate-x-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Download className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Download My Data</p>
                  <p className="text-sm text-slate-500">Export all your data</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-slate-500">Permanently delete your account</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-red-400" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardContent className="p-0 divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <p className="font-medium text-slate-900">Privacy Policy</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <p className="font-medium text-slate-900">Terms of Service</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Preferences Section View
  if (activeSection === 'preferences') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Preferences</h1>
          <p className="text-slate-500 mt-1">Customize your app experience</p>
        </div>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border-2 transition-all ${theme === 'light'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <Sun className={`h-6 w-6 mx-auto mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-slate-600'}`}>Light</p>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <Moon className={`h-6 w-6 mx-auto mb-2 ${theme === 'dark' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-600' : 'text-slate-600'}`}>Dark</p>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-4 rounded-xl border-2 transition-all ${theme === 'system'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <Smartphone className={`h-6 w-6 mx-auto mb-2 ${theme === 'system' ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-medium ${theme === 'system' ? 'text-blue-600' : 'text-slate-600'}`}>System</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Language & Region</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date Format</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Time Format</label>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-600 font-medium text-sm">
                  12-hour
                </button>
                <button className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300">
                  24-hour
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Help & Support Section View
  if (activeSection === 'help') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
          <p className="text-slate-500 mt-1">Get help and provide feedback</p>
        </div>

        {/* FAQ Section */}
        <Card className="border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowFAQs(!showFAQs)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-900">Frequently Asked Questions</p>
                <p className="text-sm text-slate-500">Find answers to common questions</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${showFAQs ? 'rotate-180' : ''}`} />
          </button>

          {showFAQs && (
            <div className="border-t border-slate-100">
              {/* FAQ Search */}
              <div className="p-4 bg-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => {
                      setFaqSearchQuery(e.target.value)
                      if (e.target.value.length > 2) {
                        searchFAQ(e.target.value)
                      }
                    }}
                    placeholder="Search FAQs..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* FAQ Items */}
              <div className="divide-y divide-slate-100">
                {faqLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-500 mt-2">Loading FAQs...</p>
                  </div>
                ) : faqItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No FAQs found</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {faqItems.map((item) => (
                      <FAQItem
                        key={item.id}
                        item={item}
                        onMarkHelpful={markHelpful}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            <a href="mailto:support@gch.co.ke" className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Email Support</p>
                  <p className="text-sm text-slate-500">support@gch.co.ke</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </a>

            <a href="tel:+254123456789" className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-900">Call Support</p>
                  <p className="text-sm text-slate-500">+254 123 456 789</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <p className="font-medium text-slate-900">Send Feedback</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          </CardContent>
        </Card>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !feedbackSending && setShowFeedbackModal(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              {feedbackSuccess ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Thank You!</h3>
                  <p className="text-slate-600">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Send Feedback</h3>
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      disabled={feedbackSending}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      <span className="text-xl text-slate-500">×</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Feedback Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'suggestion', label: '💡 Suggestion' },
                          { value: 'bug', label: '🐛 Bug Report' },
                          { value: 'compliment', label: '❤️ Compliment' },
                          { value: 'general', label: '💬 General' },
                        ].map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setFeedbackType(type.value as any)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${feedbackType === type.value
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                              }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Feedback
                      </label>
                      <textarea
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        placeholder="Tell us what you think..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-900 placeholder:text-slate-400"
                        disabled={feedbackSending}
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowFeedbackModal(false)}
                      disabled={feedbackSending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendFeedback}
                      disabled={feedbackSending || !feedbackContent.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      {feedbackSending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Feedback'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // About Section View
  if (activeSection === 'about') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Settings
        </button>

        <div className="text-center py-6">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <span className="text-3xl font-bold text-white">GCH</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Gertrude&apos;s Children Hospital</h1>
          <p className="text-slate-500">Caregiver App</p>
          <p className="text-sm text-slate-400 mt-2">Version 2.0.0 (Build 145)</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            Up to date
          </div>
        </div>

        <Card className="border-slate-100">
          <CardContent className="p-0 divide-y divide-slate-100">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Device</span>
              <span className="text-sm font-medium text-slate-900">Web Browser</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">App Size</span>
              <span className="text-sm font-medium text-slate-900">12.3 MB</span>
            </div>
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-600">Clear Cache</span>
              <span className="text-sm font-medium text-blue-600">Clear</span>
            </button>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardContent className="p-0 divide-y divide-slate-100">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">What&apos;s New</p>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <p className="text-sm font-medium text-slate-900">Open Source Licenses</p>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          © 2026 Gertrude&apos;s Children&apos;s Hospital.<br />All rights reserved.
        </p>
      </div>
    )
  }

  // Main Settings View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* User Card */}
      <Card className="border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-lg">
                {user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-lg">{user?.fullName}</p>
                <p className="text-white/80 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="space-y-2">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${section.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">{section.title}</p>
                <p className="text-sm text-slate-500">{section.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          )
        })}
      </div>

      {/* Sign Out */}
      <form action="/api/auth/logout" method="POST">
        <Button
          type="submit"
          variant="ghost"
          className="w-full rounded-xl border border-red-200 py-5 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </div>
  )
}
