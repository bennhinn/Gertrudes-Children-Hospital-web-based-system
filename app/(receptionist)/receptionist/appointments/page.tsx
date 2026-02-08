'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { AppointmentDetailsModal, AdmitPatientModal } from './_components/appointment-modals'

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

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today')
    
    // Modal states
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showAdmitModal, setShowAdmitModal] = useState(false)

    const loadAppointments = useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    child:children(id, full_name, date_of_birth),
                    caregiver:caregivers(id, profiles(full_name, phone))
                `)
                .order('scheduled_for', { ascending: true })

            if (dateFilter === 'today') {
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                query = query
                    .gte('scheduled_for', today.toISOString())
                    .lt('scheduled_for', tomorrow.toISOString())
            } else if (dateFilter === 'week') {
                const nextWeek = new Date(today)
                nextWeek.setDate(nextWeek.getDate() + 7)
                query = query
                    .gte('scheduled_for', today.toISOString())
                    .lt('scheduled_for', nextWeek.toISOString())
            }

            const { data, error } = await query

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [dateFilter])

    useEffect(() => {
        loadAppointments()
    }, [loadAppointments])

    // Modal handlers
    const handleViewDetails = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setShowDetailsModal(true)
    }

    const handleAdmitFromDetails = () => {
        setShowDetailsModal(false)
        setShowAdmitModal(true)
    }

    const handleDirectAdmit = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setShowAdmitModal(true)
    }

    const handleAdmitSuccess = () => {
        loadAppointments() // Refresh the list
        setSelectedAppointment(null)
    }

    const handleCloseModals = () => {
        setShowDetailsModal(false)
        setShowAdmitModal(false)
        setSelectedAppointment(null)
    }

    function formatDateTime(dateString: string) {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <Badge variant="yellow">Pending</Badge>
            case 'confirmed':
                return <Badge variant="blue">Confirmed</Badge>
            case 'checked_in':
                return <Badge variant="green">Checked In</Badge>
            case 'completed':
                return <Badge variant="gray">Completed</Badge>
            case 'cancelled':
                return <Badge variant="red">Cancelled</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    const filteredAppointments = appointments.filter((apt) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            apt.child?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.phone?.includes(query)
        )
    })

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Header - Compact on Mobile */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-slate-800 lg:text-2xl">Appointments</h1>
                    <p className="text-xs text-slate-500 lg:text-sm">{filteredAppointments.length} appointments found</p>
                </div>
                <Link href="/receptionist">
                    <Button variant="ghost" size="sm" className="h-8 px-2 lg:h-10 lg:px-4">← Back</Button>
                </Link>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Input
                    placeholder="Search by patient, caregiver, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pr-4"
                />
            </div>

            {/* Date Filter - Pill Style with Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible">
                <button
                    onClick={() => setDateFilter('today')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        dateFilter === 'today'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    Today
                </button>
                <button
                    onClick={() => setDateFilter('week')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        dateFilter === 'week'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    This Week
                </button>
                <button
                    onClick={() => setDateFilter('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        dateFilter === 'all'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    All
                </button>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="space-y-2 lg:space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            ) : filteredAppointments.length === 0 ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-10 text-center lg:py-12">
                        <p className="text-4xl">📅</p>
                        <p className="mt-3 text-base font-medium text-slate-600 lg:mt-4 lg:text-lg">No appointments found</p>
                        <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2 lg:space-y-3">
                    {filteredAppointments.map((apt) => {
                        const { date, time } = formatDateTime(apt.scheduled_for)
                        return (
                            <Card key={apt.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                                <CardContent className="p-3 lg:p-4">
                                    <div className="flex items-start gap-3 lg:gap-4">
                                        {/* Date Badge */}
                                        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-center lg:h-14 lg:w-14">
                                            <span className="text-[10px] font-medium text-blue-600 lg:text-xs">{date.split(' ')[0]}</span>
                                            <span className="text-base font-bold text-blue-700 lg:text-lg">{date.split(' ')[2]}</span>
                                        </div>

                                        {/* Appointment Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {apt.child?.full_name || 'Unknown'}
                                                </p>
                                                {getStatusBadge(apt.status)}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 lg:text-sm">
                                                🕐 {time} • {apt.visit_type || 'General'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                                                👤 {apt.caregiver?.profiles?.full_name || 'Unknown'} • 📞 {apt.caregiver?.profiles?.phone || 'N/A'}
                                            </p>

                                            {/* Mobile Action Buttons */}
                                            <div className="flex gap-2 mt-3 lg:hidden">
                                                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                    <Button 
                                                        size="sm" 
                                                        className="flex-1 h-9 text-xs"
                                                        onClick={() => handleDirectAdmit(apt)}
                                                    >
                                                        Admit
                                                    </Button>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="flex-1 h-9 text-xs"
                                                    onClick={() => handleViewDetails(apt)}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Desktop Action Buttons */}
                                        <div className="hidden lg:flex gap-2 shrink-0">
                                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleDirectAdmit(apt)}
                                                >
                                                    Admit Patient
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => handleViewDetails(apt)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modals */}
            <AppointmentDetailsModal
                appointment={selectedAppointment}
                open={showDetailsModal}
                onClose={handleCloseModals}
                onAdmit={handleAdmitFromDetails}
            />

            <AdmitPatientModal
                appointment={selectedAppointment}
                open={showAdmitModal}
                onClose={handleCloseModals}
                onSuccess={handleAdmitSuccess}
            />
        </div>
    )
}