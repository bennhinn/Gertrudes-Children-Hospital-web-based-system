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
    ChevronDown,
    ChevronUp,
    Download,
    X,
    MessageSquare,
    CreditCard,
    Settings
} from 'lucide-react'

interface ActivityLog {
    id: string
    user_id: string | null
    action: string
    action_type: string | null
    action_category: string | null
    target_table: string
    target_id: string | null
    resource_name: string | null
    description: string | null
    metadata: Record<string, any>
    user_email: string | null
    user_role: string | null
    status: string | null
    error_message: string | null
    changes: Record<string, any> | null
    ip_address: string | null
    device_type: string | null
    browser: string | null
    os: string | null
    created_at: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

type CategoryFilter = 'all' | 'authentication' | 'appointment' | 'patient' | 'prescription' | 'lab' | 'pharmacy' | 'chat' | 'report' | 'finance' | 'system'

const ACTION_ICONS: Record<string, any> = {
    dispense_prescription: Pill,
    create_prescription: Pill,
    update_prescription: Pill,
    prescription_create: Pill,
    prescription_update: Pill,
    prescription_dispense: Pill,
    create_lab_order: FlaskConical,
    process_lab_order: FlaskConical,
    lab_order_create: FlaskConical,
    lab_order_collect: FlaskConical,
    lab_order_process: FlaskConical,
    lab_order_complete: FlaskConical,
    book_appointment: Calendar,
    cancel_appointment: XCircle,
    appointment_create: Calendar,
    appointment_update: Calendar,
    appointment_cancel: XCircle,
    appointment_confirm: CheckCircle,
    check_in: CheckCircle,
    checkin_create: CheckCircle,
    register_child: Baby,
    patient_create: Baby,
    patient_update: Baby,
    create_supply_order: ShoppingCart,
    receive_delivery: ShoppingCart,
    create_medication: Pill,
    medication_create: Pill,
    medication_update: Pill,
    message_send: MessageSquare,
    message_read: MessageSquare,
    conversation_create: MessageSquare,
    payment_create: CreditCard,
    invoice_create: CreditCard,
    invoice_update: CreditCard,
    payment_refund: CreditCard,
    report_generate: Activity,
    report_download: Download,
    system_config_update: Settings,
    user_role_update: Settings,
    login: LogIn,
    user_login: LogIn,
    logout: LogOut,
    user_logout: LogOut,
    register: UserPlus,
    user_register: UserPlus,
    default: Activity
}

const ACTION_COLORS: Record<string, string> = {
    dispense_prescription: 'bg-purple-100 text-purple-700',
    create_prescription: 'bg-purple-100 text-purple-700',
    prescription_create: 'bg-purple-100 text-purple-700',
    prescription_dispense: 'bg-purple-100 text-purple-700',
    create_lab_order: 'bg-blue-100 text-blue-700',
    lab_order_create: 'bg-blue-100 text-blue-700',
    lab_order_complete: 'bg-blue-100 text-blue-700',
    book_appointment: 'bg-emerald-100 text-emerald-700',
    appointment_create: 'bg-emerald-100 text-emerald-700',
    cancel_appointment: 'bg-red-100 text-red-700',
    appointment_cancel: 'bg-red-100 text-red-700',
    check_in: 'bg-green-100 text-green-700',
    checkin_create: 'bg-green-100 text-green-700',
    register_child: 'bg-pink-100 text-pink-700',
    patient_create: 'bg-pink-100 text-pink-700',
    create_supply_order: 'bg-orange-100 text-orange-700',
    receive_delivery: 'bg-teal-100 text-teal-700',
    create_medication: 'bg-indigo-100 text-indigo-700',
    medication_create: 'bg-indigo-100 text-indigo-700',
    message_send: 'bg-sky-100 text-sky-700',
    message_read: 'bg-sky-50 text-sky-600',
    conversation_create: 'bg-sky-100 text-sky-700',
    payment_create: 'bg-amber-100 text-amber-700',
    invoice_create: 'bg-amber-100 text-amber-700',
    payment_refund: 'bg-red-100 text-red-700',
    report_generate: 'bg-violet-100 text-violet-700',
    report_download: 'bg-violet-100 text-violet-700',
    system_config_update: 'bg-slate-200 text-slate-700',
    user_role_update: 'bg-red-100 text-red-700',
    login: 'bg-cyan-100 text-cyan-700',
    user_login: 'bg-cyan-100 text-cyan-700',
    logout: 'bg-slate-100 text-slate-700',
    user_logout: 'bg-slate-100 text-slate-700',
    register: 'bg-green-100 text-green-700',
    user_register: 'bg-green-100 text-green-700',
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
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
    const [refreshing, setRefreshing] = useState(false)
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

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

            if (categoryFilter !== 'all') {
                params.append('action_category', categoryFilter)
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
    }, [searchQuery, categoryFilter, dateFilter])

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

