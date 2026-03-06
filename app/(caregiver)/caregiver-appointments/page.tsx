 'use client'

import { useState, useEffect, useMemo } from 'react'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  X,
  CalendarPlus,
  Calendar,
  User,
  Clock,
  FileText,
  Download,
  ArrowLeft,
  AlertCircle,
  Stethoscope,
  CheckCircle,
  XCircle,
  ClockIcon,
} from 'lucide-react'
import AppointmentPaymentLauncher from '@/components/appointments/AppointmentPaymentLauncher'
import { generateCheckInCode, isValidCheckInCode } from '@/utils/qr' // <-- import generators

// ----- Optional email sending function (if using Resend) -----
// import { sendAppointmentConfirmation } from '@/lib/email'

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

  // ----- QR Modal state now includes checkInCode -----
  const [qrModalData, setQrModalData] = useState<{
    appointmentId: string
    qrCode: string
    childName: string
    checkInCode: string
  } | null>(null)

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
      const appointment = appointments.find((apt) => apt.id === viewQRId)
      if (appointment && (appointment.status === 'pending' || appointment.status === 'confirmed')) {
        handleViewQR(appointment)
        router.replace('/caregiver-appointments', { scroll: false })
      }
    }
  }, [viewQRId, appointments])

  async function loadData() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      .select(
        `
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
      `
      )
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

    const selectedChild = children.find((c) => c.id === childId)

    try {
      const supabase = createClient()

      // ----- GENERATE UNIQUE CHECK-IN CODE -----
      let checkInCode: string | null = null
      let attempts = 0
      while (!checkInCode && attempts < 10) {
        const candidate = generateCheckInCode()
        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('check_in_code', candidate)
          .single()

        if (!existing) {
          checkInCode = candidate
        }
        attempts++
      }

      if (!checkInCode) {
        throw new Error('Unable to generate a unique check-in code. Please try again.')
      }

      // Convert local datetime to UTC for database storage
      const localDate = new Date(scheduledFor)
      const utcDate = localDate.toISOString()

      // ----- INSERT APPOINTMENT WITH CODE -----
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          child_id: childId,
          caregiver_id: caregiverId,
          doctor_id: doctorId || null,
          scheduled_for: utcDate,
          notes: notes || null,
          status: 'pending',
          check_in_code: checkInCode, // <-- stored now
        })
        .select('id, check_in_code')
        .single()

      if (insertError) throw insertError

      setShowBookingForm(false)
      await loadData()

      // Log appointment creation
      try {
        logActivity({
          action: ActivityActions.APPOINTMENT_CREATE,
          action_category: 'appointment',
          target_table: 'appointments',
          target_id: newAppointment?.id,
          description: `Created appointment for child ${childId}`,
          metadata: { check_in_code: checkInCode }
        }).catch(() => {})
      } catch (e) {
        /* swallow */
      }

      // ----- CREATE BOOKING FEE INVOICE (unchanged) -----
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
                tax_percent: 0,
              },
            ],
            notes: `Booking fee for appointment ${newAppointment.id}`,
          }),
        })

        const invoiceData = await invoiceRes.json()

        if (!invoiceRes.ok) {
          console.error('Invoice creation failed', invoiceData)
        } else if (invoiceData?.invoice) {
          try {
            const sup = createClient()
            await sup
              .from('invoices')
              .update({ visit_id: newAppointment.id })
              .eq('id', invoiceData.invoice.id)
          } catch (err) {
            console.error('Failed to link invoice to visit', err)
          }
          setSelectedInvoice(invoiceData.invoice)
        }
      } catch (err) {
        console.error('Failed to create booking invoice', err)
      }

      // ----- FETCH QR CODE (includes checkInCode from response) -----
      const response = await fetch(`/api/qr/${newAppointment.id}`)
      const data = await response.json()
      if (!data.error) {
        setQrModalData({
          appointmentId: newAppointment.id,
          qrCode: data.qrCode,
          childName: selectedChild?.full_name || 'Unknown',
          checkInCode: data.checkInCode, // <-- store the code
        })

        // ----- OPTIONAL: SEND CONFIRMATION EMAIL -----
        // (Uncomment after setting up Resend and creating the email function)
        /*
        const { data: caregiver } = await supabase
          .from('caregivers')
          .select('profiles(email)')
          .eq('id', caregiverId)
          .single()

        if (caregiver?.profiles?.email) {
          await sendAppointmentConfirmation({
            email: caregiver.profiles.email,
            patientName: selectedChild?.full_name || 'Patient',
            appointmentDate: new Date(scheduledFor).toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }),
            checkInCode: data.checkInCode,
            qrCodeUrl: data.qrCode, // data URL works in most email clients
          })
        }
        */
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
        checkInCode: data.checkInCode, // <-- always present
      })

      // Log viewing QR for appointment
      logActivity({
        action: ActivityActions.APPOINTMENT_VIEW,
        action_category: 'appointment',
        target_table: 'appointments',
        target_id: appointment.id,
        description: `Viewed QR for appointment ${appointment.id}`
      }).catch(() => {})
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

      const { data: invoiceByVisit } = await supabase
        .from('invoices')
        .select(`*, line_items:invoice_line_items(*)`)
        .eq('visit_id', appointmentId)
        .maybeSingle()

      if (invoiceByVisit) {
        setSelectedInvoice(invoiceByVisit)
        return
      }

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

      alert('No invoice found for this appointment.')
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
        return {
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FDE68A',
          icon: <ClockIcon style={{ width: 12, height: 12 }} />,
        }
      case 'confirmed':
        return {
          bg: '#EFF6FF',
          text: '#1E40AF',
          border: '#BFDBFE',
          icon: <CheckCircle style={{ width: 12, height: 12 }} />,
        }
      case 'completed':
        return {
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#A7F3D0',
          icon: <CheckCircle style={{ width: 12, height: 12 }} />,
        }
      case 'cancelled':
        return {
          bg: '#F8FAFC',
          text: '#1E293B',
          border: '#E2E8F0',
          icon: <XCircle style={{ width: 12, height: 12 }} />,
        }
      default:
        return {
          bg: '#F8FAFC',
          text: '#1E293B',
          border: '#E2E8F0',
          icon: <ClockIcon style={{ width: 12, height: 12 }} />,
        }
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

    if (isNaN(birthDate.getTime())) return 'N/A'

    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()

    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--
      months += 12
    }

    if (months < 0) months = 0

    if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`
    } else if (years === 1) {
      return months === 0 ? '1 year' : `1 year ${months} months`
    } else {
      return months === 0 ? `${years} years` : `${years} years ${months} months`
    }
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false
      }

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
      <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="clay-inset" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div className="clay-empty-ico" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', margin: '0 auto 16px' }}>
            <User style={{ width: 40, height: 40, color: '#fff' }} />
          </div>
          <h2 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>
            No Children Registered
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
            Please add a child to your profile before booking appointments
          </p>
          <button
            className="clay-cta"
            onClick={() => router.push('/patients')}
            style={{ marginTop: 16 }}
          >
            Add Child
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="clay-hero" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="clay-display" style={{ fontSize: '1.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ width: 28, height: 28, color: '#fff' }} />
            My Appointments
          </h1>
          <p style={{ marginTop: 4, fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
            Manage your children&apos;s medical appointments
          </p>
        </div>
        {!showBookingForm && (
          <button
            className="clay-cta"
            onClick={() => setShowBookingForm(true)}
            style={{ background: '#fff', color: '#6366F1' }}
          >
            <CalendarPlus style={{ width: 16, height: 16, marginRight: 6 }} />
            New Appointment
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {appointments.length > 0 && !showBookingForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div className="clay-stat" style={{ padding: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)' }}>Total</p>
            <p className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>{appointments.length}</p>
            <div className="stat-blob" style={{ background: '#6366F1' }} />
          </div>
          <div className="clay-stat" style={{ padding: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)' }}>Pending</p>
            <p className="clay-display" style={{ fontSize: '1.25rem', color: '#D97706' }}>
              {appointments.filter((a) => a.status === 'pending').length}
            </p>
            <div className="stat-blob" style={{ background: '#F59E0B' }} />
          </div>
          <div className="clay-stat" style={{ padding: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)' }}>Confirmed</p>
            <p className="clay-display" style={{ fontSize: '1.25rem', color: '#2563EB' }}>
              {appointments.filter((a) => a.status === 'confirmed').length}
            </p>
            <div className="stat-blob" style={{ background: '#3B82F6' }} />
          </div>
          <div className="clay-stat" style={{ padding: 12 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)' }}>Completed</p>
            <p className="clay-display" style={{ fontSize: '1.25rem', color: '#059669' }}>
              {appointments.filter((a) => a.status === 'completed').length}
            </p>
            <div className="stat-blob" style={{ background: '#10B981' }} />
          </div>
        </div>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <div className="clay-card-static" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="clay-btn-sec"
              onClick={() => {
                setShowBookingForm(false)
                setError(null)
              }}
              style={{ width: 32, height: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
            <div>
              <h2 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>
                Book New Appointment
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginTop: 4 }}>
                Complete all required fields (*)
              </p>
            </div>
          </div>
          <div style={{ padding: '24px 20px' }}>
            {error && (
              <div style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #FECACA', background: '#FEF2F2', padding: 16, fontSize: '0.875rem', color: '#B91C1C', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div>
                  <label htmlFor="child_id" className="clay-label">
                    Select Child *
                  </label>
                  <select
                    id="child_id"
                    name="child_id"
                    required
                    className="clay-field"
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
                  <label htmlFor="doctor_id" className="clay-label">
                    Select Doctor (Optional)
                  </label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    className="clay-field"
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
                  <label htmlFor="scheduled_for" className="clay-label">
                    Date &amp; Time *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="scheduled_for"
                      name="scheduled_for"
                      type="datetime-local"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="clay-field"
                    />
                    <Calendar style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="clay-label">
                    Reason for Visit / Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Describe the reason for this appointment..."
                    className="clay-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="clay-cta"
                  style={{ flex: 1 }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 8 }} />
                      Booking Appointment...
                    </>
                  ) : (
                    <>
                      <CalendarPlus style={{ width: 16, height: 16, marginRight: 6 }} />
                      Book Appointment
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false)
                    setError(null)
                  }}
                  className="clay-btn-sec"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      {appointments.length > 0 && !showBookingForm && (
        <div className="clay-filter">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search by child name, doctor, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-search"
                style={{ paddingLeft: 40, paddingRight: 40 }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | AppointmentStatus)
              }
              className="clay-field"
              style={{ minWidth: 160 }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
              Showing {filteredAppointments.length} of {appointments.length} appointments
              {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
              {statusFilter !== 'all' && <span> with status &quot;{statusFilter}&quot;</span>}
            </p>
          )}
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 && !showBookingForm ? (
        <div className="clay-inset" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div className="clay-empty-ico" style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)', margin: '0 auto 16px' }}>
            <Calendar style={{ width: 40, height: 40, color: '#fff' }} />
          </div>
          <h2 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>
            No Appointments Yet
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
            Book your first appointment to get started
          </p>
          <button
            className="clay-cta"
            onClick={() => setShowBookingForm(true)}
            style={{ marginTop: 16 }}
          >
            <CalendarPlus style={{ width: 16, height: 16, marginRight: 6 }} />
            Book First Appointment
          </button>
        </div>
      ) : filteredAppointments.length === 0 && !showBookingForm ? (
        <div className="clay-inset" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div className="clay-empty-ico" style={{ background: 'linear-gradient(135deg, #94A3B8, #CBD5E1)', margin: '0 auto 16px' }}>
            <Search style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <h2 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)' }}>
            No Matching Appointments
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
            Try adjusting your search or filter criteria
          </p>
          <button
            className="clay-btn-sec"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
            style={{ marginTop: 16 }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        !showBookingForm && (
          <div style={{ display: 'grid', gap: 16 }}>
            {filteredAppointments.map((appointment) => {
              const statusColors = getStatusColor(appointment.status)
              return (
                <div
                  key={appointment.id}
                  className="clay-card-static"
                  style={{ padding: '16px 20px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      {/* Child Info */}
                      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <h3 className="clay-display" style={{ fontSize: '1.1rem', color: 'var(--clay-text-dark)' }}>
                            {appointment.child?.full_name || 'Unknown Child'}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--clay-text-muted)', marginTop: 4 }}>
                            Age: {formatAge(appointment.child?.date_of_birth || '')}
                          </p>
                        </div>
                        <span
                          className="clay-badge"
                          style={{
                            background: statusColors.bg,
                            color: statusColors.text,
                            border: `1px solid ${statusColors.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                          }}
                        >
                          {statusColors.icon}
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </div>

                      {/* Appointment Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem', color: 'var(--clay-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock style={{ width: 16, height: 16, color: '#9CA3AF' }} />
                          <span style={{ fontWeight: 500, color: 'var(--clay-text-dark)' }}>
                            {formatDate(appointment.scheduled_for)}
                          </span>
                        </div>

                        {appointment.doctor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Stethoscope style={{ width: 16, height: 16, color: '#9CA3AF' }} />
                            <span style={{ color: 'var(--clay-text-dark)' }}>
                              Dr. {appointment.doctor.profiles?.full_name}
                            </span>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="clay-inset" style={{ marginTop: 12, padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <FileText style={{ width: 12, height: 12, color: 'var(--clay-text-muted)' }} />
                              <p className="clay-label" style={{ margin: 0 }}>Notes:</p>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-dark)' }}>
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                      {(appointment.status === 'pending' ||
                        appointment.status === 'confirmed') && (
                        <button
                          className="clay-cta"
                          onClick={() => handleViewQR(appointment)}
                          disabled={loadingQr === appointment.id}
                          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                        >
                          {loadingQr === appointment.id ? 'Loading...' : 'View QR'}
                        </button>
                      )}

                      {(appointment.status === 'pending' ||
                        appointment.status === 'confirmed') && (
                        <button
                          className="clay-cta-emerald"
                          onClick={() => handlePayAtAppointment(appointment.id)}
                          disabled={loadingPayInvoice === appointment.id}
                          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                        >
                          {loadingPayInvoice === appointment.id
                            ? '...'
                            : 'Make Payment'}
                        </button>
                      )}

                      {appointment.status === 'pending' && (
                        <button
                          className="clay-cta-rose"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                        >
                          {cancellingId === appointment.id
                            ? 'Cancelling...'
                            : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ----- QR CODE MODAL (NOW WITH SHORT CODE) ----- */}
      {qrModalData && (
        <div
          className="clay-modal"
          onClick={() => setQrModalData(null)}
        >
          <div
            className="clay-card-static"
            style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', borderRadius: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px' }}>
              <div style={{ textAlign: 'center' }}>
                {/* Drag handle for mobile */}
                <div style={{ margin: '0 auto 16px', height: 6, width: 48, borderRadius: 999, background: '#CBD5E1', display: 'block' }} />

                <h3 className="clay-display" style={{ fontSize: '1.25rem', color: 'var(--clay-text-dark)', marginBottom: 4 }}>
                  Appointment QR Code
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--clay-text-muted)', marginBottom: 16 }}>
                  Show this QR code at the hospital for check-in
                </p>

                {/* Child Name */}
                <div className="clay-inset" style={{ marginBottom: 16, padding: 12 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--clay-text-dark)' }}>
                    Patient:{' '}
                    <span style={{ color: 'var(--clay-accent)', fontWeight: 600 }}>
                      {qrModalData.childName}
                    </span>
                  </p>
                </div>

                {/* QR Code Image */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div className="clay-card-static" style={{ padding: 16 }}>
                    <img
                      src={qrModalData.qrCode}
                      alt="Appointment QR Code"
                      style={{ width: 208, height: 208 }}
                    />
                  </div>
                </div>

                {/* ----- SHORT CHECK-IN CODE CARD ----- */}
                <div className="clay-inset" style={{ marginBottom: 20, padding: 16 }}>
                  <p className="clay-label" style={{ marginBottom: 4 }}>
                    Short check‑in code
                  </p>
                  <p className="clay-display" style={{ fontSize: '1.875rem', fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--clay-text-dark)' }}>
                    {qrModalData.checkInCode}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--clay-text-muted)', marginTop: 8 }}>
                    Can&apos;t scan? Enter this code at the reception kiosk.
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="clay-cta"
                    onClick={downloadQR}
                    style={{ flex: 1, padding: '12px 16px' }}
                  >
                    <Download style={{ width: 16, height: 16, marginRight: 6 }} />
                    Download QR
                  </button>
                  <button
                    className="clay-btn-sec"
                    onClick={() => setQrModalData(null)}
                    style={{ flex: 1, padding: '12px 16px' }}
                  >
                    Close
                  </button>
                </div>

                <p style={{ marginTop: 16, fontSize: '0.75rem', color: '#9CA3AF' }}>
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
          <div
            className="clay-modal"
            style={{ zIndex: 90, background: 'rgba(0,0,0,0.4)', backdropFilter: 'none' }}
            onClick={() => setSelectedInvoice(null)}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
            <div style={{ width: '100%', maxWidth: 672, pointerEvents: 'auto' }}>
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