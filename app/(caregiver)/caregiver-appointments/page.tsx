'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  if (children.length === 0) {
    return (
      <main className="space-y-6">
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6 sm:p-8 text-center shadow-lg">
          <div className="mx-auto mb-3 sm:mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white shadow-md text-3xl sm:text-4xl">
            👶
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">No Children Registered</h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">Please add a child to your profile before booking appointments</p>
          <Button className="mt-4 sm:mt-6" onClick={() => router.push('/patients')}>
            Add Child
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Appointments</h1>
          <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-slate-600">Manage your children's medical appointments</p>
        </div>
        {!showBookingForm && (
          <Button
            onClick={() => setShowBookingForm(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
          >
            + New Appointment
          </Button>
        )}
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-lg sm:text-xl">Book New Appointment</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="child_id" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Select Child *
                </label>
                <select
                  id="child_id"
                  name="child_id"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
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
                <label htmlFor="doctor_id" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Select Doctor (Optional)
                </label>
                <select
                  id="doctor_id"
                  name="doctor_id"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
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
                <label htmlFor="scheduled_for" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Date & Time *
                </label>
                <input
                  id="scheduled_for"
                  name="scheduled_for"
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="notes" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Reason for Visit / Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Describe the reason for this appointment..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Booking...' : 'Book Appointment'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false)
                    setError(null)
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-10 sm:py-12 text-center">
            <div className="mx-auto mb-3 sm:mb-4 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-100 text-2xl sm:text-3xl">
              📅
            </div>
            <p className="text-base sm:text-lg font-medium text-slate-700">No appointments yet</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Book your first appointment to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="border-none shadow-md sm:shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Child Info */}
                    <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2 sm:block">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                        {appointment.child?.full_name || 'Unknown Child'}
                      </h3>
                      <Badge className={`shrink-0 sm:hidden ${getStatusColor(appointment.status)}`}>
                        {appointment.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mb-2 sm:mb-0">
                      Age: {formatAge(appointment.child?.date_of_birth || '')}
                    </p>

                    {/* Appointment Details */}
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mt-2 sm:mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">📅</span>
                        <span className="font-medium text-slate-700">
                          {formatDate(appointment.scheduled_for)}
                        </span>
                      </div>

                      {appointment.doctor && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">👨‍⚕️</span>
                          <span className="text-slate-700">
                            Dr. {appointment.doctor.profiles?.full_name}
                          </span>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5 sm:p-3">
                          <p className="text-[10px] sm:text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Notes:</p>
                          <p className="text-xs sm:text-sm text-slate-700 line-clamp-2">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between gap-2 border-t pt-3 sm:border-0 sm:pt-0 sm:ml-4 sm:flex-col sm:items-end sm:gap-3">
                    <Badge className={`hidden sm:inline-flex ${getStatusColor(appointment.status)}`}>
                      {appointment.status.toUpperCase()}
                    </Badge>

                    <div className="flex gap-2">
                      {/* QR Code Button - show for pending and confirmed */}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <Button
                          size="sm"
                          onClick={() => handleViewQR(appointment)}
                          disabled={loadingQr === appointment.id}
                          className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        >
                          {loadingQr === appointment.id ? '...' : '📱 QR'}
                        </Button>
                      )}

                      {appointment.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                        >
                          {cancellingId === appointment.id ? '...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in duration-300">
            <div className="text-center">
              {/* Drag handle for mobile */}
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300 sm:hidden" />

              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Appointment QR Code</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                Show this QR code at the hospital for check-in
              </p>

              {/* Child Name */}
              <div className="mb-3 sm:mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm font-medium text-slate-700">
                  Patient: <span className="text-blue-700">{qrModalData.childName}</span>
                </p>
              </div>

              {/* QR Code Image */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="rounded-xl bg-white p-3 sm:p-4 shadow-lg border-2 border-slate-100">
                  <img
                    src={qrModalData.qrCode}
                    alt="Appointment QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={downloadQR}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                >
                  ⬇️ Download
                </Button>
                <Button
                  onClick={() => setQrModalData(null)}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Close
                </Button>
              </div>

              <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-500">
                Tip: Save this image to your phone for easy access
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}