    function exportToCSV() {
        if (logs.length === 0) return

        const headers = ['Timestamp', 'Action', 'Category', 'Description', 'User Email', 'User Role', 'Status', 'Target Table', 'Target ID', 'IP Address', 'Device', 'Browser', 'OS']
        const rows = logs.map(log => [
            new Date(log.created_at).toISOString(),
            log.action,
            log.action_category || '',
            (log.description || '').replace(/,/g, ';'),
            log.user_email || '',
            log.user_role || '',
            log.status || '',
            log.target_table || '',
            log.target_id || '',
            log.ip_address || '',
            log.device_type || '',
            log.browser || '',
            log.os || '',
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const CATEGORY_LABELS: Record<CategoryFilter, string> = {
        all: 'All',
        authentication: 'Auth',
        appointment: 'Appointments',
        patient: 'Patients',
        prescription: 'Prescriptions',
        lab: 'Lab',
        pharmacy: 'Pharmacy',
        chat: 'Messages',
        report: 'Reports',
        finance: 'Finance',
        system: 'System',
    }

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-6" role="status" aria-label="Loading activity logs">
                <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
                <span className="sr-only">Loading activity logs, please wait.</span>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-3xl font-bold text-slate-900">Activity History</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">Complete audit trail of all system events</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={logs.length === 0}
                        className="gap-2 flex-1 sm:flex-initial"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-2 flex-1 sm:flex-initial"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Card className="border-slate-100">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100">
                                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-xs text-slate-500">Total Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100">
                                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-slate-900">{stats.today}</p>
                                <p className="text-xs text-slate-500">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-lg sm:text-2xl font-bold text-slate-900">{Object.keys(stats.byRole).length}</p>
                                <p className="text-xs text-slate-500">Active Roles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-100">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100">
                                <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm sm:text-lg font-bold text-slate-900 truncate">
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
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search activity..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search activity logs"
                                className="pl-10"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter - Horizontal scroll on mobile */}
                        <div className="overflow-x-auto -mx-3 px-3 pb-1">
                            <div className="flex gap-2 w-max" role="group" aria-label="Filter by category">
                                {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategoryFilter(cat)}
                                        aria-pressed={categoryFilter === cat}
                                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {CATEGORY_LABELS[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="flex gap-2" role="group" aria-label="Filter by date range">
                            {(['all', 'today', 'week', 'month'] as const).map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => setDateFilter(period)}
                                    aria-pressed={dateFilter === period}
                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex-1 transition-all ${dateFilter === period
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
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                        <span className="hidden sm:inline">Event Timeline</span>
                        <span className="sm:hidden">Timeline</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {logs.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {logs.length === 0 ? (
                        <div className="py-12 sm:py-16 text-center" role="status" aria-label="No activity logs found">
                            <Activity className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium text-sm sm:text-base">No activity logs found</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1">Activity will appear here as users interact</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="sticky top-0 bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-100">
                                        <h2 className="text-xs sm:text-sm font-semibold text-slate-700">{date}</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400">{dateLogs.length} event{dateLogs.length !== 1 ? 's' : ''}</p>
                                    </div>

                                    {/* Events for this date */}
                                    {dateLogs.map((log) => {
                                        const Icon = getActionIcon(log.action)
                                        const colorClass = getActionColor(log.action)
                                        const roleColor = ROLE_COLORS[log.user_role || ''] || 'bg-slate-100 text-slate-600'
                                        const isExpanded = expandedLogId === log.id

                                        return (
                                            <div
                                                key={log.id}
                                                className={`transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <button
                                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                    className="flex items-start gap-3 p-3 sm:p-4 w-full text-left"
                                                    aria-expanded={isExpanded}
                                                    aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${formatActionName(log.action)}`}
                                                >
                                                    {/* Icon */}
                                                    <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${colorClass}`}>
                                                        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-slate-900 text-xs sm:text-sm">
                                                                    {formatActionName(log.action)}
                                                                </p>
                                                                {log.description && (
                                                                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                                                        {log.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className="text-[10px] sm:text-xs text-slate-400">
                                                                    {formatTime(log.created_at)}
                                                                </span>
                                                                {isExpanded ? (
                                                                    <ChevronUp className="h-3 w-3 text-slate-400" />
                                                                ) : (
                                                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* User info */}
                                                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                                                            {log.user_email && (
                                                                <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 truncate max-w-30 sm:max-w-none">
                                                                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                                                    <span className="truncate">{log.user_email}</span>
                                                                </span>
                                                            )}
                                                            {log.user_role && (
                                                                <Badge className={`text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 ${roleColor}`}>
                                                                    {log.user_role}
                                                                </Badge>
                                                            )}
                                                            {log.status && log.status !== 'success' && (
                                                                <Badge className="text-[10px] sm:text-xs px-1.5 py-0 bg-red-100 text-red-700">
                                                                    {log.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Expanded Detail Panel */}
                                                {isExpanded && (
                                                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 ml-8 sm:ml-12 border-l-2 border-indigo-200">
                                                        <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4 space-y-3 text-xs sm:text-sm">
                                                            {/* Grid of key details */}
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                                                {log.action_category && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Category</p>
                                                                        <p className="text-slate-700 capitalize">{log.action_category}</p>
                                                                    </div>
                                                                )}
                                                                {log.action_type && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type</p>
                                                                        <p className="text-slate-700 capitalize">{log.action_type}</p>
                                                                    </div>
                                                                )}
                                                                {log.target_table && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Table</p>
                                                                        <p className="text-slate-700 font-mono text-xs">{log.target_table}</p>
                                                                    </div>
                                                                )}
                                                                {log.target_id && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target ID</p>
                                                                        <p className="text-slate-700 font-mono text-xs truncate">{log.target_id}</p>
                                                                    </div>
                                                                )}
                                                                {log.resource_name && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Resource</p>
                                                                        <p className="text-slate-700">{log.resource_name}</p>
                                                                    </div>
                                                                )}
                                                                {log.ip_address && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">IP Address</p>
                                                                        <p className="text-slate-700 font-mono text-xs">{log.ip_address}</p>
                                                                    </div>
                                                                )}
                                                                {log.device_type && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Device</p>
                                                                        <p className="text-slate-700 capitalize">{log.device_type}</p>
                                                                    </div>
                                                                )}
                                                                {log.browser && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Browser</p>
                                                                        <p className="text-slate-700">{log.browser}</p>
                                                                    </div>
                                                                )}
                                                                {log.os && (
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">OS</p>
                                                                        <p className="text-slate-700">{log.os}</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Error message if present */}
                                                            {log.error_message && (
                                                                <div className="rounded-lg bg-red-50 border border-red-200 p-2">
                                                                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">Error</p>
                                                                    <p className="text-red-700 text-xs font-mono">{log.error_message}</p>
                                                                </div>
                                                            )}

                                                            {/* Message content if this is a chat log */}
                                                            {log.metadata?.content_preview && (
                                                                <div className="rounded-lg bg-sky-50 border border-sky-200 p-2">
                                                                    <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider mb-1">Message Content</p>
                                                                    <p className="text-sky-900 text-xs whitespace-pre-wrap">{log.metadata.content_preview}</p>
                                                                    {log.metadata.content_length > 200 && (
                                                                        <p className="text-[10px] text-sky-400 mt-1">...truncated ({log.metadata.content_length} chars total)</p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Changes if present */}
                                                            {log.changes && Object.keys(log.changes).length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Changes</p>
                                                                    <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2 overflow-x-auto font-mono max-h-40 overflow-y-auto">
                                                                        {JSON.stringify(log.changes, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            {/* Full metadata (collapsed) */}
                                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                                <details className="group">
                                                                    <summary className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors">
                                                                        Raw Metadata
                                                                    </summary>
                                                                    <pre className="mt-1 text-xs text-slate-600 bg-slate-50 rounded-lg p-2 overflow-x-auto font-mono max-h-48 overflow-y-auto">
                                                                        {JSON.stringify(log.metadata, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-slate-100 bg-slate-50">
                            <p className="text-xs sm:text-sm text-slate-500">
                                <span className="hidden sm:inline">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
                                <span className="sm:hidden">{pagination.page}/{pagination.totalPages}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    aria-label="Go to previous page"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    aria-label="Go to next page"
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
