'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Welcome Header */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
                        <p className="mt-1 text-cyan-100">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div className="hidden text-6xl sm:block">💊</div>
                </div>
                {stats.urgentPrescriptions > 0 && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                        </span>
                        <span className="font-medium">{stats.urgentPrescriptions} urgent prescription(s) pending!</span>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-700">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-2xl">
                                📋
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700">Preparing</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.preparing}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                                ⚗️
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700">Dispensed Today</p>
                                <p className="text-3xl font-bold text-green-600">{stats.dispensedToday}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                                ✅
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-red-50 to-rose-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700">Urgent</p>
                                <p className="text-3xl font-bold text-red-600">{stats.urgentPrescriptions}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
                                🚨
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/pharmacy/prescriptions">
                    <Button className="h-auto w-full flex-col gap-2 bg-gradient-to-r from-cyan-500 to-teal-600 py-6 shadow-lg hover:from-cyan-600 hover:to-teal-700">
                        <span className="text-3xl">📋</span>
                        <span className="font-medium">View All Prescriptions</span>
                    </Button>
                </Link>
                <Link href="/pharmacy/dispensed">
                    <Button className="h-auto w-full flex-col gap-2 bg-gradient-to-r from-green-500 to-emerald-600 py-6 shadow-lg hover:from-green-600 hover:to-emerald-700">
                        <span className="text-3xl">📦</span>
                        <span className="font-medium">Dispensed History</span>
                    </Button>
                </Link>
                <Link href="/pharmacy/inventory">
                    <Button className="h-auto w-full flex-col gap-2 bg-gradient-to-r from-purple-500 to-violet-600 py-6 shadow-lg hover:from-purple-600 hover:to-violet-700">
                        <span className="text-3xl">📊</span>
                        <span className="font-medium">Check Inventory</span>
                    </Button>
                </Link>
            </div>

            {/* Prescription Queue */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">💊</span>
                        Prescription Queue
                    </CardTitle>
                    <Link href="/pharmacy/prescriptions">
                        <Badge variant="outline" className="cursor-pointer hover:opacity-80 bg-blue-50 text-blue-700 border-blue-200">
                            View All →
                        </Badge>
                    </Link>
                </CardHeader>
                <CardContent>
                    {prescriptions.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">🎉</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">All caught up!</p>
                            <p className="text-slate-400">No pending prescriptions</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {prescriptions.slice(0, 5).map((prescription) => (
                                <div
                                    key={prescription.id}
                                    className={`rounded-xl border p-4 transition-all hover:shadow-md ${prescription.urgency === 'stat'
                                            ? 'border-red-200 bg-red-50/50'
                                            : prescription.urgency === 'urgent'
                                                ? 'border-yellow-200 bg-yellow-50/50'
                                                : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white ${prescription.urgency === 'stat'
                                                    ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse'
                                                    : prescription.urgency === 'urgent'
                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                        : 'bg-gradient-to-br from-cyan-400 to-teal-500'
                                                }`}>
                                                💊
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {prescription.child?.full_name || 'Unknown Patient'}
                                                    </h3>
                                                    {prescription.urgency === 'stat' && (
                                                        <Badge variant="destructive" className="animate-pulse">STAT</Badge>
                                                    )}
                                                    {prescription.urgency === 'urgent' && (
                                                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Urgent</Badge>
                                                    )}
                                                    <Badge variant={prescription.status === 'pending' ? 'outline' : 'outline'} className={prescription.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                                        {prescription.status === 'pending' ? 'Pending' : 'Preparing'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {prescription.prescription_items?.length || 0} medication(s) •{' '}
                                                    Dr. {prescription.doctor?.profiles?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-400">{getTimeAgo(prescription.prescribed_at)}</p>
                                            </div>
                                        </div>
                                        <Link href={`/pharmacy/prescriptions?id=${prescription.id}`}>
                                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                                                View Details
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