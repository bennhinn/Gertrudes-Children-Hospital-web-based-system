'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, Filter, ChevronRight, Download, TrendingUp } from 'lucide-react'

interface LabOrder {
    id: string
    test_type: string
    test_code: string | null
    test_name: string | null
    priority: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    completed_at: string | null
    collected_at: string | null
    processing_started_at: string | null
    special_instructions: string | null
    results: string | null
    abnormal_findings: string | null
    result_notes: string | null
    clinical_notes: string | null
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
    reviewed_by: string | null
    reviewed_at: string | null
}

type PriorityFilter = 'all' | 'stat' | 'urgent' | 'routine'
type TimeFilter = 'all' | 'today' | 'week' | 'month'

export default function CompletedOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const loadCompletedOrders = useCallback(async () => {
        try {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('lab_orders')
                .select(`
                  *,
                  child:children(id, full_name, date_of_birth, gender),
                  doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
                `)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })

            if (error) throw error

            setOrders(data as LabOrder[])
        } catch (error) {
            console.error('Error loading completed orders:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCompletedOrders()

        const supabase = createClient()
        const channel = supabase
            .channel('completed-lab-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders', filter: 'status=eq.completed' },
                () => loadCompletedOrders()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadCompletedOrders])

    const filteredOrders = orders.filter(order => {
        // Priority filter
        if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false
        
        // Time filter
        if (timeFilter !== 'all' && order.completed_at) {
            const completedDate = new Date(order.completed_at)
            const now = new Date()
            
            if (timeFilter === 'today') {
                const isToday = completedDate.toDateString() === now.toDateString()
                if (!isToday) return false
            } else if (timeFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                if (completedDate < weekAgo) return false
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                if (completedDate < monthAgo) return false
            }
        }
        
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            const childName = order.child?.full_name.toLowerCase() || ''
            const testType = order.test_type?.toLowerCase() || ''
            const testName = order.test_name?.toLowerCase() || ''
            
            if (!childName.includes(search) && !testType.includes(search) && !testName.includes(search)) {
                return false
            }
        }
        
        return true
    })

    const stats = {
        total: filteredOrders.length,
        abnormal: filteredOrders.filter(o => o.abnormal_findings).length,
        reviewed: filteredOrders.filter(o => o.reviewed_at).length,
        critical: filteredOrders.filter(o => o.priority === 'stat').length,
    }

    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        
        if (age < 1) {
            const months = monthDiff + (age * 12)
            return months <= 1 ? 'Infant' : `${months}mo`
        }
        return `${age}y`
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatDateOnly(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        })
    }

    function getTimeAgo(dateString: string | null) {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays}d ago`
        return formatDateOnly(dateString)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading completed tests...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Completed Tests</h1>
                    <p className="text-slate-600 mt-1">View all completed lab test results</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats - Minimal design */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5">
                    <p className="text-sm text-green-700 font-medium mb-1">Total Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5">
                    <p className="text-sm text-amber-700 font-medium mb-1">Abnormal Results</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.abnormal}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5">
                    <p className="text-sm text-blue-700 font-medium mb-1">Reviewed</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.reviewed}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5">
                    <p className="text-sm text-red-700 font-medium mb-1">Critical Priority</p>
                    <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name or test type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border-0 bg-white pl-10 pr-4 py-3 text-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    {/* Time Filter */}
                    {(['all', 'today', 'week', 'month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                timeFilter === f 
                                    ? 'bg-slate-900 text-white shadow-lg' 
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {f === 'all' ? 'All Time' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                    
                    <div className="w-px bg-slate-200 mx-1" />
                    
                    {/* Priority Filter */}
                    {(['all', 'stat', 'urgent', 'routine'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setPriorityFilter(f)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                priorityFilter === f 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {f === 'all' ? 'All Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{filteredOrders.length}</span> results found
                </p>
            </div>

            {/* Results List - No borders, clean design */}
            <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            No results found
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                            {searchTerm ? 'Try adjusting your search or filters' : 'No completed tests yet'}
                        </p>
                        {searchTerm && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSearchTerm('')
                                    setPriorityFilter('all')
                                    setTimeFilter('all')
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredOrders.map((order, index) => (
                        <button
                            key={order.id}
                            onClick={() => router.push(`/lab/results/${order.id}`)}
                            className="group w-full text-left bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-2xl p-5 transition-all hover:shadow-md"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Test Name & Badges */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 text-lg mb-1">
                                                {order.test_name || order.test_type}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className="bg-green-100 text-green-700 border-0 font-medium">
                                                    Completed
                                                </Badge>
                                                {order.abnormal_findings && (
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 font-medium">
                                                        ⚠️ Abnormal
                                                    </Badge>
                                                )}
                                                {order.reviewed_at && (
                                                    <Badge className="bg-blue-100 text-blue-700 border-0 font-medium">
                                                        ✓ Reviewed
                                                    </Badge>
                                                )}
                                                {order.priority === 'stat' && (
                                                    <Badge className="bg-red-100 text-red-700 border-0 font-medium">
                                                        🔴 STAT
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                                    </div>

                                    {/* Patient Info */}
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                                        <span className="font-medium text-slate-900">
                                            {order.child?.full_name}
                                        </span>
                                        <span>•</span>
                                        <span>{getAge(order.child?.date_of_birth || '')}</span>
                                        <span>•</span>
                                        <span className="capitalize">{order.child?.gender}</span>
                                    </div>

                                    {/* Doctor & Date */}
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>Dr. {order.doctor?.profiles.full_name}</span>
                                        <span>•</span>
                                        <span>{getTimeAgo(order.completed_at)}</span>
                                    </div>

                                    {/* Result Preview (if available) */}
                                    {order.results && (
                                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                                            <p className="text-sm text-slate-700 line-clamp-1">
                                                Result: {order.results}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}