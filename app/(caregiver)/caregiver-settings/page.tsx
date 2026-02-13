'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { logActivity } from '@/lib/activity-logger'
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
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'

// --- Types ---
interface UserProfile {
  id: string
  email: string
  fullName: string
  phone?: string
  address?: string
  emergencyContact?: {
    name: string
    phone: string
  }
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

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

// --- Simple Toast Component ---
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right bg-white border ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50'
              : toast.type === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div
            className={`mt-0.5 ${
              toast.type === 'success'
                ? 'text-emerald-600'
                : toast.type === 'error'
                ? 'text-red-600'
                : 'text-blue-600'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {toast.type === 'info' && <Info className="h-5 w-5" />}
          </div>
          <p className="text-sm text-slate-800 flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

// --- Confirmation Modal ---
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  confirmVariant = 'destructive'
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  confirmVariant?: 'destructive' | 'primary'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 ${
              confirmVariant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---
export default function SettingsPage() {
  // --- State ---
  // User & loading
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Profile form
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushEnabled: true,
    appointmentReminder1Day: true,
    appointmentReminder1Hour: true,
    labResultsNotification: true,
    prescriptionNotification: true,
    messageNotification: true,
    emailWeeklySummary: true
  })
  const [notificationsSaving, setNotificationsSaving] = useState(false)

  // Privacy & Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('en')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [preferencesSaving, setPreferencesSaving] = useState(false)

  // Feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'compliment' | 'general'>('general')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  // FAQ
  const [showFAQs, setShowFAQs] = useState(false)
  const [faqSearchQuery, setFaqSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const { items: faqItems, loading: faqLoading, searchFAQ, markHelpful } = useFAQ({ popular: true, limit: 10 })

  // --- Effects ---
  useEffect(() => {
    loadUserData()
  }, [])

  // Log that caregiver opened settings
  useEffect(() => {
    logActivity({ action: 'caregiver_settings_view', action_category: 'system', description: 'Viewed settings page' }).catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName,
        phone: user.phone || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || { name: '', phone: '' }
      })
    }
  }, [user])

  // Debounced FAQ search
  useEffect(() => {
    if (faqSearchQuery.length > 2) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
      setIsSearching(true)
      searchTimeout.current = setTimeout(() => {
        searchFAQ(faqSearchQuery)
        setIsSearching(false)
      }, 300)
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [faqSearchQuery, searchFAQ])

  // --- Data Fetching ---
  async function loadUserData() {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          fullName: (user.user_metadata as any)?.full_name || 'User',
          phone: (user.user_metadata as any)?.phone || '',
          address: (user.user_metadata as any)?.address || '',
          emergencyContact: (user.user_metadata as any)?.emergencyContact || { name: '', phone: '' }
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
      addToast('error', 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  // --- Validation ---
  const validateProfile = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!profileForm.fullName?.trim()) {
      errors.fullName = 'Full name is required'
    }
    if (profileForm.phone && !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(profileForm.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }, [profileForm])

  // --- Handlers ---
  const handleProfileChange = (field: string, value: any) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleEmergencyContactChange = (field: 'name' | 'phone', value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      emergencyContact: {
        ...(prev.emergencyContact || { name: '', phone: '' }),
        [field]: value
      }
    }))
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      addToast('error', 'Please fix the errors in the form')
      return
    }

    setProfileSaving(true)
    try {
      // Simulate API call - replace with actual save logic
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...profileForm } : null))

      addToast('success', 'Profile updated successfully')
    } catch (error) {
      console.error('Error saving profile:', error)
      addToast('error', 'Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      addToast('success', 'Notification preferences saved')
    } catch (error) {
      addToast('error', 'Failed to save notification preferences')
    } finally {
      setNotificationsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setPreferencesSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      // Apply theme if using system
      if (theme !== 'system') {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
      addToast('success', 'Preferences saved')
    } catch (error) {
      addToast('error', 'Failed to save preferences')
    } finally {
      setPreferencesSaving(false)
    }
  }

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    // In a real implementation, you would show setup flow here
    addToast('info', !twoFactorEnabled ? '2FA setup coming soon' : '2FA disabled')
  }

  const handleBiometricToggle = () => {
    setBiometricEnabled(!biometricEnabled)
    addToast('info', biometricEnabled ? 'Biometric login disabled' : 'Biometric login enabled')
  }

  const handleDeleteAccount = () => {
    // Actual delete logic would go here
    addToast('info', 'Account deletion is simulated')
    setShowDeleteConfirm(false)
  }

  const handleSignOut = () => {
    // Submit the logout form
    const form = document.querySelector('form[action="/api/auth/logout"]') as HTMLFormElement
    if (form) form.submit()
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
      addToast('success', 'Thank you for your feedback!')

      // Log feedback submission
      logActivity({ action: 'caregiver_feedback_send', action_category: 'other', description: `Feedback sent: ${feedbackType}`, metadata: { type: feedbackType } }).catch(() => {})

      setTimeout(() => {
        setShowFeedbackModal(false)
        setFeedbackSuccess(false)
        setFeedbackType('general')
        setFeedbackContent('')
      }, 2000)
    } catch (error) {
      console.error('Error sending feedback:', error)
      addToast('error', 'Failed to send feedback. Please try again.')
    } finally {
      setFeedbackSending(false)
    }
  }

  // --- Memoized Values ---
  const settingsSections = useMemo(
    () => [
      {
        id: 'profile',
        title: 'Profile',
        description: 'Personal information & contact details',
        icon: User,
        color: 'text-blue-600 bg-blue-50'
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Reminders & alerts preferences',
        icon: Bell,
        color: 'text-amber-600 bg-amber-50'
      },
      {
        id: 'privacy',
        title: 'Privacy & Security',
        description: 'Password, 2FA & data settings',
        icon: Shield,
        color: 'text-emerald-600 bg-emerald-50'
      },
      {
        id: 'preferences',
        title: 'Preferences',
        description: 'Theme, language & display',
        icon: Palette,
        color: 'text-purple-600 bg-purple-50'
      },
      {
        id: 'help',
        title: 'Help & Support',
        description: 'FAQs, contact & feedback',
        icon: HelpCircle,
        color: 'text-cyan-600 bg-cyan-50'
      },
      {
        id: 'about',
        title: 'About',
        description: 'App version & information',
        icon: Info,
        color: 'text-slate-600 bg-slate-100'
      }
    ],
    []
  )

  // --- Loading State ---
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

  // --- Profile Section ---
  if (activeSection === 'profile') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
                  {user?.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
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
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={profileForm.fullName || ''}
                    onChange={(e) => handleProfileChange('fullName', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      profileErrors.fullName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    } outline-none transition-all`}
                    aria-invalid={!!profileErrors.fullName}
                    aria-describedby={profileErrors.fullName ? 'fullName-error' : undefined}
                  />
                  {profileErrors.fullName && (
                    <p id="fullName-error" className="mt-1 text-xs text-red-600">
                      {profileErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
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
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={profileForm.phone || ''}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      profileErrors.phone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    } outline-none transition-all`}
                    aria-invalid={!!profileErrors.phone}
                    aria-describedby={profileErrors.phone ? 'phone-error' : undefined}
                  />
                  {profileErrors.phone && (
                    <p id="phone-error" className="mt-1 text-xs text-red-600">
                      {profileErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={profileForm.address || ''}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
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
                    <label htmlFor="emergencyName" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Contact Name
                    </label>
                    <input
                      id="emergencyName"
                      type="text"
                      value={profileForm.emergencyContact?.name || ''}
                      onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="emergencyPhone" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      id="emergencyPhone"
                      type="tel"
                      value={profileForm.emergencyContact?.phone || ''}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="w-full rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Notifications Section ---
  if (activeSection === 'notifications') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
                  className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    notifications.pushEnabled ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={notifications.pushEnabled}
                  aria-label="Toggle push notifications"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      notifications.pushEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
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
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        notifications.appointmentReminder1Day ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={notifications.appointmentReminder1Day}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifications.appointmentReminder1Day ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-600">1 hour before</span>
                    <button
                      onClick={() => handleNotificationToggle('appointmentReminder1Hour')}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        notifications.appointmentReminder1Hour ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={notifications.appointmentReminder1Hour}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifications.appointmentReminder1Hour ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
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
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        notifications.labResultsNotification ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={notifications.labResultsNotification}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifications.labResultsNotification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-slate-600">Prescription updates</span>
                    <button
                      onClick={() => handleNotificationToggle('prescriptionNotification')}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        notifications.prescriptionNotification ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={notifications.prescriptionNotification}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifications.prescriptionNotification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
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
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    notifications.messageNotification ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={notifications.messageNotification}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      notifications.messageNotification ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
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
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    notifications.emailWeeklySummary ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={notifications.emailWeeklySummary}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      notifications.emailWeeklySummary ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveNotifications}
            disabled={notificationsSaving}
            className="w-full rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {notificationsSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Privacy & Security Section ---
  if (activeSection === 'privacy') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                onClick={() => addToast('info', 'Change password coming soon')}
              >
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
                <button
                  onClick={handleTwoFactorToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    twoFactorEnabled ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={twoFactorEnabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
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
                <button
                  onClick={handleBiometricToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    biometricEnabled ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={biometricEnabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                onClick={() => addToast('info', 'Data download coming soon')}
              >
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

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
              >
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
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                onClick={() => window.open('/privacy', '_blank')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="font-medium text-slate-900">Privacy Policy</p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </button>

              <button
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                onClick={() => window.open('/terms', '_blank')}
              >
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

        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          description="This action cannot be undone. All your data will be permanently deleted. Are you sure you want to continue?"
          confirmText="Delete Account"
          confirmVariant="destructive"
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Preferences Section ---
  if (activeSection === 'preferences') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
                  className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={theme === 'light'}
                >
                  <Sun
                    className={`h-6 w-6 mx-auto mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  <p className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-slate-600'}`}>
                    Light
                  </p>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={theme === 'dark'}
                >
                  <Moon
                    className={`h-6 w-6 mx-auto mb-2 ${theme === 'dark' ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-600' : 'text-slate-600'}`}>
                    Dark
                  </p>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'system'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={theme === 'system'}
                >
                  <Smartphone
                    className={`h-6 w-6 mx-auto mb-2 ${theme === 'system' ? 'text-blue-600' : 'text-slate-400'}`}
                  />
                  <p className={`text-sm font-medium ${theme === 'system' ? 'text-blue-600' : 'text-slate-600'}`}>
                    System
                  </p>
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
                <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Time Format</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      timeFormat === '12h'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    aria-pressed={timeFormat === '12h'}
                  >
                    12-hour
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      timeFormat === '24h'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    aria-pressed={timeFormat === '24h'}
                  >
                    24-hour
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSavePreferences}
            disabled={preferencesSaving}
            className="w-full rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preferencesSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Help & Support Section ---
  if (activeSection === 'help') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              aria-expanded={showFAQs}
              aria-controls="faq-section"
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
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${showFAQs ? 'rotate-180' : ''}`}
              />
            </button>

            {showFAQs && (
              <div id="faq-section" className="border-t border-slate-100">
                {/* FAQ Search */}
                <div className="p-4 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={faqSearchQuery}
                      onChange={(e) => setFaqSearchQuery(e.target.value)}
                      placeholder="Search FAQs..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                      aria-label="Search frequently asked questions"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
                    )}
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
                        <FAQItem key={item.id} item={item} onMarkHelpful={markHelpful} />
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
              <a
                href="mailto:support@gch.co.ke"
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
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

              <a
                href="tel:+254123456789"
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
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
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                      >
                        <span className="text-xl text-slate-500">×</span>
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'suggestion', label: '💡 Suggestion' },
                            { value: 'bug', label: '🐛 Bug Report' },
                            { value: 'compliment', label: '❤️ Compliment' },
                            { value: 'general', label: '💬 General' }
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setFeedbackType(type.value as any)}
                              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                feedbackType === type.value
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                  : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                              }`}
                              aria-pressed={feedbackType === type.value}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="feedbackContent" className="block text-sm font-medium text-slate-700 mb-2">
                          Your Feedback
                        </label>
                        <textarea
                          id="feedbackContent"
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
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
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
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- About Section ---
  if (activeSection === 'about') {
    return (
      <>
        <div className="space-y-6">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1"
            aria-label="Back to settings"
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
              <button
                onClick={() => addToast('success', 'Cache cleared')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <span className="text-sm text-slate-600">Clear Cache</span>
                <span className="text-sm font-medium text-blue-600">Clear</span>
              </button>
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardContent className="p-0 divide-y divide-slate-100">
              <button
                onClick={() => addToast('info', 'What\'s new coming soon')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <p className="text-sm font-medium text-slate-900">What&apos;s New</p>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
              <button
                onClick={() => addToast('info', 'Licenses coming soon')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <p className="text-sm font-medium text-slate-900">Open Source Licenses</p>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400">
            © 2026 Gertrude&apos;s Children&apos;s Hospital.
            <br />
            All rights reserved.
          </p>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Main Settings View ---
  return (
    <>
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
                  {user?.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
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
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            type="button"
            variant="ghost"
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full rounded-xl border border-red-200 py-5 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all focus:ring-2 focus:ring-red-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        confirmVariant="destructive"
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}