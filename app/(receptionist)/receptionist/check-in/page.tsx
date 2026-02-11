'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  X,
  Ticket,
  Loader2,
  Search,
  RefreshCw,
  ArrowLeft,
  Baby,
  User,
  Phone,
  Cake,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarCheck,
  XCircle,
} from 'lucide-react'
import { isValidCheckInCode } from '@/utils/qr'

// Dynamically import the QR scanner (client only)
const QRScannerModal = dynamic(
  () => import('./components/QRScannerModal').then((mod) => mod.QRScannerModal),
  { ssr: false }
)

interface Appointment {
  id: string
  scheduled_for: string
  status: string
  child: {
    id: string
    full_name: string
    date_of_birth: string
  }
  caregiver: {
    id: string
    profiles: {
      full_name: string
      phone: string
    }
  }
}

// Queue Ticket Modal Component (unchanged)
function QueueTicketModal({
  isOpen,
  onClose,
  queueNumber,
  patientName,
  time,
}: {
  isOpen: boolean
  onClose: () => void
  queueNumber: number
  patientName: string
  time: string
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-sm animate-in slide-in-from-bottom fade-in duration-300 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Ticket className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Checked in successfully</h2>
            <p className="text-sm text-emerald-100 mt-0.5">Grand Children&apos;s Hospital</p>
          </div>

          {/* Dotted separator */}
          <div className="relative h-2 bg-white">
            <div className="absolute -top-1 left-4 h-4 w-4 rounded-full bg-black/50" />
            <div className="absolute -top-1 right-4 h-4 w-4 rounded-full bg-black/50" />
            <div className="border-t-2 border-dashed border-slate-200" />
          </div>

          {/* Queue number */}
          <div className="px-6 py-6 text-center bg-white">
            <p className="text-xs uppercase tracking-wider text-slate-400">Queue number</p>
            <div className="my-4 flex justify-center">
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center">
                <span className="text-7xl font-bold text-white">{queueNumber}</span>
              </div>
            </div>
            <p className="text-xl font-semibold text-slate-800">{patientName}</p>
            <p className="text-sm text-slate-500 mt-0.5">Checked in at {time}</p>

            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-700 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Patient is now in the queue
              </p>
              <p className="text-xs text-green-600 mt-1">
                Please ask them to wait in the waiting area
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="border-t border-slate-100 px-4 py-4 flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-base"
            >
              Check Another
            </Button>
            <Link href="/receptionist/queue" className="flex-1">
              <Button className="w-full h-12 rounded-xl text-base bg-gradient-to-r from-green-600 to-emerald-600">
                View Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader component (unchanged)
function AppointmentSkeleton() {
  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ticketModal, setTicketModal] = useState<{
    isOpen: boolean
    queueNumber: number
    patientName: string
    time: string
  }>({ isOpen: false, queueNumber: 0, patientName: '', time: '' })

  // New state for QR & manual code
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [checkingInByCode, setCheckingInByCode] = useState(false)

  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  // Load all today's appointments on mount
  useEffect(() => {
    loadTodayAppointments()
  }, [])

  async function loadTodayAppointments() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          child:children(id, full_name, date_of_birth),
          caregiver:caregivers(id, profiles(full_name, phone))
        `
        )
        .gte('scheduled_for', today.toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_for', { ascending: true })
        .limit(50)

      if (fetchError) throw fetchError

      setAllAppointments(data || [])
      setAppointments(data || [])
    } catch (err) {
      console.error('Load error:', err)
      setError('Failed to load appointments. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Filter appointments when search query changes (unchanged)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (searchQuery.length === 0) {
      setAppointments(allAppointments)
      return
    }

    if (searchQuery.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        const lowerQuery = searchQuery.toLowerCase()
        const filtered = allAppointments.filter((apt) => {
          const childName = apt.child?.full_name?.toLowerCase() || ''
          const caregiverName = apt.caregiver?.profiles?.full_name?.toLowerCase() || ''
          const phone = apt.caregiver?.profiles?.phone?.toLowerCase() || ''
          return (
            childName.includes(lowerQuery) ||
            caregiverName.includes(lowerQuery) ||
            phone.includes(lowerQuery)
          )
        })
        setAppointments(filtered)
      }, 200)
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [searchQuery, allAppointments])

  // ---------- CENTRAL CHECK-IN LOGIC ----------
  async function performCheckIn(appointment: Appointment) {
    setCheckingIn(appointment.id)
    setError(null)

    try {
      const supabase = createClient()

      // Get the next queue number for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: existingCheckIns } = await supabase
        .from('check_ins')
        .select('queue_number')
        .gte('checked_in_at', today.toISOString())
        .order('queue_number', { ascending: false })
        .limit(1)

      const nextQueueNumber = (existingCheckIns?.[0]?.queue_number || 0) + 1

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          appointment_id: appointment.id,
          queue_number: nextQueueNumber,
          status: 'waiting',
          reason: 'Scheduled appointment',
          checked_in_at: new Date().toISOString(),
        })

      if (checkInError) throw new Error(checkInError.message)

      // Update appointment status
      await supabase
        .from('appointments')
        .update({ status: 'checked_in' })
        .eq('id', appointment.id)

      const childName = appointment.child?.full_name || 'Patient'
      const checkInTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      // Show queue ticket
      setTicketModal({
        isOpen: true,
        queueNumber: nextQueueNumber,
        patientName: childName,
        time: checkInTime,
      })

      // Remove from both lists
      setAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
      setAllAppointments((prev) => prev.filter((a) => a.id !== appointment.id))
    } catch (err) {
      console.error('Check-in error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check in patient. Please try again.')
    } finally {
      setCheckingIn(null)
    }
  }

  // ---------- CHECK-IN BY APPOINTMENT ID (used by QR scanner) ----------
  async function checkInByAppointmentId(appointmentId: string) {
    // Try to find in current list
    let appointment = appointments.find((a) => a.id === appointmentId)

    if (!appointment) {
      // Not in list, fetch from DB
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('appointments')
          .select(
            `
            *,
            child:children(id, full_name, date_of_birth),
            caregiver:caregivers(id, profiles(full_name, phone))
          `
          )
          .eq('id', appointmentId)
          .single()

        if (error || !data) throw new Error('Appointment not found')
        appointment = data as Appointment
      } catch (err) {
        setError('Appointment not found. Please try again.')
        return
      }
    }

    // Prevent double check-in
    if (appointment.status === 'checked_in') {
      setError('This patient has already been checked in.')
      return
    }

    await performCheckIn(appointment)
  }

  // ---------- CHECK-IN BY MANUAL CODE (GCH-XXXXX) ----------
  async function handleCheckInByCode(code: string) {
    if (!isValidCheckInCode(code)) return

    setCheckingInByCode(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          child:children(id, full_name, date_of_birth),
          caregiver:caregivers(id, profiles(full_name, phone))
        `
        )
        .eq('check_in_code', code)   // full "GCH-XXXXX"
        .single()

      if (error || !data) throw new Error('Invalid check-in code')

      const appointment = data as Appointment

      if (appointment.status === 'checked_in') {
        setError('This patient has already been checked in.')
        return
      }

      await performCheckIn(appointment)
      setManualCode('') // clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid check-in code')
    } finally {
      setCheckingInByCode(false)
    }
  }

  // ---------- ORIGINAL CHECK-IN (from appointment card) ----------
  async function handleCheckIn(appointment: Appointment) {
    await performCheckIn(appointment)
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function calculateAge(dateOfBirth: string) {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    if (age < 1) {
      const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + monthDiff
      return `${months} months`
    }
    return `${age} years`
  }

  return (
    <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-slate-100 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:-mx-0 lg:px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/receptionist">
              <Button variant="ghost" className="h-11 w-11 rounded-xl">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 lg:text-2xl">Patient Check-In</h1>
              <p className="text-sm text-slate-500">
                {allAppointments.length} appointment{allAppointments.length !== 1 ? 's' : ''} today
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-11 rounded-xl"
            onClick={loadTodayAppointments}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ----- SCAN & MANUAL CHECK-IN CARD ----- */}
      <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50">
        <CardContent className="p-4 lg:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <Button
              onClick={() => setIsScannerOpen(true)}
              className="h-14 flex-1 gap-3 text-base rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
              variant="secondary"
            >
              <span className="text-2xl">📷</span> Scan QR Code
            </Button>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="GCH-A2B3C"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="h-14 flex-1 text-base rounded-xl bg-white font-mono"
                maxLength={9}
              />
              <Button
                onClick={() => handleCheckInByCode(manualCode)}
                disabled={!isValidCheckInCode(manualCode) || checkingInByCode}
                className="h-14 px-6 text-base rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {checkingInByCode ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Go'
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            Scan the QR code from the appointment confirmation or enter the 9‑character code (e.g. GCH-A2B3C)
          </p>
        </CardContent>
      </Card>

      {/* Search section */}
      <Card className="border-none shadow-lg rounded-2xl">
        <CardContent className="p-4 lg:p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by patient, caregiver, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              className="h-14 pl-12 pr-14 text-base rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              )}
              {searchTimeout.current && searchQuery.length >= 2 && (
                <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
          {searchQuery && (
            <div role="status" className="mt-3 text-sm text-slate-500 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              Showing {appointments.length} of {allAppointments.length} appointments
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="py-12 px-6">
            <div className="flex flex-col items-center text-center max-w-xs mx-auto">
              <div className="text-6xl mb-4">
                {searchQuery ? (
                  <Search className="h-16 w-16 text-slate-300" />
                ) : (
                  <CalendarCheck className="h-16 w-16 text-slate-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">
                {searchQuery ? 'No matching patients' : 'All checked in!'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {searchQuery
                  ? 'Try a different name or phone number'
                  : 'No pending appointments for today'}
              </p>
              {searchQuery && (
                <Button
                  variant="secondary"
                  className="rounded-full px-6"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar with status indicator */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-2xl shadow-inner">
                    <Baby className="h-8 w-8 text-blue-600" />
                    {apt.status === 'confirmed' && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 text-base truncate">
                          {apt.child?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={apt.status === 'confirmed' ? 'green' : 'blue'}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                          >
                            {apt.status === 'confirmed' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" /> Pending
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatTime(apt.scheduled_for)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        {apt.caregiver?.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {apt.caregiver?.profiles?.phone || 'No phone'}
                      </p>
                      {apt.child?.date_of_birth && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Cake className="h-3.5 w-3.5" />
                          {calculateAge(apt.child.date_of_birth)} old
                        </p>
                      )}
                    </div>

                    {/* Mobile check-in button */}
                    <div className="mt-4 lg:hidden">
                      <Button
                        className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                        onClick={() => handleCheckIn(apt)}
                        disabled={checkingIn === apt.id}
                      >
                        {checkingIn === apt.id ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Ticket className="mr-2 h-5 w-5" />
                        )}
                        {checkingIn === apt.id ? 'Checking in...' : 'Check In Patient'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop check-in button */}
                <div className="hidden lg:block mt-0 shrink-0">
                  <Button
                    className="h-11"
                    onClick={() => handleCheckIn(apt)}
                    disabled={checkingIn === apt.id}
                  >
                    {checkingIn === apt.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ticket className="mr-2 h-4 w-4" />
                    )}
                    Check In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={checkInByAppointmentId}
      />

      {/* Queue Ticket Modal */}
      <QueueTicketModal
        isOpen={ticketModal.isOpen}
        onClose={() => setTicketModal((prev) => ({ ...prev, isOpen: false }))}
        queueNumber={ticketModal.queueNumber}
        patientName={ticketModal.patientName}
        time={ticketModal.time}
      />
    </div>
  )
}