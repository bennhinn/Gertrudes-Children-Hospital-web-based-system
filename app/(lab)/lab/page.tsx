'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    FlaskConical,
    ClipboardList,
    TestTube,
    CheckCircle,
    AlertTriangle,
    Clock,
    ChevronRight,
    FileBarChart,
    Printer,
    ListChecks,
    AlertCircle,
    Beaker
} from 'lucide-react'

interface LabStats {
    pendingTests: number
    inProgress: number
    completedToday: number
    criticalResults: number
}

interface LabOrder {
    id: string
    test_type: string
    test_code: string | null
    urgency: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    special_instructions: string | null
    completed_at?: string
    child: {
        id: string
        full_name: string
        date_of_birth: string
        gender: string
    } | null
    doctor: {
        id: string
        profiles: {
            full_name: string
        }
    } | null
}

export default function LabDashboard() {
    const [stats, setStats] = useState<LabStats>({
        pendingTests: 0,
        inProgress: 0,
        completedToday: 0,
        criticalResults: 0,
    })
    const [pendingOrders, setPendingOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadDashboardData = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get all lab orders with proper joins
            // Note: lab_orders has two FKs to doctors (doctor_id and reviewed_by)
            // We need to specify which one using the FK name
            const { data: orders, error: ordersError } = await supabase
                .from('lab_orders')
                .select(`
          *,
          child:children(id, full_name, date_of_birth, gender),
          doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
        `)
                .order('ordered_at', { ascending: false })

            if (ordersError) {
                console.error('Lab orders error:', ordersError)
                setError(`Failed to load lab orders: ${ordersError.message}`)
            }

            const ordersData = orders || []

            // Calculate stats
            const pending = ordersData.filter(o => o.status === 'pending')
            const inProgress = ordersData.filter(o => o.status === 'in_progress' || o.status === 'collected')
            const completedToday = ordersData.filter(o =>
                o.status === 'completed' &&
                o.completed_at &&
                new Date(o.completed_at) >= today
            )

            // Count critical results from completed orders with abnormal findings
            const criticalCount = ordersData.filter(o =>
                o.status === 'completed' &&
                o.abnormal_findings &&
                o.abnormal_findings.trim() !== ''
            ).length

            setStats({
                pendingTests: pending.length,
                inProgress: inProgress.length,
                completedToday: completedToday.length,
                criticalResults: criticalCount,
            })

            // Get pending orders (stat and urgent first)
            const sortedPending = pending.sort((a, b) => {
                const urgencyOrder = { stat: 0, urgent: 1, routine: 2 }
                return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]
            })
            setPendingOrders(sortedPending.slice(0, 10))
        } catch (error: any) {
            console.error('Error loading dashboard:', error)
            setError(error.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('lab-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders' },
                () => loadDashboardData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadDashboardData])

    function getUrgencyBadge(urgency: string) {
        switch (urgency) {
            case 'stat':
                return <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 animate-pulse">STAT</Badge>
            case 'urgent':
                return <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">Urgent</Badge>
            default:
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">Routine</Badge>
        }
    }

    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
            return `${months} mo`
        }
        return `${age} yrs`
    }

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

    async function collectSample(orderId: string) {
        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('lab_orders')
                .update({
                    status: 'collected',
                    collected_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (error) throw error

            loadDashboardData()
        } catch (error) {
            console.error('Error collecting sample:', error)
            alert('Failed to update sample status')
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 rounded bg-slate-200"></div>
                                <div className="mt-2 h-8 w-16 rounded bg-slate-200"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 p-3">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Welcome Header - Compact on Mobile */}
            <div className="rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold lg:text-2xl">Laboratory Dashboard</h1>
                        <p className="mt-0.5 text-sm text-amber-100 lg:mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <Link href="/lab/orders">
                        <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                            <ClipboardList className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">View </span>Orders
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Compact on Mobile */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 lg:h-12 lg:w-12">
                                <ClipboardList className="h-5 w-5 text-amber-600 lg:h-6 lg:w-6" />
                                {stats.pendingTests > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Pending</p>
                                <p className="text-2xl font-bold text-amber-600 lg:text-3xl">{stats.pendingTests}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 lg:h-12 lg:w-12">
                                <FlaskConical className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">In Progress</p>
                                <p className="text-2xl font-bold text-blue-600 lg:text-3xl">{stats.inProgress}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 lg:h-12 lg:w-12">
                                <CheckCircle className="h-5 w-5 text-emerald-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Today</p>
                                <p className="text-2xl font-bold text-emerald-600 lg:text-3xl">{stats.completedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-200 lg:h-12 lg:w-12">
                                <AlertTriangle className="h-5 w-5 text-red-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Critical</p>
                                <p className="text-2xl font-bold text-red-600 lg:text-3xl">{stats.criticalResults}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Horizontal scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
                <Link href="/lab/orders" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <ClipboardList className="h-5 w-5 text-amber-600" />
                        <span className="text-xs font-medium lg:text-sm">Orders</span>
                    </Button>
                </Link>
                <Link href="/lab/results" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <FileBarChart className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-medium lg:text-sm">Results</span>
                    </Button>
                </Link>
                <Button variant="secondary" className="h-auto flex-shrink-0 flex-col gap-1.5 px-5 py-3 lg:gap-2 lg:py-4" disabled>
                    <Printer className="h-5 w-5 text-slate-400" />
                    <span className="text-xs font-medium lg:text-sm">Print</span>
                </Button>
                <Link href="/lab/completed" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <ListChecks className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs font-medium lg:text-sm">Completed</span>
                    </Button>
                </Link>
            </div>

            {/* Pending Orders */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                    <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                        <TestTube className="h-5 w-5 text-amber-600" />
                        Pending Tests
                    </CardTitle>
                    <Link href="/lab/orders">
                        <Badge className="cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                            All <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Badge>
                    </Link>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                    {pendingOrders.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-sm text-slate-500">No pending test orders</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 lg:space-y-3">
                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border p-3 transition-all lg:p-4 ${order.urgency === 'stat'
                                        ? 'border-red-200 bg-red-50/50'
                                        : order.urgency === 'urgent'
                                            ? 'border-amber-200 bg-amber-50/50'
                                            : 'border-slate-200 bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white lg:h-12 lg:w-12 ${order.urgency === 'stat'
                                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                                            : order.urgency === 'urgent'
                                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}>
                                            <Beaker className="h-5 w-5 lg:h-6 lg:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="truncate text-sm font-semibold text-slate-800 lg:text-base">{order.test_type}</h3>
                                                {getUrgencyBadge(order.urgency)}
                                            </div>
                                            <p className="text-xs text-slate-600 lg:text-sm">
                                                {order.child?.full_name || 'Unknown'} • {order.child?.date_of_birth ? getAge(order.child.date_of_birth) : ''}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 lg:text-xs">
                                                <Clock className="h-3 w-3" />
                                                Dr. {order.doctor?.profiles?.full_name || 'Unknown'} • {getTimeAgo(order.ordered_at)}
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700 lg:h-9 lg:px-4 lg:text-sm"
                                            onClick={() => collectSample(order.id)}
                                        >
                                            Collect
                                        </Button>
                                    </div>

                                    {order.special_instructions && (
                                        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-100 p-2">
                                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-700" />
                                            <p className="text-[11px] text-amber-800 lg:text-xs">{order.special_instructions}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}