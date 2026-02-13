'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import {
    Pill,
    ClipboardList,
    FlaskConical,
    CheckCircle,
    AlertTriangle,
    Package,
    Clock,
    ChevronRight,
    History,
    Boxes,
    Eye
} from 'lucide-react'

interface Stats {
    pending: number
    preparing: number
    dispensedToday: number
    urgentPrescriptions: number
}

interface Prescription {
    id: string
    status: string
    urgency: string
    prescribed_at: string
    child_id: string
    doctor_id: string
    prescription_items: PrescriptionItem[]
    child: {
        id: string
        full_name: string
    } | null
    doctor: {
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
    quantity: number
}

export default function PharmacyDashboardPage() {
    const [stats, setStats] = useState<Stats>({
        pending: 0,
        preparing: 0,
        dispensedToday: 0,
        urgentPrescriptions: 0,
    })
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date().toISOString().split('T')[0]

            // FIX: Load prescriptions with direct child and doctor joins
            const { data: prescriptionsData, error } = await supabase
                .from('prescriptions')
                .select(`
          *,
          prescription_items(*),
          child:children(id, full_name),
          doctor:doctors(id, profiles(full_name))
        `)
                .in('status', ['pending', 'preparing'])
                .order('prescribed_at', { ascending: true })

            if (error) {
                console.error('Error loading prescriptions:', error)
            }

            console.log('📋 Loaded prescriptions:', prescriptionsData?.length || 0)

            // Sort by urgency (stat first)
            const sortedPrescriptions = (prescriptionsData || []).sort((a, b) => {
                const urgencyOrder = { stat: 0, urgent: 1, routine: 2 }
                return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]
            })

            setPrescriptions(sortedPrescriptions)

            // Calculate stats
            const pendingCount = (prescriptionsData || []).filter(p => p.status === 'pending').length
            const preparingCount = (prescriptionsData || []).filter(p => p.status === 'preparing').length
            const urgentCount = (prescriptionsData || []).filter(p =>
                (p.urgency === 'stat' || p.urgency === 'urgent') && p.status === 'pending'
            ).length

            // Get today's dispensed count
            const { count: dispensedCount } = await supabase
                .from('prescriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'dispensed')
                .gte('dispensed_at', today)

            setStats({
                pending: pendingCount,
                preparing: preparingCount,
                dispensedToday: dispensedCount || 0,
                urgentPrescriptions: urgentCount,
            })

            console.log('📊 Stats:', {
                pending: pendingCount,
                preparing: preparingCount,
                dispensedToday: dispensedCount || 0,
                urgent: urgentCount
            })
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('pharmacy-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'prescriptions' },
                () => loadDashboardData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadDashboardData])

    // Log dashboard view after initial load
    useEffect(() => {
        if (!loading) {
            logActivity({
                action: ActivityActions.REPORT_VIEW,
                description: 'Viewed pharmacy dashboard',
                metadata: {},
            }).catch(() => {})
        }
    }, [loading])

