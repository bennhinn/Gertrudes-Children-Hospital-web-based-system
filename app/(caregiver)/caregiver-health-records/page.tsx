'use client'

import { useState, useEffect } from 'react'
import { logActivity } from '@/lib/activity-logger'
import { createClient } from '@/lib/supabase/client'
import PaymentModal from '@/components/PaymentModal' // adjust path if needed
import {
  FileText,
  TestTube,
  Pill,
  Syringe,
  TrendingUp,
  Download,
  Share2,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Bell,
  RefreshCw,
  User,
  Stethoscope,
  Activity,
  X
} from 'lucide-react'

// ------------------------------------------------------------
// Interfaces that match the actual API response (with invoice)
// ------------------------------------------------------------
interface LabResult {
  id: string
  testName: string
  description: string
  status: string
  orderedAt: string
  completedAt?: string
  results?: any
  childId: string
  childName: string
  orderedBy: string
  invoice?: {
    id: string
    invoice_number: string
    total: number
    paid_amount: number
    balance_due: number
    status: 'pending' | 'paid' | 'cancelled'
    due_date: string
  } | null
}

interface Prescription {
  id: string
  medicationName: string
  genericName: string
  dosage: string
  form: string
  frequency: string
  prescribedBy: string
  prescribedDate: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'discontinued'
  refillsRemaining: number
  daysLeft?: number
  instructions: string
  childName: string
  childId: string
  reminderEnabled: boolean
  invoice?: {
    id: string
    invoice_number: string
    total: number
    paid_amount: number
    balance_due: number
    status: 'pending' | 'paid' | 'cancelled'
    due_date: string
  } | null
}

interface Child {
  id: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  bloodType?: string
  allergies?: string[]
}

