'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { logActivity } from '@/lib/activity-logger'
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
  X,
  ArrowLeft
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
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 384, width: '100%' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="clay-card-static"
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            background: toast.type === 'success' ? 'var(--clay-emerald-s)' : toast.type === 'error' ? 'var(--clay-rose-s)' : 'var(--clay-sky-s)',
            borderLeft: `4px solid ${toast.type === 'success' ? 'var(--clay-emerald)' : toast.type === 'error' ? 'var(--clay-rose)' : 'var(--clay-sky)'}`,
          }}
        >
          <div style={{ marginTop: 2, color: toast.type === 'success' ? 'var(--clay-emerald)' : toast.type === 'error' ? 'var(--clay-rose)' : 'var(--clay-sky)' }}>
            {toast.type === 'success' && <CheckCircle style={{ width: 20, height: 20 }} />}
            {toast.type === 'error' && <AlertCircle style={{ width: 20, height: 20 }} />}
            {toast.type === 'info' && <Info style={{ width: 20, height: 20 }} />}
          </div>
          <p style={{ fontSize: 14, color: 'var(--clay-text-dark)', flex: 1, margin: 0 }}>{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay-text-muted)', padding: 0 }}
            aria-label="Dismiss"
          >
            <X style={{ width: 16, height: 16 }} />
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
    <div className="clay-modal" onClick={onClose}>
      <div className="clay-card-static" style={{ position: 'relative', width: '100%', maxWidth: 448, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 24 }}>
          <h3 className="clay-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--clay-text-dark)', marginBottom: 8 }}>{title}</h3>
          <p style={{ fontSize: 14, color: 'var(--clay-text-mid)', margin: 0 }}>{description}</p>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
          <button className="clay-btn-sec" onClick={onClose} style={{ flex: 1, padding: '12px 20px', fontSize: 14 }}>
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`clay-cta ${confirmVariant === 'destructive' ? 'clay-cta-rose' : ''}`}
            style={{ flex: 1, padding: '12px 20px', fontSize: 14 }}
          >
            {confirmText}
          </button>
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
    logActivity({ action: 'caregiver_settings_view', action_category: 'system', description: 'Viewed settings page' }).catch(() => { })
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
      logActivity({ action: 'caregiver_feedback_send', action_category: 'other', description: `Feedback sent: ${feedbackType}`, metadata: { type: feedbackType } }).catch(() => { })

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
        bg: 'var(--clay-indigo-s)',
        iconColor: 'var(--clay-indigo)'
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Reminders & alerts preferences',
        icon: Bell,
        bg: 'var(--clay-amber-s)',
        iconColor: 'var(--clay-amber)'
      },
      {
        id: 'privacy',
        title: 'Privacy & Security',
        description: 'Password, 2FA & data settings',
        icon: Shield,
        bg: 'var(--clay-emerald-s)',
        iconColor: 'var(--clay-emerald)'
      },
      {
        id: 'preferences',
        title: 'Preferences',
        description: 'Theme, language & display',
        icon: Palette,
        bg: 'var(--clay-purple-s)',
        iconColor: 'var(--clay-purple)'
      },
      {
        id: 'help',
        title: 'Help & Support',
        description: 'FAQs, contact & feedback',
        icon: HelpCircle,
        bg: 'var(--clay-cyan-s)',
        iconColor: 'var(--clay-cyan)'
      },
      {
        id: 'about',
        title: 'About',
        description: 'App version & information',
        icon: Info,
        bg: '#F1F5F9',
        iconColor: '#475569'
      }
    ],
    []
  )

  // --- Loading State ---
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hero skeleton */}
        <div className="clay-hero shimmer" style={{ padding: 24, height: 120 }} />
        {/* Section skeletons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="clay-card-static" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
              <div className="shimmer" style={{ width: 44, height: 44, borderRadius: 16, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="shimmer" style={{ width: 96, height: 16, borderRadius: 8 }} />
                <div className="shimmer" style={{ width: 160, height: 12, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- Profile Section ---
  if (activeSection === 'profile') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,.12)' }} />
            <div className="deco-blob" style={{ width: 70, height: 70, bottom: -20, left: -20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <h1 className="clay-display" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Profile</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Manage your personal information</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="clay-card-static" style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Profile Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="clay-ico" style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontSize: 22, fontWeight: 800, color: 'white' }}>
                  {user?.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <button className="clay-btn-sec" style={{ padding: '8px 16px', fontSize: 13 }}>
                    Change Photo
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--clay-text-muted)', marginTop: 4 }}>JPG, PNG. Max 5MB</p>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="fullName" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Full Name <span style={{ color: 'var(--clay-rose)' }}>*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={profileForm.fullName || ''}
                    onChange={(e) => handleProfileChange('fullName', e.target.value)}
                    className="clay-field"
                    style={{
                      width: '100%', padding: '10px 16px', fontSize: 14,
                      borderColor: profileErrors.fullName ? 'var(--clay-rose)' : undefined,
                    }}
                    aria-invalid={!!profileErrors.fullName}
                    aria-describedby={profileErrors.fullName ? 'fullName-error' : undefined}
                  />
                  {profileErrors.fullName && (
                    <p id="fullName-error" style={{ marginTop: 4, fontSize: 12, color: 'var(--clay-rose)' }}>
                      {profileErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      className="clay-field"
                      style={{ width: '100%', padding: '10px 16px', fontSize: 14, background: '#F1F0FB', color: 'var(--clay-text-muted)', cursor: 'not-allowed' }}
                      disabled
                    />
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--clay-emerald)' }}>
                      <CheckCircle style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Verified</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={profileForm.phone || ''}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="clay-field"
                    style={{
                      width: '100%', padding: '10px 16px', fontSize: 14,
                      borderColor: profileErrors.phone ? 'var(--clay-rose)' : undefined,
                    }}
                    aria-invalid={!!profileErrors.phone}
                    aria-describedby={profileErrors.phone ? 'phone-error' : undefined}
                  />
                  {profileErrors.phone && (
                    <p id="phone-error" style={{ marginTop: 4, fontSize: 12, color: 'var(--clay-rose)' }}>
                      {profileErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={profileForm.address || ''}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    placeholder="Enter your address"
                    className="clay-field"
                    style={{ width: '100%', padding: '10px 16px', fontSize: 14, resize: 'none' }}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="clay-inset" style={{ padding: 20 }}>
                <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 16 }}>Emergency Contact</span>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <label htmlFor="emergencyName" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                      Contact Name
                    </label>
                    <input
                      id="emergencyName"
                      type="text"
                      value={profileForm.emergencyContact?.name || ''}
                      onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                      placeholder="Full name"
                      className="clay-field"
                      style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label htmlFor="emergencyPhone" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                      Contact Phone
                    </label>
                    <input
                      id="emergencyPhone"
                      type="tel"
                      value={profileForm.emergencyContact?.phone || ''}
                      onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="clay-field"
                      style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="clay-cta clay-cta-emerald"
                style={{ width: '100%', padding: '14px 24px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {profileSaving ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Notifications Section ---
  if (activeSection === 'notifications') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,.12)' }} />
            <div className="deco-blob" style={{ width: 70, height: 70, bottom: -20, left: -20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <h1 className="clay-display" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Notifications</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Manage how you receive updates</p>
            </div>
          </div>

          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            {/* Push Notifications Master Toggle */}
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-sky-s)' }}>
                  <Smartphone style={{ width: 20, height: 20, color: 'var(--clay-sky)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Push Notifications</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Enable all push notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('pushEnabled')}
                className="clay-toggle"
                style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: notifications.pushEnabled ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                role="switch"
                aria-checked={notifications.pushEnabled}
                aria-label="Toggle push notifications"
              >
                <span className="clay-toggle-knob" style={{ position: 'absolute', top: 3, left: notifications.pushEnabled ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>

            {/* Appointment Reminders */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-amber-s)' }}>
                  <Calendar style={{ width: 20, height: 20, color: 'var(--clay-amber)' }} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Appointment Reminders</p>
              </div>
              <div className="clay-inset" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>1 day before</span>
                  <button
                    onClick={() => handleNotificationToggle('appointmentReminder1Day')}
                    className="clay-toggle"
                    style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.appointmentReminder1Day ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                    role="switch"
                    aria-checked={notifications.appointmentReminder1Day}
                  >
                    <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.appointmentReminder1Day ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
                  </button>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>1 hour before</span>
                  <button
                    onClick={() => handleNotificationToggle('appointmentReminder1Hour')}
                    className="clay-toggle"
                    style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.appointmentReminder1Hour ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                    role="switch"
                    aria-checked={notifications.appointmentReminder1Hour}
                  >
                    <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.appointmentReminder1Hour ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
                  </button>
                </label>
              </div>
            </div>

            {/* Medical Updates */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-emerald-s)' }}>
                  <TestTube style={{ width: 20, height: 20, color: 'var(--clay-emerald)' }} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Medical Updates</p>
              </div>
              <div className="clay-inset" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>Lab results ready</span>
                  <button
                    onClick={() => handleNotificationToggle('labResultsNotification')}
                    className="clay-toggle"
                    style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.labResultsNotification ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                    role="switch"
                    aria-checked={notifications.labResultsNotification}
                  >
                    <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.labResultsNotification ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
                  </button>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>Prescription updates</span>
                  <button
                    onClick={() => handleNotificationToggle('prescriptionNotification')}
                    className="clay-toggle"
                    style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.prescriptionNotification ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                    role="switch"
                    aria-checked={notifications.prescriptionNotification}
                  >
                    <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.prescriptionNotification ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
                  </button>
                </label>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-purple-s)' }}>
                  <MessageSquare style={{ width: 20, height: 20, color: 'var(--clay-purple)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>New Messages</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>From doctors & staff</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('messageNotification')}
                className="clay-toggle"
                style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.messageNotification ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                role="switch"
                aria-checked={notifications.messageNotification}
              >
                <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.messageNotification ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>

            {/* Email */}
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-cyan-s)' }}>
                  <Mail style={{ width: 20, height: 20, color: 'var(--clay-cyan)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Weekly Summary Email</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Activity digest every Monday</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationToggle('emailWeeklySummary')}
                className="clay-toggle"
                style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: notifications.emailWeeklySummary ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                role="switch"
                aria-checked={notifications.emailWeeklySummary}
              >
                <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: notifications.emailWeeklySummary ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={notificationsSaving}
            className="clay-cta"
            style={{ width: '100%', padding: '14px 24px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {notificationsSaving ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Privacy & Security Section ---
  if (activeSection === 'privacy') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,.12)' }} />
            <div className="deco-blob" style={{ width: 70, height: 70, bottom: -20, left: -20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <h1 className="clay-display" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Privacy & Security</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Protect your account and data</p>
            </div>
          </div>

          {/* Account Security */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Account Security</span>
            </div>

            <button
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid var(--clay-indigo-l)', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => addToast('info', 'Change password coming soon')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-sky-s)' }}>
                  <Lock style={{ width: 20, height: 20, color: 'var(--clay-sky)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Change Password</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Update your password</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </button>

            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-purple-s)' }}>
                  <Smartphone style={{ width: 20, height: 20, color: 'var(--clay-purple)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Two-Factor Authentication</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Add extra security layer</p>
                </div>
              </div>
              <button
                onClick={handleTwoFactorToggle}
                className="clay-toggle"
                style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: twoFactorEnabled ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                role="switch"
                aria-checked={twoFactorEnabled}
              >
                <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: twoFactorEnabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>

            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-emerald-s)' }}>
                  <Fingerprint style={{ width: 20, height: 20, color: 'var(--clay-emerald)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Biometric Login</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Face ID / Fingerprint</p>
                </div>
              </div>
              <button
                onClick={handleBiometricToggle}
                className="clay-toggle"
                style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', background: biometricEnabled ? 'var(--clay-indigo)' : '#D1D5DB', cursor: 'pointer', border: 'none' }}
                role="switch"
                aria-checked={biometricEnabled}
              >
                <span className="clay-toggle-knob" style={{ position: 'absolute', top: 2, left: biometricEnabled ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Data & Privacy</span>
            </div>

            <button
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid var(--clay-indigo-l)', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => addToast('info', 'Data download coming soon')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-cyan-s)' }}>
                  <Download style={{ width: 20, height: 20, color: 'var(--clay-cyan)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Download My Data</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Export all your data</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-rose-s)' }}>
                  <Trash2 style={{ width: 20, height: 20, color: 'var(--clay-rose)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-rose)', fontSize: 14, margin: 0 }}>Delete Account</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Permanently delete your account</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </button>
          </div>

          {/* Legal Links */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <button
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid var(--clay-indigo-l)', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => window.open('/privacy', '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: '#F1F5F9' }}>
                  <FileText style={{ width: 20, height: 20, color: '#475569' }} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Privacy Policy</p>
              </div>
              <ExternalLink style={{ width: 16, height: 16, color: 'var(--clay-text-muted)' }} />
            </button>

            <button
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onClick={() => window.open('/terms', '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: '#F1F5F9' }}>
                  <FileText style={{ width: 20, height: 20, color: '#475569' }} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Terms of Service</p>
              </div>
              <ExternalLink style={{ width: 16, height: 16, color: 'var(--clay-text-muted)' }} />
            </button>
          </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', color: 'white', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,.12)' }} />
            <div className="deco-blob" style={{ width: 70, height: 70, bottom: -20, left: -20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <h1 className="clay-display" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Preferences</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Customize your app experience</p>
            </div>
          </div>

          {/* Appearance */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Appearance</span>
            </div>
            <div style={{ padding: 20 }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-mid)', marginBottom: 12 }}>Theme</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {([
                  { key: 'light' as const, label: 'Light', Icon: Sun },
                  { key: 'dark' as const, label: 'Dark', Icon: Moon },
                  { key: 'system' as const, label: 'System', Icon: Smartphone },
                ]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={theme === key ? 'clay-card-static' : 'clay-inset'}
                    style={{
                      padding: 16, textAlign: 'center', cursor: 'pointer', border: theme === key ? '2px solid var(--clay-indigo)' : '2px solid transparent',
                      background: theme === key ? 'var(--clay-indigo-s)' : undefined, borderRadius: 16,
                    }}
                    aria-pressed={theme === key}
                  >
                    <Icon style={{ width: 24, height: 24, margin: '0 auto 8px', display: 'block', color: theme === key ? 'var(--clay-indigo)' : 'var(--clay-text-muted)' }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme === key ? 'var(--clay-indigo)' : 'var(--clay-text-mid)', margin: 0 }}>{label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Language & Region</span>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="language" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="clay-field"
                  style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <div>
                <label htmlFor="dateFormat" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="clay-field"
                  style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <span className="clay-label" style={{ color: 'var(--clay-text-mid)', marginBottom: 12 }}>Time Format</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setTimeFormat('12h')}
                    className={`clay-pill ${timeFormat === '12h' ? 'clay-pill-active' : ''}`}
                    style={{ flex: 1, padding: '10px 16px', fontSize: 13 }}
                    aria-pressed={timeFormat === '12h'}
                  >
                    12-hour
                  </button>
                  <button
                    onClick={() => setTimeFormat('24h')}
                    className={`clay-pill ${timeFormat === '24h' ? 'clay-pill-active' : ''}`}
                    style={{ flex: 1, padding: '10px 16px', fontSize: 13 }}
                    aria-pressed={timeFormat === '24h'}
                  >
                    24-hour
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={preferencesSaving}
            className="clay-cta"
            style={{ width: '100%', padding: '14px 24px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {preferencesSaving ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  // --- Help & Support Section ---
  if (activeSection === 'help') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #06B6D4, #0284C7)', color: 'white', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 100, height: 100, top: -30, right: -30, background: 'rgba(255,255,255,.12)' }} />
            <div className="deco-blob" style={{ width: 70, height: 70, bottom: -20, left: -20, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <h1 className="clay-display" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Help & Support</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>Get help and provide feedback</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setShowFAQs(!showFAQs)}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              aria-expanded={showFAQs}
              aria-controls="faq-section"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-sky-s)' }}>
                  <HelpCircle style={{ width: 20, height: 20, color: 'var(--clay-sky)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Frequently Asked Questions</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>Find answers to common questions</p>
                </div>
              </div>
              <ChevronDown style={{ width: 20, height: 20, color: 'var(--clay-text-muted)', transition: 'transform 0.2s', transform: showFAQs ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {showFAQs && (
              <div id="faq-section" style={{ borderTop: '1px solid var(--clay-indigo-l)' }}>
                {/* FAQ Search */}
                <div className="clay-inset" style={{ margin: 16, padding: 12, position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--clay-text-muted)' }} />
                    <input
                      type="text"
                      value={faqSearchQuery}
                      onChange={(e) => setFaqSearchQuery(e.target.value)}
                      placeholder="Search FAQs..."
                      className="clay-search"
                      style={{ width: '100%', padding: '10px 16px 10px 40px', fontSize: 14 }}
                      aria-label="Search frequently asked questions"
                    />
                    {isSearching && (
                      <Loader2 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--clay-text-muted)', animation: 'spin 1s linear infinite' }} />
                    )}
                  </div>
                </div>

                {/* FAQ Items */}
                <div>
                  {faqLoading ? (
                    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 style={{ width: 24, height: 24, color: 'var(--clay-indigo)', animation: 'spin 1s linear infinite' }} />
                      <p style={{ fontSize: 14, color: 'var(--clay-text-muted)', marginTop: 8 }}>Loading FAQs...</p>
                    </div>
                  ) : faqItems.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                      <div className="clay-empty-ico">
                        <HelpCircle style={{ width: 28, height: 28, color: 'var(--clay-indigo)' }} />
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--clay-text-muted)' }}>No FAQs found</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {faqItems.map((item) => (
                        <FAQItem key={item.id} item={item} onMarkHelpful={markHelpful} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Contact Support</span>
            </div>

            <a
              href="mailto:support@gch.co.ke"
              style={{ display: 'flex', width: '100%', padding: 16, alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', borderBottom: '1px solid var(--clay-indigo-l)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-purple-s)' }}>
                  <Mail style={{ width: 20, height: 20, color: 'var(--clay-purple)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Email Support</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>support@gch.co.ke</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </a>

            <a
              href="tel:+254123456789"
              style={{ display: 'flex', width: '100%', padding: 16, alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-emerald-s)' }}>
                  <Phone style={{ width: 20, height: 20, color: 'var(--clay-emerald)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Call Support</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0 }}>+254 123 456 789</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </a>
          </div>

          {/* Feedback */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--clay-indigo-l)' }}>
              <span className="clay-label" style={{ color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 0 }}>Feedback</span>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="clay-ico" style={{ width: 40, height: 40, background: 'var(--clay-amber-s)' }}>
                  <MessageSquare style={{ width: 20, height: 20, color: 'var(--clay-amber)' }} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>Send Feedback</p>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)' }} />
            </button>
          </div>

          {/* Feedback Modal */}
          {showFeedbackModal && (
            <div className="clay-modal" onClick={() => !feedbackSending && setShowFeedbackModal(false)}>
              <div className="clay-card-static" style={{ position: 'relative', width: '100%', maxWidth: 448, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                {feedbackSuccess ? (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <div className="clay-ico" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--clay-emerald-s)', margin: '0 auto 16px' }}>
                      <CheckCircle style={{ width: 32, height: 32, color: 'var(--clay-emerald)' }} />
                    </div>
                    <h3 className="clay-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--clay-text-dark)', marginBottom: 8 }}>Thank You!</h3>
                    <p style={{ color: 'var(--clay-text-mid)', fontSize: 14, margin: 0 }}>Your feedback has been submitted successfully.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--clay-indigo-l)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 className="clay-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--clay-text-dark)', margin: 0 }}>Send Feedback</h3>
                      <button
                        onClick={() => setShowFeedbackModal(false)}
                        disabled={feedbackSending}
                        style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay-text-muted)' }}
                        aria-label="Close modal"
                      >
                        <X style={{ width: 18, height: 18 }} />
                      </button>
                    </div>

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <span className="clay-label" style={{ color: 'var(--clay-text-mid)', marginBottom: 10 }}>Feedback Type</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {[
                            { value: 'suggestion', label: '💡 Suggestion' },
                            { value: 'bug', label: '🐛 Bug Report' },
                            { value: 'compliment', label: '❤️ Compliment' },
                            { value: 'general', label: '💬 General' }
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setFeedbackType(type.value as any)}
                              className={`clay-pill ${feedbackType === type.value ? 'clay-pill-active' : ''}`}
                              style={{ padding: '8px 12px', fontSize: 13 }}
                              aria-pressed={feedbackType === type.value}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="feedbackContent" className="clay-label" style={{ color: 'var(--clay-text-mid)', marginBottom: 10 }}>
                          Your Feedback
                        </label>
                        <textarea
                          id="feedbackContent"
                          value={feedbackContent}
                          onChange={(e) => setFeedbackContent(e.target.value)}
                          placeholder="Tell us what you think..."
                          rows={4}
                          className="clay-field"
                          style={{ width: '100%', padding: '12px 16px', fontSize: 14, resize: 'none' }}
                          disabled={feedbackSending}
                        />
                      </div>
                    </div>

                    <div style={{ padding: 16, borderTop: '1px solid var(--clay-indigo-l)', display: 'flex', gap: 12 }}>
                      <button
                        className="clay-btn-sec"
                        onClick={() => setShowFeedbackModal(false)}
                        disabled={feedbackSending}
                        style={{ flex: 1, padding: '12px 20px', fontSize: 14 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendFeedback}
                        disabled={feedbackSending || !feedbackContent.trim()}
                        className="clay-cta"
                        style={{ flex: 1, padding: '12px 20px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        {feedbackSending ? (
                          <>
                            <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                            Sending...
                          </>
                        ) : (
                          'Send Feedback'
                        )}
                      </button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div className="clay-hero" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: 'white', textAlign: 'center', position: 'relative' }}>
            <div className="deco-blob" style={{ width: 120, height: 120, top: -40, right: -40, background: 'rgba(255,255,255,.1)' }} />
            <div className="deco-blob" style={{ width: 80, height: 80, bottom: -30, left: -30, background: 'rgba(255,255,255,.1)' }} />
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveSection(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Back to settings">
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Settings</span>
              </button>
              <div className="clay-ico" style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px', backdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>GCH</span>
              </div>
              <h1 className="clay-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Gertrude&apos;s Children Hospital</h1>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, marginTop: 4 }}>Caregiver App</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 8 }}>Version 2.0.0 (Build 145)</p>
              <span className="clay-badge" style={{ background: 'rgba(255,255,255,.15)', color: 'white', marginTop: 10, display: 'inline-flex', backdropFilter: 'blur(8px)' }}>
                <CheckCircle style={{ width: 14, height: 14 }} />
                Up to date
              </span>
            </div>
          </div>

          {/* Device Info */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div className="clay-info-row" style={{ margin: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>Device</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay-text-dark)' }}>Web Browser</span>
            </div>
            <div className="clay-info-row" style={{ margin: '0 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>App Size</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay-text-dark)' }}>12.3 MB</span>
            </div>
            <button
              onClick={() => addToast('success', 'Cache cleared')}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderTop: '1px solid var(--clay-indigo-l)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 13, color: 'var(--clay-text-mid)' }}>Clear Cache</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clay-indigo)' }}>Clear</span>
            </button>
          </div>

          {/* Links */}
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => addToast('info', 'What\'s new coming soon')}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid var(--clay-indigo-l)', cursor: 'pointer' }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--clay-text-dark)', margin: 0 }}>What&apos;s New</p>
              <ChevronRight style={{ width: 16, height: 16, color: 'var(--clay-text-muted)' }} />
            </button>
            <button
              onClick={() => addToast('info', 'Licenses coming soon')}
              style={{ width: '100%', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--clay-text-dark)', margin: 0 }}>Open Source Licenses</p>
              <ChevronRight style={{ width: 16, height: 16, color: 'var(--clay-text-muted)' }} />
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--clay-text-muted)' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hero profile banner */}
        <div className="clay-hero" style={{ padding: '20px 28px', background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: 'white', position: 'relative' }}>
          <div className="deco-blob" style={{ width: 120, height: 120, top: -40, right: -40, background: 'rgba(255,255,255,.12)' }} />
          <div className="deco-blob" style={{ width: 80, height: 80, bottom: -30, left: -30, background: 'rgba(255,255,255,.1)' }} />
          <div className="deco-blob" style={{ width: 60, height: 60, top: 16, right: 16, background: 'rgba(255,255,255,.05)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="clay-avatar" style={{ width: 60, height: 60, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {user?.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="clay-badge" style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)', fontSize: 10, marginBottom: 6, backdropFilter: 'blur(8px)' }}>
                Caregiver Account
              </span>
              <p style={{ fontWeight: 800, fontSize: 18, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</p>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="clay-row"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div className="clay-ico" style={{ width: 44, height: 44, background: section.bg, flexShrink: 0 }}>
                  <Icon style={{ width: 20, height: 20, color: section.iconColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 14, margin: 0 }}>{section.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section.description}</p>
                </div>
                <ChevronRight style={{ width: 20, height: 20, color: 'var(--clay-text-muted)', flexShrink: 0 }} />
              </button>
            )
          })}
        </div>

        {/* Sign Out */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="clay-cta clay-cta-rose"
            style={{ width: '100%', padding: '14px 24px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            Sign Out
          </button>
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
