'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  BarChart,
  Package,
  ArrowLeft,
  ClipboardList,
  AlertTriangle,
  Search,
  Calendar,
  Clock,
  User,
  Pill,
  X,
  FileText,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types (keep your existing interfaces)
// ─────────────────────────────────────────────────────────────────────────────
interface DispensedPrescription {
  id: string
  status: string
  urgency: string
  prescribed_at: string
  dispensed_at: string | null
  notes: string | null
  child_id: string
  doctor_id: string
  pharmacist_id: string | null
  prescription_items: PrescriptionItem[]
  child: {
    id: string
    full_name: string
    date_of_birth: string
  } | null
  doctor: {
    id: string
    profiles: {
      full_name: string
    } | null
  } | null
  pharmacist: {
    id: string
    profiles: {
      full_name: string
    } | null
  } | null
}

interface PrescriptionItem {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  instructions: string | null
}

type TimeFilter = 'today' | 'week' | 'month' | 'all'

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PharmacyDispensedPage() {
  const [prescriptions, setPrescriptions] = useState<DispensedPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [selectedPrescription, setSelectedPrescription] = useState<DispensedPrescription | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ───────────────────────────────────────────────────────────────────────────
  // Data fetching (your original logic – unchanged)
  // ───────────────────────────────────────────────────────────────────────────
  const loadDispensedPrescriptions = useCallback(async () => {
    try {
      const supabase = createClient()

      let dateFilter = new Date()
      if (timeFilter === 'today') {
        dateFilter.setHours(0, 0, 0, 0)
      } else if (timeFilter === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7)
      } else if (timeFilter === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1)
      }

      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_items(*),
          child:children(id, full_name, date_of_birth),
          doctor:doctors(id, profiles(full_name)),
          pharmacist:pharmacists(id, profiles(full_name))
        `)
        .eq('status', 'dispensed')
        .order('dispensed_at', { ascending: false })

      if (timeFilter !== 'all') {
        query = query.gte('dispensed_at', dateFilter.toISOString())
      }

      const { data, error } = await query
      if (error) throw error

      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error loading dispensed prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }, [timeFilter])

  useEffect(() => {
    loadDispensedPrescriptions()

    const supabase = createClient()
    const channel = supabase
      .channel('dispensed-prescriptions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions', filter: 'status=eq.dispensed' },
        () => loadDispensedPrescriptions()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadDispensedPrescriptions])

  // ───────────────────────────────────────────────────────────────────────────
  // Derived data & helpers
  // ───────────────────────────────────────────────────────────────────────────
  const filteredPrescriptions = prescriptions.filter((p) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.child?.full_name?.toLowerCase().includes(search) ||
      p.doctor?.profiles?.full_name?.toLowerCase().includes(search) ||
      p.prescription_items?.some((item) =>
        item.medication_name?.toLowerCase().includes(search)
      )
    )
  })

  function getAge(dob: string) {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 1) {
      const months =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth())
      return `${months} mo`
    }
    return `${age} yrs`
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatTime(dateString: string | null) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const stats = {
    total: filteredPrescriptions.length,
    today: prescriptions.filter((p) => {
      if (!p.dispensed_at) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(p.dispensed_at) >= today
    }).length,
    thisWeek: prescriptions.filter((p) => {
      if (!p.dispensed_at) return false
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(p.dispensed_at) >= weekAgo
    }).length,
  }

  const clearSearch = () => setSearchTerm('')

  // ───────────────────────────────────────────────────────────────────────────
  // Loading state (no shadcn Skeleton – simple placeholder)
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // JSX (fully polished, Lucide icons, Tailwind v4 ready)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Dispensed History
          </h1>
          <p className="text-slate-500">View all dispensed prescriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none bg-linear-to-br from-green-50 to-emerald-50 shadow-md transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-green-700">
                Dispensed Today
              </p>
              <p className="text-3xl font-bold text-green-600">{stats.today}</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-br from-blue-50 to-indigo-50 shadow-md transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-blue-700">This Week</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.thisWeek}
              </p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm">
              <BarChart className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-br from-purple-50 to-violet-50 shadow-md transition-shadow hover:shadow-lg">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-purple-700">
                Filtered Results
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by patient, doctor, or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-10"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            {(['today', 'week', 'month', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`
                  rounded-md px-4 py-2 text-sm font-medium transition-colors
                  ${
                    timeFilter === filter
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                {filter === 'today' && 'Today'}
                {filter === 'week' && 'This Week'}
                {filter === 'month' && 'This Month'}
                {filter === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prescriptions List */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5 text-purple-500" />
              <span>
                {filteredPrescriptions.length} Dispensed Prescription
                {filteredPrescriptions.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-150 overflow-y-auto pr-2">
            {filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 text-lg font-medium text-slate-600">
                  No dispensed prescriptions
                </p>
                <p className="text-sm text-slate-400">
                  {searchTerm
                    ? 'No results match your search'
                    : 'Change the time filter to see more'}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-sm text-green-600 underline hover:text-green-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrescriptions.map((prescription) => (
                  <button
                    key={prescription.id}
                    onClick={() => setSelectedPrescription(prescription)}
                    className={`
                      w-full rounded-xl border p-4 text-left transition-all
                      hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
                      ${
                        selectedPrescription?.id === prescription.id
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                    `}
                    aria-selected={selectedPrescription?.id === prescription.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-green-400 to-emerald-500 text-white">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-slate-800">
                            {prescription.child?.full_name || 'Unknown'}
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-green-700"
                          >
                            Dispensed
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Pill className="h-3.5 w-3.5" />
                            {prescription.prescription_items?.length || 0} meds
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Dr. {prescription.doctor?.profiles?.full_name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(prescription.dispensed_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescription Details */}
        <Card
          className={`border-none shadow-md transition-opacity ${
            !selectedPrescription ? 'opacity-60' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              <span>Prescription Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-150 overflow-y-auto pr-2">
            {!selectedPrescription ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <ArrowLeft className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 text-lg font-medium text-slate-600">
                  Select a prescription
                </p>
                <p className="text-sm text-slate-400">
                  Choose from the list to view full details
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dispensing Info */}
                <div className="rounded-xl bg-linear-to-br from-green-50 to-emerald-50 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Dispensing Information
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-green-700">
                    <p className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Dispensed:</strong>{' '}
                        {formatDate(selectedPrescription.dispensed_at)}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>By:</strong>{' '}
                        {selectedPrescription.pharmacist?.profiles?.full_name ||
                          'Unknown'}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Time:</strong>{' '}
                        {formatTime(selectedPrescription.dispensed_at)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="rounded-xl bg-linear-to-br from-cyan-50 to-teal-50 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                    <User className="h-5 w-5" />
                    Patient Information
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>
                      <strong>Name:</strong>{' '}
                      {selectedPrescription.child?.full_name || 'Unknown'}
                    </p>
                    <p>
                      <strong>Age:</strong>{' '}
                      {selectedPrescription.child?.date_of_birth
                        ? getAge(selectedPrescription.child.date_of_birth)
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Prescribed by:</strong> Dr.{' '}
                      {selectedPrescription.doctor?.profiles?.full_name ||
                        'Unknown'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <strong>Prescribed:</strong>{' '}
                        {formatDate(selectedPrescription.prescribed_at)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                    <Pill className="h-5 w-5" />
                    Dispensed Medications
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.prescription_items?.map(
                      (item: PrescriptionItem, index: number) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800">
                                {item.medication_name}
                              </h4>
                              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
                                <p>
                                  <strong>Dosage:</strong> {item.dosage}
                                </p>
                                <p>
                                  <strong>Frequency:</strong> {item.frequency}
                                </p>
                                <p>
                                  <strong>Duration:</strong>{' '}
                                  {item.duration || 'Not specified'}
                                </p>
                                <p>
                                  <strong>Quantity:</strong>{' '}
                                  {item.quantity || 'Not specified'}
                                </p>
                              </div>
                              {item.instructions && (
                                <div className="mt-3 flex gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                  <p>
                                    <strong>Instructions:</strong>{' '}
                                    {item.instructions}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedPrescription.notes && (
                  <div className="rounded-xl bg-yellow-50 p-5">
                    <h3 className="flex items-center gap-2 font-semibold text-yellow-800">
                      <FileText className="h-5 w-5" />
                      Additional Notes
                    </h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}