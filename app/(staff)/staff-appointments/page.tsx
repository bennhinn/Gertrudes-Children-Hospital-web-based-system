'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface AppointmentWithDetails {
  id: string
  scheduled_for: string
  status: string
  notes: string | null
  qr_code: string | null
  child: {
    id: string
    full_name: string
    dob: string
    gender: string
    medical_notes: string | null
  }
  caregiver: {
    id: string
    profiles: {
      full_name: string
      phone: string
    }
  }
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [showCheckInForm, setShowCheckInForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; appointment?: AppointmentWithDetails } | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    reason: '',
    temperature: '',
    weight: '',
    height: '',
    blood_pressure: '',
    symptoms: '',
    allergies: '',
    current_medications: '',
  })

  useEffect(() => {
    loadAppointments()
  }, [])

  // Initialize QR Scanner when modal opens
  useEffect(() => {
    if (showQrScanner) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        )
        scannerRef.current.render(onScanSuccess, onScanFailure)
      }, 100)

      return () => {
        clearTimeout(timer)
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error)
        }
      }
    }
  }, [showQrScanner])

  async function onScanSuccess(decodedText: string) {
    try {
      const payload = JSON.parse(decodedText)

      if (payload.type !== 'appointment_checkin' || !payload.id) {
        setScanResult({ success: false, message: 'Invalid QR code format' })
        return
      }

      // Find the appointment
      const supabase = createClient()
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          child:children(
            id,
            full_name,
            dob,
            gender,
            medical_notes
          ),
          caregiver:caregivers(
            id,
            profiles(full_name, phone)
          )
        `)
        .eq('id', payload.id)
        .single()

      if (error || !appointment) {
        setScanResult({ success: false, message: 'Appointment not found' })
        return
      }

      // Stop scanner
      if (scannerRef.current) {
        await scannerRef.current.clear()
      }

      setScanResult({
        success: true,
        message: 'Appointment found!',
        appointment: appointment as any
      })
    } catch (err) {
      setScanResult({ success: false, message: 'Invalid QR code' })
    }
  }

  function onScanFailure(error: string) {
    // Ignore scan failures (happens continuously while scanning)
  }

  function handleScanAndCheckIn() {
    if (scanResult?.appointment) {
      setShowQrScanner(false)
      setScanResult(null)
      handleCheckIn(scanResult.appointment)
    }
  }

  function closeScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
    }
    setShowQrScanner(false)
    setScanResult(null)
  }

  async function loadAppointments() {
    setLoading(true)
    try {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          child:children(
            id,
            full_name,
            dob,
            gender,
            medical_notes
          ),
          caregiver:caregivers(
            id,
            profiles(full_name, phone)
          )
        `)
        .gte('scheduled_for', today.toISOString())
        .order('scheduled_for', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(appointment: AppointmentWithDetails) {
    setSelectedAppointment(appointment)
    setShowCheckInForm(true)
    setCheckInData({
      reason: appointment.notes || '',
      temperature: '',
      weight: '',
      height: '',
      blood_pressure: '',
      symptoms: '',
      allergies: '',
      current_medications: '',
    })
  }

  async function submitCheckIn() {
    if (!selectedAppointment) return

    setCheckingIn(selectedAppointment.id)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      // Create visit record
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          child_id: selectedAppointment.child.id,
          check_in: now,
          reason: checkInData.reason,
        })
        .select()
        .single()

      if (visitError) throw visitError

      // Update appointment status
      const { error: aptError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          notes: checkInData.reason
        })
        .eq('id', selectedAppointment.id)

      if (aptError) throw aptError

      // Update child's medical notes with vitals
      const vitalsNote = `
Check-in ${new Date().toLocaleDateString()}:
- Temperature: ${checkInData.temperature || 'N/A'}
- Weight: ${checkInData.weight || 'N/A'}
- Height: ${checkInData.height || 'N/A'}
- BP: ${checkInData.blood_pressure || 'N/A'}
- Symptoms: ${checkInData.symptoms || 'None reported'}
- Allergies: ${checkInData.allergies || 'None reported'}
- Current Medications: ${checkInData.current_medications || 'None'}
      `.trim()

      const existingNotes = selectedAppointment.child.medical_notes || ''
      const updatedNotes = existingNotes + '\n\n' + vitalsNote

      await supabase
        .from('children')
        .update({ medical_notes: updatedNotes })
        .eq('id', selectedAppointment.child.id)

      setShowCheckInForm(false)
      setSelectedAppointment(null)
      loadAppointments()
    } catch (err) {
      console.error('Check-in error:', err)
      alert('Failed to check in. Please try again.')
    } finally {
      setCheckingIn(null)
    }
  }

  function getStatusBadge(status: string) {
    const variants = {
      pending: 'blue' as const,
      confirmed: 'pink' as const,
      completed: 'green' as const,
      cancelled: 'gray' as const,
    }
    return variants[status as keyof typeof variants] || 'gray' as const
  }

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="text-center">Loading appointments...</div>
      </main>
    )
  }

  if (showCheckInForm && selectedAppointment) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Patient Check-In</h1>
            <p className="mt-1 text-slate-600">Recording arrival and vitals</p>
          </div>
          <Button variant="secondary" onClick={() => setShowCheckInForm(false)}>
            ← Back to Appointments
          </Button>
        </div>

        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Check-In: {selectedAppointment.child.full_name}</CardTitle>
            <p className="text-sm text-slate-600">
              Scheduled: {new Date(selectedAppointment.scheduled_for).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Patient Info Summary */}
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="grid gap-2 text-sm">
                  <div><strong>Child:</strong> {selectedAppointment.child.full_name}</div>
                  <div><strong>DOB:</strong> {new Date(selectedAppointment.child.dob).toLocaleDateString()}</div>
                  <div><strong>Gender:</strong> {selectedAppointment.child.gender}</div>
                  <div><strong>Caregiver:</strong> {selectedAppointment.caregiver.profiles?.full_name}</div>
                  <div><strong>Phone:</strong> {selectedAppointment.caregiver.profiles?.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Reason for Visit *
                </label>
                <textarea
                  value={checkInData.reason}
                  onChange={(e) => setCheckInData({ ...checkInData, reason: e.target.value })}
                  rows={2}
                  required
                  placeholder="Primary reason for today's visit..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Vitals */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Temperature (°C)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={checkInData.temperature}
                    onChange={(e) => setCheckInData({ ...checkInData, temperature: e.target.value })}
                    placeholder="36.5"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={checkInData.weight}
                    onChange={(e) => setCheckInData({ ...checkInData, weight: e.target.value })}
                    placeholder="15.5"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Height (cm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={checkInData.height}
                    onChange={(e) => setCheckInData({ ...checkInData, height: e.target.value })}
                    placeholder="105"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Blood Pressure
                  </label>
                  <Input
                    type="text"
                    value={checkInData.blood_pressure}
                    onChange={(e) => setCheckInData({ ...checkInData, blood_pressure: e.target.value })}
                    placeholder="120/80"
                  />
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Current Symptoms
                </label>
                <textarea
                  value={checkInData.symptoms}
                  onChange={(e) => setCheckInData({ ...checkInData, symptoms: e.target.value })}
                  rows={2}
                  placeholder="Describe any symptoms..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Known Allergies
                </label>
                <Input
                  type="text"
                  value={checkInData.allergies}
                  onChange={(e) => setCheckInData({ ...checkInData, allergies: e.target.value })}
                  placeholder="Penicillin, peanuts, etc."
                />
              </div>

              {/* Current Medications */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Current Medications
                </label>
                <Input
                  type="text"
                  value={checkInData.current_medications}
                  onChange={(e) => setCheckInData({ ...checkInData, current_medications: e.target.value })}
                  placeholder="List any medications currently taking..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={submitCheckIn}
                  disabled={checkingIn !== null || !checkInData.reason}
                  className="flex-1"
                >
                  {checkingIn ? 'Checking In...' : 'Complete Check-In'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCheckInForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Today's Appointments</h1>
          <p className="mt-1 text-slate-600">Patient check-in and management</p>
        </div>
        <Button
          onClick={() => setShowQrScanner(true)}
          className="bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg"
        >
          📷 Scan QR Code
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No appointments scheduled for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
                    {apt.child.full_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{apt.child.full_name}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(apt.scheduled_for).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      Caregiver: {apt.caregiver.profiles?.full_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadge(apt.status)}>{apt.status}</Badge>
                  {apt.status === 'pending' && (
                    <Button onClick={() => handleCheckIn(apt)} size="sm">
                      Check In
                    </Button>
                  )}
                  {apt.status === 'confirmed' && (
                    <span className="text-sm text-green-600">✓ Checked In</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl mx-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Scan Appointment QR</h3>
              <p className="text-sm text-slate-600">
                Point the camera at the patient's QR code
              </p>
            </div>

            {/* Scanner Container */}
            {!scanResult && (
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className={`rounded-lg p-4 ${scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {scanResult.message}
                </p>

                {scanResult.success && scanResult.appointment && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-lg">
                        {scanResult.appointment.child.full_name}
                      </h4>
                      <div className="mt-2 text-sm text-slate-600 space-y-1">
                        <p><strong>Scheduled:</strong> {new Date(scanResult.appointment.scheduled_for).toLocaleString()}</p>
                        <p><strong>Status:</strong> <Badge variant={getStatusBadge(scanResult.appointment.status)}>{scanResult.appointment.status}</Badge></p>
                        <p><strong>Caregiver:</strong> {scanResult.appointment.caregiver.profiles?.full_name || 'N/A'}</p>
                        {scanResult.appointment.notes && (
                          <p><strong>Notes:</strong> {scanResult.appointment.notes}</p>
                        )}
                      </div>
                    </div>

                    {scanResult.appointment.status === 'pending' && (
                      <Button
                        onClick={handleScanAndCheckIn}
                        className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white"
                      >
                        ✓ Proceed to Check-In
                      </Button>
                    )}

                    {scanResult.appointment.status === 'confirmed' && (
                      <p className="text-center text-green-700 font-medium">
                        ✓ This patient is already checked in
                      </p>
                    )}

                    {scanResult.appointment.status === 'completed' && (
                      <p className="text-center text-slate-600 font-medium">
                        This appointment has been completed
                      </p>
                    )}

                    {scanResult.appointment.status === 'cancelled' && (
                      <p className="text-center text-red-600 font-medium">
                        ⚠️ This appointment was cancelled
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              {scanResult && (
                <Button
                  onClick={() => setScanResult(null)}
                  className="flex-1 bg-blue-600 text-white"
                >
                  Scan Another
                </Button>
              )}
              <Button
                onClick={closeScanner}
                className={`${scanResult ? 'flex-1' : 'w-full'} bg-slate-200 text-slate-700 hover:bg-slate-300`}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