    function getTimeAgo(dateString: string) {
        const now = new Date().getTime()
        const ordered = new Date(dateString).getTime()
        const diff = Math.round((now - ordered) / 60000)
        if (diff < 1) return 'Just now'
        if (diff < 60) return `${diff}m ago`
        const hours = Math.floor(diff / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-2xl bg-cyan-100"></div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Welcome Header - Compact on Mobile */}
            <div className="overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold lg:text-2xl">Pharmacy Dashboard</h1>
                        <p className="mt-0.5 text-sm text-teal-100 lg:mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div className="hidden h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:flex">
                        <Pill className="h-7 w-7 text-white" />
                    </div>
                </div>
                {stats.urgentPrescriptions > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/20 p-2.5 backdrop-blur-sm lg:mt-4 lg:rounded-xl lg:p-3">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
                        </span>
                        <span className="text-sm font-medium">{stats.urgentPrescriptions} urgent prescription(s) pending!</span>
                    </div>
                )}
            </div>

            {/* Stats Grid - Compact on Mobile */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 lg:h-12 lg:w-12">
                                <ClipboardList className="h-5 w-5 text-amber-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-amber-700 lg:text-sm">Pending</p>
                                <p className="text-2xl font-bold text-amber-600 lg:text-3xl">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 lg:h-12 lg:w-12">
                                <FlaskConical className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-blue-700 lg:text-sm">Preparing</p>
                                <p className="text-2xl font-bold text-blue-600 lg:text-3xl">{stats.preparing}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-emerald-50 to-green-50 shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 lg:h-12 lg:w-12">
                                <CheckCircle className="h-5 w-5 text-emerald-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-emerald-700 lg:text-sm">Today</p>
                                <p className="text-2xl font-bold text-emerald-600 lg:text-3xl">{stats.dispensedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-red-50 to-rose-50 shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 lg:h-12 lg:w-12">
                                <AlertTriangle className="h-5 w-5 text-red-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-red-700 lg:text-sm">Urgent</p>
                                <p className="text-2xl font-bold text-red-600 lg:text-3xl">{stats.urgentPrescriptions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Horizontal scroll on mobile */}
            <div className="grid grid-cols-3 gap-3 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
                <Link href="/pharmacy/prescriptions" className="w-full lg:w-auto">
                    <Button className="w-full min-h-[56px] h-auto flex-col gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 shadow-md hover:from-teal-600 hover:to-cyan-700 lg:w-full lg:gap-2 lg:py-5">
                        <ClipboardList className="h-5 w-5 lg:h-6 lg:w-6" />
                        <span className="text-xs font-medium lg:text-sm">Prescriptions</span>
                    </Button>
                </Link>
                <Link href="/pharmacy/dispensed" className="w-full lg:w-auto">
                    <Button className="w-full min-h-[56px] h-auto flex-col gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 shadow-md hover:from-emerald-600 hover:to-green-700 lg:w-full lg:gap-2 lg:py-5">
                        <History className="h-5 w-5 lg:h-6 lg:w-6" />
                        <span className="text-xs font-medium lg:text-sm">History</span>
                    </Button>
                </Link>
                <Link href="/pharmacy/inventory" className="w-full lg:w-auto">
                    <Button className="w-full min-h-[56px] h-auto flex-col gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 shadow-md hover:from-violet-600 hover:to-purple-700 lg:w-full lg:gap-2 lg:py-5">
                        <Boxes className="h-5 w-5 lg:h-6 lg:w-6" />
                        <span className="text-xs font-medium lg:text-sm">Inventory</span>
                    </Button>
                </Link>
            </div>

            {/* Prescription Queue */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                        <Pill className="h-5 w-5 text-teal-600" />
                        Prescription Queue
                    </CardTitle>
                    <Link href="/pharmacy/prescriptions">
                        <Badge className="cursor-pointer bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100">
                            View All <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Badge>
                    </Link>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                    {prescriptions.length === 0 ? (
                        <div className="py-8 text-center lg:py-12">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-base font-medium text-slate-600 lg:text-lg">All caught up!</p>
                            <p className="text-sm text-slate-400">No pending prescriptions</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 lg:space-y-3">
                            {prescriptions.slice(0, 5).map((prescription) => (
                                <div
                                    key={prescription.id}
                                    className={`rounded-xl border p-3 transition-all lg:p-4 ${prescription.urgency === 'stat'
                                        ? 'border-red-200 bg-red-50/50'
                                        : prescription.urgency === 'urgent'
                                            ? 'border-amber-200 bg-amber-50/50'
                                            : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white lg:h-12 lg:w-12 ${prescription.urgency === 'stat'
                                            ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse'
                                            : prescription.urgency === 'urgent'
                                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                : 'bg-gradient-to-br from-teal-400 to-cyan-500'
                                            }`}>
                                            <Pill className="h-5 w-5 lg:h-6 lg:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="truncate text-sm font-semibold text-slate-800 lg:text-base">
                                                    {prescription.child?.full_name || 'Unknown Patient'}
                                                </h3>
                                                {prescription.urgency === 'stat' && (
                                                    <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 animate-pulse">STAT</Badge>
                                                )}
                                                {prescription.urgency === 'urgent' && (
                                                    <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">Urgent</Badge>
                                                )}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 lg:text-sm">
                                                <span>{prescription.prescription_items?.length || 0} med(s)</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="truncate">Dr. {prescription.doctor?.profiles?.full_name || 'Unknown'}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 lg:text-xs">
                                                <Clock className="h-3 w-3" />
                                                {getTimeAgo(prescription.prescribed_at)}
                                                <Badge className={`ml-1 text-[10px] px-1.5 py-0 ${prescription.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                    {prescription.status === 'pending' ? 'Pending' : 'Preparing'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Link href={`/pharmacy/prescriptions?id=${prescription.id}`}>
                                            <Button size="sm" className="h-8 bg-teal-600 px-3 text-xs hover:bg-teal-700 lg:h-9 lg:px-4 lg:text-sm">
                                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}