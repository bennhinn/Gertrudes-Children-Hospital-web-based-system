'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    visit_type: string
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

interface AppointmentDetailsModalProps {
    appointment: Appointment | null
    open: boolean
    onClose: () => void
    onAdmit: () => void
}

export function AppointmentDetailsModal({ appointment, open, onClose, onAdmit }: AppointmentDetailsModalProps) {
    if (!appointment) return null

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getAge = (dob: string) => {
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Appointment Details</DialogTitle>
                    <DialogDescription>View and manage appointment information</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="rounded-lg bg-blue-50 p-4">
                        <h3 className="font-semibold text-blue-900 mb-3">Patient Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-blue-600 font-medium">Name</p>
                                <p className="text-blue-900">{appointment.child?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium">Age</p>
                                <p className="text-blue-900">{getAge(appointment.child?.date_of_birth)} years</p>
                            </div>
                            <div>
                                <p className="text-blue-600 font-medium">Date of Birth</p>
                                <p className="text-blue-900">
                                    {new Date(appointment.child?.date_of_birth).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Caregiver Info */}
                    <div className="rounded-lg bg-green-50 p-4">
                        <h3 className="font-semibold text-green-900 mb-3">Caregiver Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-green-600 font-medium">Name</p>
                                <p className="text-green-900">{appointment.caregiver?.profiles?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-green-600 font-medium">Phone</p>
                                <p className="text-green-900">{appointment.caregiver?.profiles?.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Appointment Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-medium">Status</span>
                                <Badge variant={
                                    appointment.status === 'confirmed' ? 'blue' :
                                    appointment.status === 'checked_in' ? 'green' :
                                    appointment.status === 'completed' ? 'gray' :
                                    'yellow'
                                }>
                                    {appointment.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-medium">Visit Type</span>
                                <span className="text-slate-900">{appointment.visit_type || 'General'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-medium">Scheduled For</span>
                                <span className="text-slate-900">{formatDate(appointment.scheduled_for)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <Button onClick={onAdmit} className="flex-1">
                                Admit Patient
                            </Button>
                        )}
                        <Button onClick={onClose} className="flex-1">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface AdmitPatientModalProps {
    appointment: Appointment | null
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AdmitPatientModal({ appointment, open, onClose, onSuccess }: AdmitPatientModalProps) {
    const [loading, setLoading] = useState(false)
    const [vitals, setVitals] = useState({
        temperature: '',
        weight: '',
        height: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: '',
    })
    const [reason, setReason] = useState('General checkup')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!appointment) return

        setLoading(true)
        try {
            // Filter out empty vitals
            const filteredVitals = Object.entries(vitals).reduce((acc, [key, value]) => {
                if (value.trim()) {
                    acc[key] = parseFloat(value)
                }
                return acc
            }, {} as Record<string, number>)

            const response = await fetch('/api/check-ins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appointment.id,
                    childId: appointment.child.id,
                    vitals: filteredVitals,
                    reason,
                    notes: notes.trim() || null,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to admit patient')
            }

            alert('Patient admitted successfully!')
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error admitting patient:', error)
            alert('Failed to admit patient. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Admit Patient</DialogTitle>
                    <DialogDescription>
                        Record vitals for {appointment.child?.full_name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vitals Section */}
                    <div className="rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-900 mb-4">Vital Signs</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="temperature">Temperature (°C)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    placeholder="36.5"
                                    value={vitals.temperature}
                                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    placeholder="15.5"
                                    value={vitals.weight}
                                    onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    step="0.1"
                                    placeholder="120"
                                    value={vitals.height}
                                    onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                                <Input
                                    id="heart_rate"
                                    type="number"
                                    placeholder="80"
                                    value={vitals.heart_rate}
                                    onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bp_systolic">BP Systolic (mmHg)</Label>
                                <Input
                                    id="bp_systolic"
                                    type="number"
                                    placeholder="120"
                                    value={vitals.blood_pressure_systolic}
                                    onChange={(e) => setVitals({ ...vitals, blood_pressure_systolic: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bp_diastolic">BP Diastolic (mmHg)</Label>
                                <Input
                                    id="bp_diastolic"
                                    type="number"
                                    placeholder="80"
                                    value={vitals.blood_pressure_diastolic}
                                    onChange={(e) => setVitals({ ...vitals, blood_pressure_diastolic: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="respiratory_rate">Respiratory Rate (breaths/min)</Label>
                                <Input
                                    id="respiratory_rate"
                                    type="number"
                                    placeholder="20"
                                    value={vitals.respiratory_rate}
                                    onChange={(e) => setVitals({ ...vitals, respiratory_rate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
                                <Input
                                    id="oxygen"
                                    type="number"
                                    placeholder="98"
                                    value={vitals.oxygen_saturation}
                                    onChange={(e) => setVitals({ ...vitals, oxygen_saturation: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reason & Notes */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason for Visit</Label>
                            <Input
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="General checkup"
                            />
                        </div>
                        <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Admitting...' : 'Admit Patient'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}