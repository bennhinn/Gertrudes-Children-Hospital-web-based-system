'use client'

import { useState, useEffect } from 'react'
import { logActivity } from '@/lib/activity-logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const getStatusColor = (status: string, isAbnormal?: boolean) => {
    if (isAbnormal) return 'bg-red-50 text-red-700 border-red-200'
    switch (status.toLowerCase()) {
      case 'completed':
      case 'collected':
      case 'dispensed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'discontinued':
      case 'cancelled':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  // ------------------------------------------------------------
  // Loading skeleton
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
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
      <div className="space-y-6 pb-20 lg:pb-6">
        <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-800 font-medium mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                fetchHealthRecords()
              }}
              className="rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Lab Result Detail View
  // ------------------------------------------------------------
  if (selectedLabResult) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <button
          onClick={() => setSelectedLabResult(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab Results
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selectedLabResult.testName}</h1>
            <p className="text-slate-500 mt-1">{selectedLabResult.childName}</p>
            {selectedLabResult.description && (
              <p className="text-sm text-slate-600 mt-2">{selectedLabResult.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(selectedLabResult.status)}>
            {selectedLabResult.status}
          </Badge>
        </div>

        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Ordered on</span>
              <span className="font-medium text-slate-900">
                {new Date(selectedLabResult.orderedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
            {selectedLabResult.completedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Completed on</span>
                <span className="font-medium text-slate-900">
                  {new Date(selectedLabResult.completedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Ordered by</span>
              <span className="font-medium text-slate-900">{selectedLabResult.orderedBy}</span>
            </div>
          </CardContent>
        </Card>

        {/* Display results if available */}
        {selectedLabResult.results && (
          <Card className="border-slate-100">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {typeof selectedLabResult.results === 'string' ? (
                <p className="text-sm whitespace-pre-wrap text-slate-700">
                  {selectedLabResult.results}
                </p>
              ) : (
                <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedLabResult.results, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-xl py-5">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="flex-1 rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------
  // Prescription Detail View
  // ------------------------------------------------------------
  if (selectedPrescription) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <button
          onClick={() => setSelectedPrescription(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescriptions
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selectedPrescription.medicationName}</h1>
            {selectedPrescription.genericName && (
              <p className="text-slate-500 mt-1">{selectedPrescription.genericName}</p>
            )}
          </div>
          <Badge className={getStatusColor(selectedPrescription.status)}>
            {selectedPrescription.status}
          </Badge>
        </div>

        {/* Medication Details */}
        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Pill className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {selectedPrescription.dosage} {selectedPrescription.form}
                </p>
                <p className="text-slate-500">{selectedPrescription.frequency}</p>
              </div>
            </div>

            {selectedPrescription.daysLeft && selectedPrescription.status === 'active' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {selectedPrescription.daysLeft} days remaining
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-slate-700">{selectedPrescription.instructions}</p>
          </CardContent>
        </Card>

        {/* Prescription Info */}
        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">For</span>
              <span className="font-medium text-slate-900">{selectedPrescription.childName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Prescribed by</span>
              <span className="font-medium text-slate-900">{selectedPrescription.prescribedBy}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Start Date</span>
              <span className="font-medium text-slate-900">
                {new Date(selectedPrescription.startDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
            {selectedPrescription.endDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">End Date</span>
                <span className="font-medium text-slate-900">
                  {new Date(selectedPrescription.endDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Refills Remaining</span>
              <span className="font-medium text-slate-900">{selectedPrescription.refillsRemaining}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Medication Reminders</p>
                  <p className="text-sm text-slate-500">Get notified when it&apos;s time to take</p>
                </div>
              </div>
              <button
                onClick={() => toggleReminder(selectedPrescription.id, selectedPrescription.reminderEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedPrescription.reminderEnabled ? 'bg-blue-600' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={selectedPrescription.reminderEnabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    selectedPrescription.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Refill Request */}
        {selectedPrescription.status === 'active' && selectedPrescription.refillsRemaining > 0 && (
          <Button className="w-full rounded-xl py-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Refill
          </Button>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------
  // Main List View
  // ------------------------------------------------------------
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
          <p className="text-slate-500 mt-1">Lab results, prescriptions & medical history</p>
        </div>
        <Button
          onClick={() => {
            setRefreshing(true)
            fetchHealthRecords()
          }}
          variant="ghost"
          size="sm"
          className="rounded-xl"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'lab'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TestTube className="h-4 w-4" />
          Lab Results
          {labResults.filter(r => r.status.toLowerCase() !== 'completed').length > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              {labResults.filter(r => r.status.toLowerCase() !== 'completed').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'prescriptions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="h-4 w-4" />
          Prescriptions
          {prescriptions.filter(p => p.status === 'active').length > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {prescriptions.filter(p => p.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'lab' ? 'lab results' : 'medications'}...`}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={childFilter}
          onChange={(e) => setChildFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
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
        <div className="space-y-3">
          {filteredLabResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <TestTube className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No lab results found</p>
              <p className="text-sm text-slate-400 mt-1">Results will appear here when available</p>
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
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
                >
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isAbnormal
                        ? 'bg-red-50'
                        : result.status.toLowerCase() === 'completed'
                        ? 'bg-emerald-50'
                        : 'bg-amber-50'
                    }`}
                  >
                    {isAbnormal ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : result.status.toLowerCase() === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-900 truncate">{result.testName}</p>
                      {isAbnormal && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                          Abnormal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{result.childName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(result.orderedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} • {result.orderedBy}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    {showPayButton && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePayNow(result.invoice, result.testName)
                        }}
                      >
                        Pay Now
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-3">
          {/* Active Medications */}
          {filteredPrescriptions.filter(p => p.status === 'active').length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Active Medications
              </h3>
              <div className="space-y-3">
                {filteredPrescriptions
                  .filter(p => p.status === 'active')
                  .map((rx) => {
                    const showPayButton = rx.invoice && rx.invoice.status !== 'paid'
                    return (
                      <button
                        key={rx.id}
                        onClick={() => setSelectedPrescription(rx)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                          <Pill className="h-6 w-6 text-purple-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{rx.medicationName}</p>
                          <p className="text-sm text-slate-500">
                            {rx.dosage} • {rx.frequency}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{rx.childName}</p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          {rx.daysLeft && (
                            <p className="text-sm font-medium text-amber-600">{rx.daysLeft} days left</p>
                          )}
                          {rx.reminderEnabled && <Bell className="h-4 w-4 text-blue-500" />}
                          {showPayButton && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePayNow(rx.invoice, rx.medicationName)
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-slate-300" />
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
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Past Medications
              </h3>
              <div className="space-y-3">
                {filteredPrescriptions
                  .filter(p => p.status !== 'active')
                  .map((rx) => {
                    const showPayButton = rx.invoice && rx.invoice.status !== 'paid'
                    return (
                      <button
                        key={rx.id}
                        onClick={() => setSelectedPrescription(rx)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all text-left opacity-75 hover:opacity-100"
                      >
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Pill className="h-6 w-6 text-slate-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700">{rx.medicationName}</p>
                          <p className="text-sm text-slate-500">
                            {rx.dosage} • {rx.frequency}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{rx.childName}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {showPayButton && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePayNow(rx.invoice, rx.medicationName)
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                          <Badge className={getStatusColor(rx.status)}>{rx.status}</Badge>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Pill className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No prescriptions found</p>
              <p className="text-sm text-slate-400 mt-1">Prescriptions will appear here when available</p>
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