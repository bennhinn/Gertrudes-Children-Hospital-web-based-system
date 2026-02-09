'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Share2, Calendar, User, FileText, Clock, AlertTriangle } from 'lucide-react'

interface LabOrderDetails {
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
    reviewed_at: string | null
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
    collected_by: {
        id: string
        profiles: {
            full_name: string
        }
    } | null
    reviewed_by_doctor: {
        id: string
        profiles: {
            full_name: string
        }
    } | null
}

export default function LabResultDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<LabOrderDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadOrderDetails() {
            try {
                const supabase = createClient()

                const { data, error } = await supabase
                    .from('lab_orders')
                    .select(`
                        *,
                        child:children(id, full_name, date_of_birth, gender),
                        doctor:doctors!lab_orders_doctor_id_fkey(
                            id,
                            profiles(full_name)
                        ),
                        collected_by:lab_technicians!lab_orders_collected_by_fkey(
                            id,
                            profiles(full_name)
                        ),
                        reviewed_by_doctor:doctors!lab_orders_reviewed_by_fkey(
                            id,
                            profiles(full_name)
                        )
                    `)
                    .eq('id', params.id)
                    .single()

                if (error) throw error

                setOrder(data as LabOrderDetails)
            } catch (error) {
                console.error('Error loading order details:', error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            loadOrderDetails()
        }
    }, [params.id])

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
            return months <= 1 ? 'Less than 1 month' : `${months} months`
        }
        return `${age} year${age === 1 ? '' : 's'}`
    }

    function formatDateTime(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatDateOnly(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    function getTurnaroundTime() {
        if (!order?.ordered_at || !order?.completed_at) return null
        
        const ordered = new Date(order.ordered_at)
        const completed = new Date(order.completed_at)
        const diffMs = completed.getTime() - ordered.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        
        if (diffHours < 1) return `${diffMins} minutes`
        if (diffHours < 24) return `${diffHours} hours ${diffMins} minutes`
        
        const diffDays = Math.floor(diffHours / 24)
        const remainingHours = diffHours % 24
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading test results...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Test not found</h2>
                <p className="text-slate-600 mb-6">The requested lab test could not be found.</p>
                <Button onClick={() => router.push('/lab/completed')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Completed Tests
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/lab/completed')}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            {order.test_name || order.test_type}
                        </h1>
                        <p className="text-slate-600 mt-1">Test ID: {order.test_code || order.id.slice(0, 8)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => router.push(`/lab/messages?labOrderId=${order.id}&testName=${encodeURIComponent(order.test_name || order.test_type)}`)}
                    >
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`rounded-2xl p-6 ${
                order.abnormal_findings 
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
            }`}>
                <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        order.abnormal_findings
                            ? 'bg-amber-500 text-white'
                            : 'bg-green-500 text-white'
                    }`}>
                        {order.abnormal_findings ? (
                            <AlertTriangle className="h-6 w-6" />
                        ) : (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${
                            order.abnormal_findings ? 'text-amber-900' : 'text-green-900'
                        }`}>
                            {order.abnormal_findings ? 'Abnormal Results Detected' : 'Test Completed Successfully'}
                        </h3>
                        <p className={`text-sm ${
                            order.abnormal_findings ? 'text-amber-700' : 'text-green-700'
                        }`}>
                            {order.abnormal_findings 
                                ? 'This test contains abnormal findings. Please review with your doctor.'
                                : 'All results are within normal ranges.'
                            }
                        </p>
                        {order.reviewed_at && (
                            <p className={`text-sm mt-1 ${
                                order.abnormal_findings ? 'text-amber-600' : 'text-green-600'
                            }`}>
                                ✓ Reviewed by Dr. {order.reviewed_by_doctor?.profiles.full_name} on {formatDateOnly(order.reviewed_at)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Test Results */}
                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Test Results
                        </h2>
                        
                        {order.results ? (
                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="text-sm font-medium text-slate-700 mb-2">Results</h3>
                                    <p className="text-lg font-semibold text-slate-900 whitespace-pre-wrap">
                                        {order.results}
                                    </p>
                                </div>

                                {order.result_notes && (
                                    <div className="rounded-xl bg-blue-50 p-4">
                                        <h3 className="text-sm font-medium text-blue-900 mb-2">Lab Notes</h3>
                                        <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                            {order.result_notes}
                                        </p>
                                    </div>
                                )}

                                {order.abnormal_findings && (
                                    <div className="rounded-xl bg-amber-50 p-4 border-2 border-amber-200">
                                        <h3 className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Abnormal Findings
                                        </h3>
                                        <p className="text-sm text-amber-800 whitespace-pre-wrap">
                                            {order.abnormal_findings}
                                        </p>
                                    </div>
                                )}

                                {order.clinical_notes && (
                                    <div className="rounded-xl bg-purple-50 p-4">
                                        <h3 className="text-sm font-medium text-purple-900 mb-2">Clinical Notes</h3>
                                        <p className="text-sm text-purple-800 whitespace-pre-wrap">
                                            {order.clinical_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                                <p>No detailed results available</p>
                            </div>
                        )}
                    </div>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                        <div className="bg-white rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Special Instructions</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{order.special_instructions}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Patient & Timeline */}
                <div className="space-y-6">
                    {/* Patient Information */}
                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Patient Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-slate-600">Name</p>
                                <p className="font-semibold text-slate-900">{order.child?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Age</p>
                                <p className="font-semibold text-slate-900">
                                    {getAge(order.child?.date_of_birth || '')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Gender</p>
                                <p className="font-semibold text-slate-900 capitalize">{order.child?.gender}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Date of Birth</p>
                                <p className="font-semibold text-slate-900">
                                    {formatDateOnly(order.child?.date_of_birth || '')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Details */}
                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Test Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-slate-600">Priority Level</p>
                                <Badge className={`mt-1 ${
                                    order.priority === 'stat' ? 'bg-red-100 text-red-700' :
                                    order.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                } border-0 font-medium`}>
                                    {order.priority.toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Ordered By</p>
                                <p className="font-semibold text-slate-900">
                                    Dr. {order.doctor?.profiles.full_name}
                                </p>
                            </div>
                            {order.collected_by && (
                                <div>
                                    <p className="text-sm text-slate-600">Collected By</p>
                                    <p className="font-semibold text-slate-900">
                                        {order.collected_by.profiles.full_name}
                                    </p>
                                </div>
                            )}
                            {getTurnaroundTime() && (
                                <div>
                                    <p className="text-sm text-slate-600">Turnaround Time</p>
                                    <p className="font-semibold text-slate-900">{getTurnaroundTime()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Timeline
                        </h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Ordered', date: order.ordered_at, icon: '📝' },
                                { label: 'Collected', date: order.collected_at, icon: '🧪' },
                                { label: 'Processing Started', date: order.processing_started_at, icon: '⚙️' },
                                { label: 'Completed', date: order.completed_at, icon: '✅' },
                                { label: 'Reviewed', date: order.reviewed_at, icon: '👨‍⚕️' },
                            ].map((item, index) => (
                                item.date && (
                                    <div key={index} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm">
                                                {item.icon}
                                            </div>
                                            {index < 4 && item.date && (
                                                <div className="w-px h-full bg-slate-200 my-1" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                            <p className="text-xs text-slate-600">{formatDateTime(item.date)}</p>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}