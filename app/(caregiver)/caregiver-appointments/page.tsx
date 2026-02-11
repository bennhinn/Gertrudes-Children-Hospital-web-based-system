'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, CalendarPlus, Calendar, User, Clock, FileText, Download, ArrowLeft, AlertCircle, Stethoscope, CheckCircle, XCircle, ClockIcon } from 'lucide-react'
import AppointmentPaymentLauncher from '@/components/appointments/AppointmentPaymentLauncher'

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface Appointment {
  id: string
  scheduled_for: string
  status: AppointmentStatus
  notes: string | null
  child: {
    full_name: string
    date_of_birth: string
  } | null
  doctor: {
    profiles: {
      full_name: string
    } | null
  } | null
}

export default function AppointmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewQRId = searchParams.get('viewQR')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [children, setChildren] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [caregiverId, setCaregiverId] = useState<string | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [qrModalData, setQrModalData] = useState<{ appointmentId: string; qrCode: string; childName: string } | null>(null)
  const [loadingQr, setLoadingQr] = useState<string | null>(null)
  const BOOKING_FEE = 500 // KES
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [loadingPayInvoice, setLoadingPayInvoice] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all')

  useEffect(() => {
    loadData()
  }, [])

  // Auto-open QR modal when navigating from dashboard
  useEffect(() => {
    if (viewQRId && appointments.length > 0) {
      const appointment = appointments.find(apt => apt.id === viewQRId)
      if (appointment && (appointment.status === 'pending' || appointment.status === 'confirmed')) {
        handleViewQR(appointment)
        // Clear the URL parameter after opening
        router.replace('/caregiver-appointments', { scroll: false })
      }
    }
  }, [viewQRId, appointments])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setCaregiverId(user.id)

    // Load children
    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('caregiver_id', user.id)

    setChildren(childrenData || [])

    // Load appointments
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_for,
        status,
        notes,
        child:children (
          full_name,
          date_of_birth
        ),
        doctor:doctors (
          profiles (
            full_name
          )
        )
      `)
      .eq('caregiver_id', user.id)
      .order('scheduled_for', { ascending: false })

    setAppointments((appointmentsData as any) || [])

    // Load doctors
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('id, profiles(full_name)')

    setDoctors(doctorsData || [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const childId = formData.get('child_id') as string
    const doctorId = formData.get('doctor_id') as string
    const scheduledFor = formData.get('scheduled_for') as string
    const notes = formData.get('notes') as string

    // Get child name for QR modal
    const selectedChild = children.find(c => c.id === childId)

    try {
      const supabase = createClient()

      // Convert local datetime to UTC for database storage
      const localDate = new Date(scheduledFor)
      const utcDate = localDate.toISOString()

      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          child_id: childId,
          caregiver_id: caregiverId,
          doctor_id: doctorId || null,
          scheduled_for: utcDate,
          notes: notes || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      setShowBookingForm(false)
      await loadData()

      // Create booking fee invoice (Option A)
      try {
        const invoiceRes = await fetch('/api/invoices/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            child_id: childId,
            caregiver_id: caregiverId,
            items: [
              {
                item_type: 'registration',
                description: 'Booking fee',
                quantity: 1,
                unit_price: BOOKING_FEE,
                tax_percent: 0
              }
            ],
            notes: `Booking fee for appointment ${newAppointment.id}`
          })
        })

        const invoiceData = await invoiceRes.json()

        if (!invoiceRes.ok) {
          console.error('Invoice creation failed', invoiceData)
        } else if (invoiceData?.invoice) {
          // Link invoice to visit_id (appointment) if API didn't set it
          try {
            const sup = createClient()
            await sup.from('invoices').update({ visit_id: newAppointment.id }).eq('id', invoiceData.invoice.id)
          } catch (err) {
            console.error('Failed to link invoice to visit', err)
          }

          // Open payment modal for booking fee
          setSelectedInvoice(invoiceData.invoice)
        }
      } catch (err) {
        console.error('Failed to create booking invoice', err)
      }

      // Automatically show QR code after booking
      if (newAppointment) {
        const response = await fetch(`/api/qr/${newAppointment.id}`)
        const data = await response.json()
        if (!data.error) {
          setQrModalData({
            appointmentId: newAppointment.id,
            qrCode: data.qrCode,
            childName: selectedChild?.full_name || 'Unknown',
          })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    setCancellingId(appointmentId)
    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (updateError) throw updateError

      await loadData()
    } catch (err: any) {
      alert('Failed to cancel appointment: ' + err.message)
    } finally {
      setCancellingId(null)
    }
  }

  async function handleViewQR(appointment: Appointment) {
    setLoadingQr(appointment.id)
    try {
      const response = await fetch(`/api/qr/${appointment.id}`)
      const data = await response.json()

      if (data.error) {
        alert('Failed to load QR code: ' + data.error)
        return
      }

      setQrModalData({
        appointmentId: appointment.id,
        qrCode: data.qrCode,
        childName: appointment.child?.full_name || 'Unknown',
      })
    } catch (err: any) {
      alert('Failed to load QR code')
    } finally {
      setLoadingQr(null)
    }
  }

  async function handlePayAtAppointment(appointmentId: string) {
    setLoadingPayInvoice(appointmentId)
    try {
      const supabase = createClient()

      // First try to find invoice by visit_id
      const { data: invoiceByVisit } = await supabase
        .from('invoices')
        .select(`*, line_items:invoice_line_items(*)`)
        .eq('visit_id', appointmentId)
        .maybeSingle()

      if (invoiceByVisit) {
        setSelectedInvoice(invoiceByVisit)
        return
      }

      // If not found, try to find consultation for appointment and use consultation_id
      const { data: consultation } = await supabase
        .from('consultations')
        .select('id')
        .eq('appointment_id', appointmentId)
        .maybeSingle()

      if (consultation?.id) {
        const { data: invoiceByConsult } = await supabase
          .from('invoices')
          .select(`*, line_items:invoice_line_items(*)`)
          .eq('consultation_id', consultation.id)
          .maybeSingle()

        if (invoiceByConsult) {
          setSelectedInvoice(invoiceByConsult)
          return
        }
      }

      alert('No invoice found for this appointment. A clinician or receptionist must create one before payment.')
    } catch (err: any) {
      console.error('Failed to load invoice:', err)
      alert('Failed to fetch invoice for payment')
    } finally {
      setLoadingPayInvoice(null)
    }
  }

  function downloadQR() {
    if (!qrModalData) return

    const link = document.createElement('a')
    link.download = `appointment-${qrModalData.appointmentId.slice(0, 8)}-qr.png`
    link.href = qrModalData.qrCode
    link.click()
  }

  function getStatusColor(status: AppointmentStatus) {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <ClockIcon className="h-3 w-3" /> }
      case 'confirmed':
        return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: <CheckCircle className="h-3 w-3" /> }
      case 'completed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle className="h-3 w-3" /> }
      case 'cancelled':
        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', icon: <XCircle className="h-3 w-3" /> }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', icon: <ClockIcon className="h-3 w-3" /> }
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  function formatAge(dateOfBirth: string) {
    if (!dateOfBirth) return 'N/A'

    const today = new Date()
    const birthDate = new Date(dateOfBirth)

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) return 'N/A'

    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()

    // Adjust for cases where birthday hasn't occurred this year
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--
      months += 12
    }

    // Ensure months is not negative
    if (months < 0) months = 0

    // Format based on age
    if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`
    } else if (years === 1) {
      return months === 0 ? '1 year' : `1 year ${months} months`
    } else {
      return months === 0 ? `${years} years` : `${years} years ${months} months`
    }
  }

  // Filter appointments based on search query and status filter
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const childName = apt.child?.full_name?.toLowerCase() || ''
        const doctorName = apt.doctor?.profiles?.full_name?.toLowerCase() || ''
        const notes = apt.notes?.toLowerCase() || ''
        const status = apt.status.toLowerCase()

        return (
          childName.includes(query) ||
          doctorName.includes(query) ||
          notes.includes(query) ||
          status.includes(query)
        )
      }

      return true
    })
  }, [appointments, searchQuery, statusFilter])

  if (children.length === 0) {
    return (
      <main className="space-y-6">
        <Card className="border border-slate-200 shadow-lg bg-white">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-blue-50">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">No Children Registered</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">Please add a child to your profile before booking appointments</p>
            <Button
              onClick={() => router.push('/patients')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
            >
              Add Child
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-600" />
            My Appointments
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">Manage your children's medical appointments</p>
        </div>
        {!showBookingForm && (
          <Button
            onClick={() => setShowBookingForm(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
          >
            <CalendarPlus className="h-4 w-4 mr-1.5" />
            New Appointment
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      {appointments.length > 0 && !showBookingForm && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-800">{appointments.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-lg font-bold text-amber-600">
                {appointments.filter(a => a.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Confirmed</p>
              <p className="text-lg font-bold text-blue-600">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-lg font-bold text-emerald-600">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <Card className="border border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-200 bg-white pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBookingForm(false)
                  setError(null)
                }}
                className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800">
                  Book New Appointment
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Complete all required fields (*)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="child_id" className="mb-2 block text-sm font-medium text-slate-700">
                    Select Child *
                  </label>
                  <select
                    id="child_id"
                    name="child_id"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors appearance-none"
                  >
                    <option value="">Choose a child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name} ({formatAge(child.date_of_birth)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="doctor_id" className="mb-2 block text-sm font-medium text-slate-700">
                    Select Doctor (Optional)
                  </label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors appearance-none"
                  >
                    <option value="">Any available doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.profiles?.full_name || 'Unknown Doctor'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="scheduled_for" className="mb-2 block text-sm font-medium text-slate-700">
                    Date & Time *
                  </label>
                  <div className="relative">
                    <input
                      id="scheduled_for"
                      name="scheduled_for"
                      type="datetime-local"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
                    Reason for Visit / Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Describe the reason for this appointment..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Booking Appointment...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-4 w-4 mr-1.5" />
                      Book Appointment
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false)
                    setError(null)
                  }}
                  variant="secondary"
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      {appointments.length > 0 && !showBookingForm && (
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by child name, doctor, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | AppointmentStatus)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Results count */}
            {(searchQuery || statusFilter !== 'all') && (
              <p className="mt-3 text-sm text-slate-500">
                Showing {filteredAppointments.length} of {appointments.length} appointments
                {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
                {statusFilter !== 'all' && <span> with status &quot;{statusFilter}&quot;</span>}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {appointments.length === 0 && !showBookingForm ? (
        <Card className="border border-slate-200 shadow-lg bg-white">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-blue-50">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">No Appointments Yet</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">Book your first appointment to get started</p>
            <Button
              onClick={() => setShowBookingForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
            >
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Book First Appointment
            </Button>
          </CardContent>
        </Card>
      ) : filteredAppointments.length === 0 && !showBookingForm ? (
        <Card className="border border-slate-200 shadow-lg bg-white">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">No Matching Appointments</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">Try adjusting your search or filter criteria</p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="mt-4 bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : !showBookingForm && (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const statusColors = getStatusColor(appointment.status)
            return (
              <Card
                key={appointment.id}
                className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      {/* Child Info */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-800">
                            {appointment.child?.full_name || 'Unknown Child'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Age: {formatAge(appointment.child?.date_of_birth || '')}
                          </p>
                        </div>
                        <Badge className={`shrink-0 ${statusColors.bg} ${statusColors.text} ${statusColors.border} flex items-center gap-1`}>
                          {statusColors.icon}
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Appointment Details */}
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {formatDate(appointment.scheduled_for)}
                          </span>
                        </div>

                        {appointment.doctor && (
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700">
                              Dr. {appointment.doctor.profiles?.full_name}
                            </span>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3 w-3 text-slate-600" />
                              <p className="text-xs font-medium text-slate-700">Notes:</p>
                            </div>
                            <p className="text-sm text-slate-700">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 sm:border-0 sm:pt-0 sm:ml-4 sm:flex-col">
                      {/* QR Code Button - show for pending and confirmed */}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <Button
                          size="sm"
                          onClick={() => handleViewQR(appointment)}
                          disabled={loadingQr === appointment.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loadingQr === appointment.id ? 'Loading...' : 'View QR'}
                        </Button>
                      )}

                      {/* Pay at appointment - show if unpaid invoice likely exists */}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <Button
                          size="sm"
                          onClick={() => handlePayAtAppointment(appointment.id)}
                          disabled={loadingPayInvoice === appointment.id}
                          variant="secondary"
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          {loadingPayInvoice === appointment.id ? '...' : 'Make Payment'}
                        </Button>
                      )}

                      {appointment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQrModalData(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6">
              <div className="text-center">
                {/* Drag handle for mobile */}
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />

                <h3 className="text-xl font-bold text-slate-900 mb-1">Appointment QR Code</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Show this QR code at the hospital for check-in
                </p>

                {/* Child Name */}
                <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Patient: <span className="text-blue-600 font-semibold">{qrModalData.childName}</span>
                  </p>
                </div>

                {/* QR Code Image */}
                <div className="flex justify-center mb-5">
                  <div className="rounded-2xl bg-white p-4 shadow-lg border border-slate-200">
                    <img
                      src={qrModalData.qrCode}
                      alt="Appointment QR Code"
                      className="w-52 h-52 sm:w-56 sm:h-56"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={downloadQR}
                    className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download QR
                  </Button>
                  <Button
                    onClick={() => setQrModalData(null)}
                    variant="secondary"
                    className="flex-1 py-3 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Close
                  </Button>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Tip: Save this image to your phone for easy access
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Appointment Payment Launcher (modal) */}
      {selectedInvoice && (
        <div>
          <div className="fixed inset-0 z-[90] bg-black/40" onClick={() => setSelectedInvoice(null)} />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <AppointmentPaymentLauncher
                invoice={selectedInvoice}
                autoOpen={true}
                onPaid={async () => {
                  setSelectedInvoice(null)
                  await loadData()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}