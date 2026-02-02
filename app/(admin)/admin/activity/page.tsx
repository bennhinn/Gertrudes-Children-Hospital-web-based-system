'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Activity,
    Search,
    Filter,
    Calendar,
    User,
    Pill,
    FlaskConical,
    Stethoscope,
    Baby,
    ShoppingCart,
    LogIn,
    LogOut,
    UserPlus,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Download,
    X
} from 'lucide-react'

interface ActivityLog {
    id: string
    user_id: string | null
    action: string
    target_table: string
    target_id: string | null
    description: string | null
    metadata: Record<string, any>
    user_email: string | null
    user_role: string | null
    created_at: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

type FilterType = 'all' | 'prescription' | 'appointment' | 'lab_order' | 'order' | 'child' | 'auth' | 'medication'

const ACTION_ICONS: Record<string, any> = {
    dispense_prescription: Pill,
    create_prescription: Pill,
    update_prescription: Pill,
    create_lab_order: FlaskConical,
    process_lab_order: FlaskConical,
    book_appointment: Calendar,
    cancel_appointment: XCircle,
    check_in: CheckCircle,
    register_child: Baby,
    create_supply_order: ShoppingCart,
    receive_delivery: ShoppingCart,
    create_medication: Pill,
    login: LogIn,
    logout: LogOut,
    register: UserPlus,
    default: Activity
}

const ACTION_COLORS: Record<string, string> = {
    dispense_prescription: 'bg-purple-100 text-purple-700',
    create_prescription: 'bg-purple-100 text-purple-700',
    create_lab_order: 'bg-blue-100 text-blue-700',
    book_appointment: 'bg-emerald-100 text-emerald-700',
    cancel_appointment: 'bg-red-100 text-red-700',
    check_in: 'bg-green-100 text-green-700',
    register_child: 'bg-pink-100 text-pink-700',
    create_supply_order: 'bg-orange-100 text-orange-700',
    receive_delivery: 'bg-teal-100 text-teal-700',
    create_medication: 'bg-indigo-100 text-indigo-700',
    login: 'bg-cyan-100 text-cyan-700',
    logout: 'bg-slate-100 text-slate-700',
    register: 'bg-green-100 text-green-700',
    default: 'bg-slate-100 text-slate-600'
}

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    doctor: 'bg-blue-100 text-blue-700',
    pharmacist: 'bg-purple-100 text-purple-700',
    lab_tech: 'bg-teal-100 text-teal-700',
    receptionist: 'bg-orange-100 text-orange-700',
    caregiver: 'bg-pink-100 text-pink-700',
    supplier: 'bg-amber-100 text-amber-700',
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
    const [refreshing, setRefreshing] = useState(false)

    const loadLogs = useCallback(async (page = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
            })

            if (searchQuery) {
                params.append('search', searchQuery)
            }

            if (filterType !== 'all') {
                params.append('target_table', filterType)
            }

            if (dateFilter === 'today') {
                params.append('start_date', new Date().toISOString().split('T')[0])
            } else if (dateFilter === 'week') {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                params.append('start_date', weekAgo.toISOString().split('T')[0])
            } else if (dateFilter === 'month') {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                params.append('start_date', monthAgo.toISOString().split('T')[0])
            }

            const response = await fetch(`/api/admin/activity-logs?${params}`)
            const data = await response.json()

            if (data.logs) {
                setLogs(data.logs)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Error loading activity logs:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [searchQuery, filterType, dateFilter])

    useEffect(() => {
        loadLogs()
    }, [loadLogs])

    const handleRefresh = () => {
        setRefreshing(true)
        loadLogs(1)
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadLogs(newPage)
        }
    }

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups: Record<string, ActivityLog[]> = {}

        logs.forEach(log => {
            const date = new Date(log.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(log)
        })

        return groups
    }, [logs])

    // Stats
    const stats = useMemo(() => {
        const today = new Date().toDateString()
        const todayLogs = logs.filter(log => new Date(log.created_at).toDateString() === today)

        const byRole = logs.reduce((acc, log) => {
            const role = log.user_role || 'unknown'
            acc[role] = (acc[role] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const byAction = logs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            total: pagination.total,
            today: todayLogs.length,
            byRole,
            byAction,
            topAction: Object.entries(byAction).sort((a, b) => b[1] - a[1])[0]
        }
    }, [logs, pagination.total])

    function getActionIcon(action: string) {
        const Icon = ACTION_ICONS[action] || ACTION_ICONS.default
        return Icon
    }

    function getActionColor(action: string) {
        return ACTION_COLORS[action] || ACTION_COLORS.default
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatActionName(action: string) {
        return action
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Activity History</h1>
                    </div>
                    <p className="text-slate-500">Complete audit trail of all system events</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100">
                                <Activity className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-xs text-slate-500">Total Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <Clock className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                                <p className="text-xs text-slate-500">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.byRole).length}</p>
                                <p className="text-xs text-slate-500">Active Roles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100">
                                <Stethoscope className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 truncate">
                                    {stats.topAction ? formatActionName(stats.topAction[0]) : 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">Top Action</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-slate-100">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by action, user, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'prescription', 'appointment', 'lab_order', 'order', 'child', 'auth'] as FilterType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === type
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {type === 'all' ? 'All' : type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Date Filter */}
                        <div className="flex gap-2">
                            {(['all', 'today', 'week', 'month'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setDateFilter(period)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${dateFilter === period
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="border-slate-100">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        Event Timeline
                        <Badge variant="secondary" className="ml-2">
                            {logs.length} events
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {logs.length === 0 ? (
                        <div className="py-16 text-center">
                            <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No activity logs found</p>
                            <p className="text-sm text-slate-400 mt-1">Activity will appear here as users interact with the system</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="sticky top-0 bg-slate-50 px-4 py-2 border-b border-slate-100">
                                        <p className="text-sm font-semibold text-slate-700">{date}</p>
                                        <p className="text-xs text-slate-400">{dateLogs.length} event{dateLogs.length !== 1 ? 's' : ''}</p>
                                    </div>

                                    {/* Events for this date */}
                                    {dateLogs.map((log) => {
                                        const Icon = getActionIcon(log.action)
                                        const colorClass = getActionColor(log.action)
                                        const roleColor = ROLE_COLORS[log.user_role || ''] || 'bg-slate-100 text-slate-600'

                                        return (
                                            <div
                                                key={log.id}
                                                className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                                            >
                                                {/* Icon */}
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-medium text-slate-900 text-sm">
                                                                {formatActionName(log.action)}
                                                            </p>
                                                            {log.description && (
                                                                <p className="text-sm text-slate-600 mt-0.5">
                                                                    {log.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400 flex-shrink-0">
                                                            {formatTime(log.created_at)}
                                                        </span>
                                                    </div>

                                                    {/* User info */}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {log.user_email && (
                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {log.user_email}
                                                            </span>
                                                        )}
                                                        {log.user_role && (
                                                            <Badge className={`text-xs ${roleColor}`}>
                                                                {log.user_role}
                                                            </Badge>
                                                        )}
                                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                            <span className="text-xs text-slate-400">
                                                                • {Object.keys(log.metadata).length} details
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <p className="text-sm text-slate-500">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
