'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Patient {
    type: 'child'
    child: {
        id: string
        full_name: string
        dob: string
        gender: string
    }
    caregiver: {
        id: string
        profiles: {
            full_name: string
            phone: string
        }
    }
}

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    notes: string | null
    child: {
        id: string
        full_name: string
        dob: string
        gender: string
    }
    caregiver: {
        id: string
        profiles: {
            full_name: string
            phone: string
        }
    }
}

interface CheckInResult {
    success: boolean
    queueNumber: number
    patientName: string
}

export default function CheckInPage() {
    const [mode, setMode] = useState<'qr' | 'search'>('qr')
    const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Patient[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
    const [scannerActive, setScannerActive] = useState(false)
    const [cameraError, setCameraError] = useState(false)
    const [manualCode, setManualCode] = useState('')
    const [scannerLoading, setScannerLoading] = useState(false)
    const scannerRef = useRef<HTMLDivElement>(null)
    const html5QrCodeRef = useRef<any>(null)
    const barcodeInputRef = useRef<HTMLInputElement>(null)

    // Vitals form
    const [vitals, setVitals] = useState({
        temperature: '',
        weight: '',
        height: '',
        blood_pressure: '',
    })
    const [reason, setReason] = useState('')

    // Load today's appointments
    const loadAppointments = useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          child:children(id, full_name, dob, gender),
          caregiver:caregivers(id, profiles(full_name, phone))
        `)
                .gte('scheduled_for', today.toISOString())
                .lt('scheduled_for', tomorrow.toISOString())
                .in('status', ['pending', 'confirmed'])
                .order('scheduled_for', { ascending: true })

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadAppointments()
    }, [loadAppointments])

    // Search patients
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/receptionist/search?q=${encodeURIComponent(searchQuery)}`)
                const data = await res.json()
                setSearchResults(data.patients || [])
            } catch (error) {
                console.error('Error searching:', error)
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // QR Scanner
    useEffect(() => {
        let mounted = true
        let timeoutId: NodeJS.Timeout | null = null

        async function startScanner() {
            if (mode === 'qr' && scanMode === 'camera' && !scannerActive && !cameraError && mounted) {
                // Wait for DOM element to be ready
                timeoutId = setTimeout(async () => {
                    if (mounted && document.getElementById('qr-reader')) {
                        await initScanner()
                    }
                }, 100)
            }
        }

        startScanner()

        return () => {
            mounted = false
            if (timeoutId) clearTimeout(timeoutId)
            stopScanner()
        }
    }, [mode, scanMode, cameraError])

    // Handle external barcode scanner input (they type like keyboard)
    useEffect(() => {
        if (mode !== 'qr' || scanMode !== 'manual') return

        // Focus on barcode input when in manual mode
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus()
        }
    }, [mode, scanMode])

    function stopScanner() {
        if (html5QrCodeRef.current) {
            try {
                html5QrCodeRef.current.stop().catch(() => { })
            } catch (e) {
                // Ignore errors during cleanup
            }
            html5QrCodeRef.current = null
        }
        setScannerActive(false)
    }

    async function initScanner() {
        setScannerLoading(true)

        try {
            // Check if camera is available first
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported')
            }

            // Test camera access first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            // Stop the test stream immediately
            stream.getTracks().forEach(track => track.stop())

            const { Html5Qrcode } = await import('html5-qrcode')

            // Clear any existing scanner
            stopScanner()

            // Make sure element exists
            const readerElement = document.getElementById('qr-reader')
            if (!readerElement) {
                throw new Error('QR reader element not found')
            }

            const html5QrCode = new Html5Qrcode('qr-reader')
            html5QrCodeRef.current = html5QrCode

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            }

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                async (decodedText) => {
                    // Stop scanning immediately to prevent multiple scans
                    stopScanner()
                    await handleQRScan(decodedText)
                },
                () => {
                    // QR scan error (ignored - normal during scanning)
                }
            )

            setScannerActive(true)
            setScannerLoading(false)
        } catch (error: any) {
            console.error('Error initializing scanner:', error)
            setScannerLoading(false)
            setCameraError(true)

            // Switch to manual input mode instead of search
            setScanMode('manual')
        }
    }

    async function handleQRScan(qrData: string) {
        setSearching(true)
        try {
            const trimmedData = qrData.trim().toUpperCase()
            let appointmentId: string | null = null

            // First, check if it's a short check-in code (GCH-XXXXX format)
            if (/^GCH-[A-HJ-NP-Z2-9]{5}$/i.test(trimmedData)) {
                // Look up by check-in code
                const supabase = createClient()
                const { data: appointment, error } = await supabase
                    .from('appointments')
                    .select(`
                        *,
                        child:children(id, full_name, dob, gender),
                        caregiver:caregivers(id, profiles(full_name, phone))
                    `)
                    .eq('check_in_code', trimmedData)
                    .single()

                if (error || !appointment) {
                    alert('Check-in code not found. Please verify and try again.')
                    setSearching(false)
                    setManualCode('')
                    return
                }

                setSelectedAppointment(appointment)
                setSearching(false)
                setManualCode('')
                return
            }

            // Try to parse as JSON (QR code payload)
            try {
                const parsed = JSON.parse(qrData)
                appointmentId = parsed.id || parsed.appointmentId

                // If QR contains the short code, we could use that too
                if (!appointmentId && parsed.code) {
                    // Recursively handle the code
                    await handleQRScan(parsed.code)
                    return
                }
            } catch {
                // Not JSON, check if it's a UUID (raw appointment ID)
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedData)) {
                    appointmentId = trimmedData.toLowerCase()
                }
            }

            if (!appointmentId) {
                alert('Invalid code format. Please scan a valid QR code or enter a check-in code (GCH-XXXXX).')
                setSearching(false)
                setManualCode('')
                return
            }

            // Fetch appointment by ID
            const supabase = createClient()
            const { data: appointment, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    child:children(id, full_name, dob, gender),
                    caregiver:caregivers(id, profiles(full_name, phone))
                `)
                .eq('id', appointmentId)
                .single()

            if (error || !appointment) {
                alert('Appointment not found. Please verify the code or use manual search.')
                setSearching(false)
                setManualCode('')
                return
            }

            setSelectedAppointment(appointment)
            setSearching(false)
            setManualCode('')
        } catch (error) {
            console.error('Error processing code:', error)
            alert('Invalid code. Please try manual search.')
            setSearching(false)
            setManualCode('')
        }
    }

    // Handle manual barcode/QR code input (for external scanners)
    async function handleManualCodeSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!manualCode.trim()) return
        await handleQRScan(manualCode)
    }

    async function handleCheckIn() {
        if (!selectedAppointment) return

        setCheckingIn(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            const res = await fetch('/api/receptionist/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: selectedAppointment.id,
                    child_id: selectedAppointment.child.id,
                    reason: reason || 'General checkup',
                    vitals: Object.values(vitals).some(v => v) ? vitals : null,
                    checked_in_by: user?.id,
                }),
            })

            const data = await res.json()

            if (data.success) {
                setCheckInResult({
                    success: true,
                    queueNumber: data.queueNumber,
                    patientName: selectedAppointment.child.full_name,
                })

                // Play success sound
                const audio = new Audio('/sounds/success.mp3')
                audio.play().catch(() => { })

                // Reset form after delay
                setTimeout(() => {
                    resetForm()
                    loadAppointments()
                }, 5000)
            } else {
                alert('Check-in failed: ' + data.error)
            }
        } catch (error) {
            console.error('Error checking in:', error)
            alert('Check-in failed. Please try again.')
        } finally {
            setCheckingIn(false)
        }
    }

    function resetForm() {
        setSelectedAppointment(null)
        setCheckInResult(null)
        setVitals({ temperature: '', weight: '', height: '', blood_pressure: '' })
        setReason('')
        setSearchQuery('')
        setSearchResults([])
        setManualCode('')

        // Clean up scanner
        stopScanner()

        // If camera had error, stay in QR mode but with manual input
        if (cameraError) {
            setMode('qr')
            setScanMode('manual')
        } else {
            setMode('qr')
            setScanMode('camera')
        }
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    function getAge(dob: string) {
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
            return `${months} months`
        }
        return `${age} years`
    }

    // Success screen
    if (checkInResult) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center pb-20 lg:pb-6">
                <Card className="w-full max-w-md border-none shadow-2xl">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                            <span className="text-5xl">✓</span>
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-green-700">Check-In Successful!</h2>
                        <p className="mb-6 text-slate-600">{checkInResult.patientName} has been checked in</p>
                        <div className="mb-6 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 p-6 text-white">
                            <p className="text-sm opacity-80">Queue Number</p>
                            <p className="text-6xl font-bold">{checkInResult.queueNumber}</p>
                        </div>
                        <Button onClick={resetForm} className="w-full">
                            Check In Another Patient
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Patient Check-In</h1>
                <p className="text-slate-500">Scan QR code or search for patient</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
                <Button
                    variant={mode === 'qr' ? 'primary' : 'secondary'}
                    onClick={() => {
                        stopScanner()
                        setMode('qr')
                        setSelectedAppointment(null)
                        // Reset camera error to allow retry
                        if (cameraError) {
                            setCameraError(false)
                            setScanMode('camera')
                        }
                    }}
                    className="flex-1"
                >
                    📱 Scan QR Code
                </Button>
                <Button
                    variant={mode === 'search' ? 'primary' : 'secondary'}
                    onClick={() => {
                        stopScanner()
                        setMode('search')
                    }}
                    className="flex-1"
                >
                    🔍 Search Patient
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Scanner or Search */}
                <div className="space-y-6">
                    {mode === 'qr' && !selectedAppointment && (
                        <Card className="border-none shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Scan Appointment QR Code</CardTitle>
                                {/* Toggle between camera and manual input */}
                                <div className="flex gap-1">
                                    <Button
                                        variant={scanMode === 'camera' ? 'primary' : 'secondary'}
                                        onClick={() => {
                                            setScanMode('camera')
                                            setCameraError(false)
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        📷 Camera
                                    </Button>
                                    <Button
                                        variant={scanMode === 'manual' ? 'primary' : 'secondary'}
                                        onClick={() => {
                                            stopScanner()
                                            setScanMode('manual')
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        ⌨️ Manual
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {scanMode === 'camera' ? (
                                    <>
                                        {scannerLoading && (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                <span className="ml-3 text-slate-600">Starting camera...</span>
                                            </div>
                                        )}
                                        {cameraError && !scannerLoading && (
                                            <div className="text-center py-8">
                                                <div className="text-4xl mb-4">📷❌</div>
                                                <p className="text-slate-600 mb-4">Camera not available</p>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => {
                                                        setCameraError(false)
                                                        setScannerActive(false)
                                                    }}
                                                    className="mr-2"
                                                >
                                                    Retry Camera
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setScanMode('manual')}
                                                >
                                                    Use Manual Input
                                                </Button>
                                            </div>
                                        )}
                                        {!cameraError && !scannerLoading && (
                                            <>
                                                <div
                                                    id="qr-reader"
                                                    ref={scannerRef}
                                                    className="overflow-hidden rounded-xl min-h-[300px]"
                                                ></div>
                                                <p className="mt-4 text-center text-sm text-slate-500">
                                                    Point camera at the patient's appointment QR code
                                                </p>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* Manual input for barcode scanner or typing */
                                    <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                                        <div className="text-center py-4">
                                            <div className="text-4xl mb-4">📟</div>
                                            <p className="text-slate-600 mb-2">
                                                Enter the check-in code from the appointment
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Format: GCH-XXXXX (e.g., GCH-A7K3M)
                                            </p>
                                        </div>
                                        <Input
                                            ref={barcodeInputRef}
                                            placeholder="GCH-XXXXX"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                            className="text-center text-xl font-mono tracking-wider"
                                            autoFocus
                                            maxLength={9}
                                        />
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="w-full"
                                            disabled={!manualCode.trim() || searching}
                                        >
                                            {searching ? 'Looking up...' : 'Look Up Appointment'}
                                        </Button>
                                        <p className="text-xs text-slate-500 text-center">
                                            The code is shown below the QR code on the appointment confirmation
                                        </p>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {mode === 'search' && !selectedAppointment && (
                        <>
                            {/* Search Box */}
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Search Patient</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="Search by name, phone, or caregiver..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-4"
                                    />

                                    {searching && (
                                        <p className="text-center text-slate-500">Searching...</p>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="space-y-2">
                                            {searchResults.map((result) => (
                                                <button
                                                    key={result.child.id}
                                                    onClick={() => {
                                                        // Find appointment for this child
                                                        const apt = appointments.find(
                                                            (a) => a.child.id === result.child.id
                                                        )
                                                        if (apt) {
                                                            setSelectedAppointment(apt)
                                                        } else {
                                                            alert('No appointment found for today. Please create a walk-in.')
                                                        }
                                                    }}
                                                    className="w-full rounded-xl bg-slate-50 p-4 text-left transition-all hover:bg-blue-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg">
                                                            {result.child.gender === 'male' ? '👦' : '👧'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800">
                                                                {result.child.full_name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {result.child.dob ? getAge(result.child.dob) : ''} •{' '}
                                                                Caregiver: {result.caregiver?.profiles?.full_name || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Today's Appointments */}
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg">Today's Appointments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <p className="text-center text-slate-500">Loading...</p>
                                    ) : appointments.length === 0 ? (
                                        <p className="text-center text-slate-500">No appointments today</p>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {appointments.map((apt) => (
                                                <button
                                                    key={apt.id}
                                                    onClick={() => setSelectedAppointment(apt)}
                                                    className="w-full rounded-xl bg-slate-50 p-4 text-left transition-all hover:bg-blue-50"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">
                                                                {apt.child.gender === 'male' ? '👦' : '👧'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-800">
                                                                    {apt.child.full_name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {formatTime(apt.scheduled_for)} •{' '}
                                                                    {apt.caregiver?.profiles?.full_name || 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={apt.status === 'confirmed' ? 'green' : 'blue'}>
                                                            {apt.status}
                                                        </Badge>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Right: Check-in Form */}
                {selectedAppointment && (
                    <Card className="border-none shadow-lg lg:sticky lg:top-24">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg">Check-In Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Patient Info */}
                            <div className="mb-6 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-3xl shadow-sm">
                                        {selectedAppointment.child.gender === 'male' ? '👦' : '👧'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">
                                            {selectedAppointment.child.full_name}
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            {selectedAppointment.child.dob ? getAge(selectedAppointment.child.dob) : ''} •{' '}
                                            {selectedAppointment.child.gender}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Appointment: {formatTime(selectedAppointment.scheduled_for)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vitals Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Reason for Visit
                                    </label>
                                    <Input
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="General checkup, fever, etc."
                                    />
                                </div>

                                <p className="text-sm font-medium text-slate-700">Vitals (Optional)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-500">Temperature (°C)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={vitals.temperature}
                                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                            placeholder="36.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-500">Weight (kg)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={vitals.weight}
                                            onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                            placeholder="25"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-500">Height (cm)</label>
                                        <Input
                                            type="number"
                                            value={vitals.height}
                                            onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                                            placeholder="120"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-slate-500">Blood Pressure</label>
                                        <Input
                                            value={vitals.blood_pressure}
                                            onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                                            placeholder="120/80"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={checkingIn}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {checkingIn ? 'Checking In...' : '✓ Complete Check-In'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setSelectedAppointment(null)}
                                        disabled={checkingIn}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
