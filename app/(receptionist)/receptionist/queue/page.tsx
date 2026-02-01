'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

interface CheckIn {
    id: string
    checked_in_at: string
    status: string
    queue_number: number
    reason: string
    called_at: string | null
    completed_at: string | null
    appointment: {
        id: string
        child: {
            full_name: string
        }
        caregiver: {
            profiles: {
                full_name: string
                phone: string
            }
        }
    }
}

export default function QueuePage() {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const loadQueue = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let query = supabase
                .from('check_ins')
                .select(`
                    *,
                    appointment:appointments(
                        id,
                        child:children(full_name),
                        caregiver:caregivers(profiles(full_name, phone))
                    )
                `)
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: true })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) throw error
            setCheckIns(data || [])
        } catch (error) {
            console.error('Error loading queue:', error)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        loadQueue()

        const supabase = createClient()
        const channel = supabase
            .channel('queue-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => loadQueue()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadQueue])

    async function updateStatus(checkInId: string, newStatus: string) {
        try {
            const supabase = createClient()
            const updates: Record<string, unknown> = { status: newStatus }

            if (newStatus === 'in_consultation') {
                updates.called_at = new Date().toISOString()
            } else if (newStatus === 'completed') {
                updates.completed_at = new Date().toISOString()
            }

            await supabase
                .from('check_ins')
                .update(updates)
                .eq('id', checkInId)

            loadQueue()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    function getWaitTime(checkedInAt: string) {
        const now = new Date().getTime()
        const checkIn = new Date(checkedInAt).getTime()
        const diff = Math.round((now - checkIn) / 60000)
        if (diff < 1) return 'Just now'
        if (diff === 1) return '1 min'
        if (diff < 60) return `${diff} mins`
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        return `${hours}h ${mins}m`
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'waiting':
                return <Badge variant="yellow">Waiting</Badge>
            case 'in_consultation':
                return <Badge variant="blue">With Doctor</Badge>
            case 'completed':
                return <Badge variant="green">Completed</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    const waitingCount = checkIns.filter(c => c.status === 'waiting').length
    const inConsultationCount = checkIns.filter(c => c.status === 'in_consultation').length
    const completedCount = checkIns.filter(c => c.status === 'completed').length

    // Filter check-ins based on search query
    const filteredCheckIns = useMemo(() => {
        if (!searchQuery.trim()) return checkIns

        const query = searchQuery.toLowerCase()
        return checkIns.filter((checkIn) => {
            const childName = checkIn.appointment?.child?.full_name?.toLowerCase() || ''
            const caregiverName = checkIn.appointment?.caregiver?.profiles?.full_name?.toLowerCase() || ''
            const phone = checkIn.appointment?.caregiver?.profiles?.phone?.toLowerCase() || ''
            const reason = checkIn.reason?.toLowerCase() || ''
            const queueNumber = String(checkIn.queue_number)

            return (
                childName.includes(query) ||
                caregiverName.includes(query) ||
                phone.includes(query) ||
                reason.includes(query) ||
                queueNumber.includes(query)
            )
        })
    }, [checkIns, searchQuery])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 animate-pulse rounded bg-slate-200"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Queue Management</h1>
                    <p className="text-slate-500">
                        {waitingCount} waiting • {inConsultationCount} with doctor • {completedCount} completed
                    </p>
                </div>
                <Link href="/receptionist">
                    <Button variant="ghost">← Back</Button>
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto">
                <Button
                    variant={filter === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All ({checkIns.length})
                </Button>
                <Button
                    variant={filter === 'waiting' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('waiting')}
                >
                    Waiting ({waitingCount})
                </Button>
                <Button
                    variant={filter === 'in_consultation' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('in_consultation')}
                >
                    With Doctor ({inConsultationCount})
                </Button>
                <Button
                    variant={filter === 'completed' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                >
                    Completed ({completedCount})
                </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by patient name, caregiver, phone, reason, or queue #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Search Results Count */}
            {searchQuery && (
                <p className="text-sm text-slate-500">
                    Found {filteredCheckIns.length} of {checkIns.length} patients matching &quot;{searchQuery}&quot;
                </p>
            )}

            {/* Queue List */}
            {filteredCheckIns.length === 0 ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-12 text-center">
                        <p className="text-4xl">{searchQuery ? '🔍' : '📋'}</p>
                        <p className="mt-4 text-lg font-medium text-slate-600">
                            {searchQuery ? 'No matching patients found' : 'No patients in queue'}
                        </p>
                        <p className="text-slate-400">
                            {searchQuery
                                ? 'Try adjusting your search term'
                                : 'Patients will appear here after check-in'}
                        </p>
                        {searchQuery && (
                            <Button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                                Clear Search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredCheckIns.map((checkIn) => (
                        <Card key={checkIn.id} className="border-none shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${checkIn.status === 'waiting'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : checkIn.status === 'in_consultation'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                            #{checkIn.queue_number}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-800">
                                                    {checkIn.appointment?.child?.full_name || 'Unknown'}
                                                </p>
                                                {getStatusBadge(checkIn.status)}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {checkIn.appointment?.caregiver?.profiles?.full_name || 'Unknown'} •
                                                📞 {checkIn.appointment?.caregiver?.profiles?.phone || 'N/A'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {checkIn.reason} • Wait: {getWaitTime(checkIn.checked_in_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {checkIn.status === 'waiting' && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateStatus(checkIn.id, 'in_consultation')}
                                            >
                                                Call Patient
                                            </Button>
                                        )}
                                        {checkIn.status === 'in_consultation' && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => updateStatus(checkIn.id, 'completed')}
                                            >
                                                Mark Complete
                                            </Button>
                                        )}
                                        {checkIn.status === 'waiting' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateStatus(checkIn.id, 'completed')}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}