export default function HealthRecordsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'lab' | 'prescriptions'>('lab')
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedLabResult, setSelectedLabResult] = useState<LabResult | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [childFilter, setChildFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedDescription, setSelectedDescription] = useState<string>('')

  // ------------------------------------------------------------
  // Fetch all health records from our fixed API
  // ------------------------------------------------------------
  async function fetchHealthRecords() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/health-records')
      if (!response.ok) {
        throw new Error('Failed to fetch health records')
      }

      const data = await response.json()

      // Map API fields to our interfaces (invoice data is already attached)
      setChildren(
        (data.children || []).map((c: any) => ({
          id: c.id,
          fullName: c.fullName,
          dateOfBirth: c.dateOfBirth,
          gender: c.gender,
          bloodType: c.bloodType,
          allergies: c.allergies || []
        }))
      )

      setLabResults(data.labResults || [])
      setPrescriptions(data.prescriptions || [])
    } catch (err) {
      console.error('Error fetching health records:', err)
      setError('Failed to load health records. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealthRecords()
  }, [])

  // Log that caregiver viewed health records
  useEffect(() => {
    logActivity({ action: 'caregiver_health_records_view', action_category: 'report', description: 'Viewed health records' }).catch(() => {})
  }, [])

  // ------------------------------------------------------------
  // Toggle reminder preference (example – replace with real API)
  // ------------------------------------------------------------
  async function toggleReminder(prescriptionId: string, currentState: boolean) {
    try {
      // Optimistic update
      setPrescriptions(prev =>
        prev.map(rx =>
          rx.id === prescriptionId
            ? { ...rx, reminderEnabled: !currentState }
            : rx
        )
      )
      if (selectedPrescription?.id === prescriptionId) {
        setSelectedPrescription(prev =>
          prev ? { ...prev, reminderEnabled: !currentState } : null
        )
      }
      // Log toggling prescription reminder
      logActivity({ action: 'toggle_prescription_reminder', action_category: 'prescription', target_table: 'prescriptions', target_id: prescriptionId, description: `Toggled reminder to ${!currentState}` }).catch(() => {})
    } catch (err) {
      console.error('Failed to update reminder:', err)
    }
  }

  // ------------------------------------------------------------
  // Payment handlers
  // ------------------------------------------------------------
  function handlePayNow(invoice: any, description: string) {
    setSelectedInvoice(invoice)
    setSelectedDescription(description)
    setShowPaymentModal(true)
  }

  function handlePaymentSuccess() {
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    setSelectedDescription('')
    fetchHealthRecords() // refresh to update invoice status
  }

  // ------------------------------------------------------------
  // Filtering
  // ------------------------------------------------------------
  const filteredLabResults = labResults.filter(result => {
    if (childFilter !== 'all' && result.childId !== childFilter) return false
    if (searchQuery) {
      return result.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.childName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (childFilter !== 'all' && rx.childId !== childFilter) return false
    if (searchQuery) {
      return rx.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rx.childName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // ------------------------------------------------------------
  // Status badge styling
  // ------------------------------------------------------------
  const getStatusStyle = (status: string, isAbnormal?: boolean) => {
    if (isAbnormal) return { background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA' }
    switch (status.toLowerCase()) {
      case 'completed':
      case 'collected':
      case 'dispensed':
        return { background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }
      case 'active':
        return { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }
      case 'pending':
      case 'processing':
        return { background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }
      case 'discontinued':
      case 'cancelled':
        return { background: '#F8FAFC', color: '#334155', borderColor: '#E2E8F0' }
      default:
        return { background: '#F8FAFC', color: '#334155', borderColor: '#E2E8F0' }
    }
  }

  // ------------------------------------------------------------
  // Loading skeleton
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
        <div className="shimmer" style={{ height: 32, width: 160, borderRadius: 16 }} />
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 96, borderRadius: 20 }} />
          ))}
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Error state
  // ------------------------------------------------------------
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
        <h1 className="clay-display" style={{ fontSize: '1.5rem', color: 'var(--clay-text-dark)' }}>Health Records</h1>
        <div className="clay-card-static" style={{ background: '#FEF2F2', padding: '1.5rem', textAlign: 'center' }}>
          <AlertCircle style={{ height: 48, width: 48, color: '#EF4444', margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: '1rem' }}>{error}</p>
          <button
            className="clay-cta clay-cta-rose"
            onClick={() => {
              setError(null)
              fetchHealthRecords()
            }}
            style={{ padding: '0.625rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw style={{ height: 16, width: 16 }} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Lab Result Detail View
  // ------------------------------------------------------------
  if (selectedLabResult) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
        <button
          onClick={() => setSelectedLabResult(null)}
          className="clay-btn-sec"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft style={{ height: 16, width: 16 }} />
          Back to Lab Results
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>{selectedLabResult.testName}</h1>
            <p style={{ color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>{selectedLabResult.childName}</p>
            {selectedLabResult.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-mid)', marginTop: '0.5rem' }}>{selectedLabResult.description}</p>
            )}
          </div>
          <span className="clay-badge" style={getStatusStyle(selectedLabResult.status)}>
            {selectedLabResult.status}
          </span>
        </div>

        <div className="clay-card-static" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Ordered on</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>
                {new Date(selectedLabResult.orderedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
            {selectedLabResult.completedAt && (
              <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Completed on</span>
                <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>
                  {new Date(selectedLabResult.completedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Ordered by</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>{selectedLabResult.orderedBy}</span>
            </div>
          </div>
        </div>

        {/* Display results if available */}
        {selectedLabResult.results && (
          <div className="clay-card-static" style={{ overflow: 'hidden' }}>
            <div style={{ borderBottom: '1px solid rgba(199,210,254,.5)', padding: '1rem 1rem 0.75rem' }}>
              <h3 className="clay-display" style={{ fontSize: '1rem', color: 'var(--clay-text-dark)' }}>Results</h3>
            </div>
            <div style={{ padding: '1rem' }}>
              {typeof selectedLabResult.results === 'string' ? (
                <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--clay-text-dark)' }}>
                  {selectedLabResult.results}
                </p>
              ) : (
                <pre className="clay-inset" style={{ fontSize: '0.75rem', padding: '0.75rem', overflowX: 'auto', margin: 0 }}>
                  {JSON.stringify(selectedLabResult.results, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="clay-btn-sec" style={{ flex: 1, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Share2 style={{ height: 16, width: 16 }} />
            Share
          </button>
          <button className="clay-cta" style={{ flex: 1, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
            <Download style={{ height: 16, width: 16 }} />
            Download PDF
          </button>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Prescription Detail View
  // ------------------------------------------------------------
  if (selectedPrescription) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
        <button
          onClick={() => setSelectedPrescription(null)}
          className="clay-btn-sec"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft style={{ height: 16, width: 16 }} />
          Back to Prescriptions
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>{selectedPrescription.medicationName}</h1>
            {selectedPrescription.genericName && (
              <p style={{ color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>{selectedPrescription.genericName}</p>
            )}
          </div>
          <span className="clay-badge" style={getStatusStyle(selectedPrescription.status)}>
            {selectedPrescription.status}
          </span>
        </div>

        {/* Medication Details */}
        <div className="clay-card-static" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="clay-ico" style={{ height: 56, width: 56, borderRadius: 18, background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
                <Pill style={{ height: 28, width: 28, color: '#fff' }} />
              </div>
              <div>
                <p className="clay-display" style={{ fontSize: '1.125rem', color: 'var(--clay-text-dark)' }}>
                  {selectedPrescription.dosage} {selectedPrescription.form}
                </p>
                <p style={{ color: 'var(--clay-text-muted)' }}>{selectedPrescription.frequency}</p>
              </div>
            </div>

            {selectedPrescription.daysLeft && selectedPrescription.status === 'active' && (
              <div className="clay-inset" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ height: 16, width: 16, color: 'var(--clay-amber)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E' }}>
                  {selectedPrescription.daysLeft} days remaining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="clay-card-static" style={{ overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid rgba(199,210,254,.5)', padding: '1rem 1rem 0.75rem' }}>
            <h3 className="clay-display" style={{ fontSize: '1rem', color: 'var(--clay-text-dark)' }}>Instructions</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--clay-text-dark)', lineHeight: 1.6 }}>{selectedPrescription.instructions}</p>
          </div>
        </div>

        {/* Prescription Info */}
        <div className="clay-card-static" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>For</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>{selectedPrescription.childName}</span>
            </div>
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Prescribed by</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>{selectedPrescription.prescribedBy}</span>
            </div>
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Start Date</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>
                {new Date(selectedPrescription.startDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
            {selectedPrescription.endDate && (
              <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>End Date</span>
                <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>
                  {new Date(selectedPrescription.endDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            <div className="clay-info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clay-text-muted)', fontSize: '0.875rem' }}>Refills Remaining</span>
              <span style={{ fontWeight: 600, color: 'var(--clay-text-dark)', fontSize: '0.875rem' }}>{selectedPrescription.refillsRemaining}</span>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="clay-card-static" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="clay-ico" style={{ height: 40, width: 40, borderRadius: 14, background: 'linear-gradient(135deg, var(--clay-indigo-s), var(--clay-indigo-l))' }}>
                <Bell style={{ height: 20, width: 20, color: 'var(--clay-indigo)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--clay-text-dark)' }}>Medication Reminders</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>Get notified when it&apos;s time to take</p>
              </div>
            </div>
            <button
              onClick={() => toggleReminder(selectedPrescription.id, selectedPrescription.reminderEnabled)}
              className="clay-toggle"
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: 24,
                width: 44,
                alignItems: 'center',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                background: selectedPrescription.reminderEnabled ? 'var(--clay-indigo)' : '#CBD5E1'
              }}
              role="switch"
              aria-checked={selectedPrescription.reminderEnabled}
            >
              <span
                className="clay-toggle-knob"
                style={{
                  display: 'inline-block',
                  height: 20,
                  width: 20,
                  borderRadius: 9999,
                  background: '#fff',
                  transform: selectedPrescription.reminderEnabled ? 'translateX(22px)' : 'translateX(2px)'
                }}
              />
            </button>
          </div>
        </div>

        {/* Refill Request */}
        {selectedPrescription.status === 'active' && selectedPrescription.refillsRemaining > 0 && (
          <button className="clay-cta" style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            <RefreshCw style={{ height: 16, width: 16 }} />
            Request Refill
          </button>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------
  // Main List View
  // ------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="clay-display" style={{ fontSize: '1.5rem', color: 'var(--clay-text-dark)' }}>Health Records</h1>
          <p style={{ color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>Lab results, prescriptions & medical history</p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true)
            fetchHealthRecords()
          }}
          className="clay-btn-sec"
          style={{ padding: '0.5rem', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={refreshing}
        >
          <RefreshCw style={{ height: 16, width: 16, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="clay-tabs" style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => setActiveTab('lab')}
          className={`clay-tab ${activeTab === 'lab' ? 'clay-tab-active' : ''}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
        >
          <TestTube style={{ height: 16, width: 16 }} />
          Lab Results
          {labResults.filter(r => r.status.toLowerCase() !== 'completed').length > 0 && (
            <span style={{ height: 20, minWidth: 20, padding: '0 6px', borderRadius: 9999, background: 'var(--clay-amber)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {labResults.filter(r => r.status.toLowerCase() !== 'completed').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`clay-tab ${activeTab === 'prescriptions' ? 'clay-tab-active' : ''}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem' }}
        >
          <Pill style={{ height: 16, width: 16 }} />
          Prescriptions
          {prescriptions.filter(p => p.status === 'active').length > 0 && (
            <span style={{ height: 20, minWidth: 20, padding: '0 6px', borderRadius: 9999, background: 'var(--clay-indigo)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {prescriptions.filter(p => p.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', height: 18, width: 18, color: 'var(--clay-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'lab' ? 'lab results' : 'medications'}...`}
            className="clay-search"
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.875rem' }}
          />
        </div>
        <select
          value={childFilter}
          onChange={(e) => setChildFilter(e.target.value)}
          className="clay-field"
          style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
        >
          <option value="all">All Children</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Lab Results Tab */}
      {activeTab === 'lab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredLabResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div className="clay-empty-ico">
                <TestTube style={{ height: 32, width: 32, color: 'var(--clay-indigo)' }} />
              </div>
              <p style={{ color: 'var(--clay-text-dark)', fontWeight: 600 }}>No lab results found</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>Results will appear here when available</p>
            </div>
          ) : (
            filteredLabResults.map((result) => {
              // Determine if abnormal – you may need to derive this from `results`
              const isAbnormal = false // TODO: implement logic based on your data
              const showPayButton = result.invoice && result.invoice.status !== 'paid'

              return (
                <button
                  key={result.id}
                  onClick={() => setSelectedLabResult(result)}
                  className="clay-row"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textAlign: 'left', border: 'none', cursor: 'pointer' }}
                >
                  <div
                    className="clay-ico"
                    style={{
                      height: 48,
                      width: 48,
                      borderRadius: 16,
                      background: isAbnormal
                        ? 'linear-gradient(135deg, #FEF2F2, #FECDD3)'
                        : result.status.toLowerCase() === 'completed'
                        ? 'linear-gradient(135deg, #ECFDF5, #A7F3D0)'
                        : 'linear-gradient(135deg, #FFFBEB, #FDE68A)'
                    }}
                  >
                    {isAbnormal ? (
                      <AlertCircle style={{ height: 24, width: 24, color: '#EF4444' }} />
                    ) : result.status.toLowerCase() === 'completed' ? (
                      <CheckCircle style={{ height: 24, width: 24, color: '#10B981' }} />
                    ) : (
                      <Clock style={{ height: 24, width: 24, color: '#F59E0B' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.testName}</p>
                      {isAbnormal && (
                        <span className="clay-badge" style={{ background: '#FEF2F2', color: '#B91C1C', borderColor: '#FECACA', fontSize: 10 }}>
                          Abnormal
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>{result.childName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', marginTop: 2 }}>
                      {new Date(result.orderedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} &bull; {result.orderedBy}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span className="clay-badge" style={getStatusStyle(result.status)}>
                      {result.status}
                    </span>
                    {showPayButton && (
                      <button
                        className="clay-cta"
                        style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePayNow(result.invoice, result.testName)
                        }}
                      >
                        Pay Now
                      </button>
                    )}
                    <ChevronRight style={{ height: 20, width: 20, color: 'var(--clay-text-muted)' }} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Active Medications */}
          {filteredPrescriptions.filter(p => p.status === 'active').length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 className="clay-label" style={{ color: 'var(--clay-text-muted)', marginBottom: '0.75rem' }}>
                Active Medications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredPrescriptions
                  .filter(p => p.status === 'active')
                  .map((rx) => {
                    const showPayButton = rx.invoice && rx.invoice.status !== 'paid'
                    return (
                      <button
                        key={rx.id}
                        onClick={() => setSelectedPrescription(rx)}
                        className="clay-row"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textAlign: 'left', border: 'none', cursor: 'pointer' }}
                      >
                        <div className="clay-ico" style={{ height: 48, width: 48, borderRadius: 16, background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', flexShrink: 0 }}>
                          <Pill style={{ height: 24, width: 24, color: '#8B5CF6' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)' }}>{rx.medicationName}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
                            {rx.dosage} &bull; {rx.frequency}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', marginTop: 2 }}>{rx.childName}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {rx.daysLeft && (
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--clay-amber)' }}>{rx.daysLeft} days left</p>
                          )}
                          {rx.reminderEnabled && <Bell style={{ height: 16, width: 16, color: 'var(--clay-indigo)' }} />}
                          {showPayButton && (
                            <button
                              className="clay-cta"
                              style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePayNow(rx.invoice, rx.medicationName)
                              }}
                            >
                              Pay Now
                            </button>
                          )}
                          <ChevronRight style={{ height: 20, width: 20, color: 'var(--clay-text-muted)' }} />
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Past Medications */}
          {filteredPrescriptions.filter(p => p.status !== 'active').length > 0 && (
            <div>
              <h3 className="clay-label" style={{ color: 'var(--clay-text-muted)', marginBottom: '0.75rem' }}>
                Past Medications
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredPrescriptions
                  .filter(p => p.status !== 'active')
                  .map((rx) => {
                    const showPayButton = rx.invoice && rx.invoice.status !== 'paid'
                    return (
                      <button
                        key={rx.id}
                        onClick={() => setSelectedPrescription(rx)}
                        className="clay-row"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', textAlign: 'left', border: 'none', cursor: 'pointer', opacity: 0.75 }}
                      >
                        <div className="clay-ico" style={{ height: 48, width: 48, borderRadius: 16, background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', flexShrink: 0 }}>
                          <Pill style={{ height: 24, width: 24, color: '#94A3B8' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: 'var(--clay-text-mid)' }}>{rx.medicationName}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
                            {rx.dosage} &bull; {rx.frequency}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', marginTop: 2 }}>{rx.childName}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {showPayButton && (
                            <button
                              className="clay-cta"
                              style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePayNow(rx.invoice, rx.medicationName)
                              }}
                            >
                              Pay Now
                            </button>
                          )}
                          <span className="clay-badge" style={getStatusStyle(rx.status)}>{rx.status}</span>
                          <ChevronRight style={{ height: 20, width: 20, color: 'var(--clay-text-muted)' }} />
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {filteredPrescriptions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div className="clay-empty-ico">
                <Pill style={{ height: 32, width: 32, color: 'var(--clay-indigo)' }} />
              </div>
              <p style={{ color: 'var(--clay-text-dark)', fontWeight: 600 }}>No prescriptions found</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: '0.25rem' }}>Prescriptions will appear here when available</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal – rendered conditionally */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoice_number}
          totalAmount={selectedInvoice.balance_due || selectedInvoice.total}
          items={[{
            description: selectedDescription,
            quantity: 1,
            amount: selectedInvoice.balance_due || selectedInvoice.total
          }]}
          subtotal={selectedInvoice.balance_due || selectedInvoice.total}
          tax={0}
          discount={0}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}