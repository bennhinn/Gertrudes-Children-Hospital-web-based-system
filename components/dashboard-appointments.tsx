'use client'

// Dashboard Appointments Section with Integrated Search
// This wraps the appointments list and adds search functionality

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import type { Appointment } from '@/types'

interface DashboardAppointmentsProps {
  appointments: Appointment[]
  formatDateTime: (date: string) => string
  statusVariant: (status: string) => 'blue' | 'purple' | 'green' | 'gray'
}

export function DashboardAppointments({
  appointments,
  formatDateTime,
  statusVariant
}: DashboardAppointmentsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter appointments based on search and filters
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(apt => {
        // Search in child name
        const childName = apt.child?.full_name?.toLowerCase() || ''
        if (childName.includes(query)) return true

        // Search in status
        if (apt.status.toLowerCase().includes(query)) return true

        // Search in date
        const dateStr = apt.scheduled_for ? formatDateTime(apt.scheduled_for).toLowerCase() : ''
        if (dateStr.includes(query)) return true

        // (Removed search in reason because Appointment has no 'reason' property)

        return false
      })
    }

    return filtered
  }, [appointments, searchQuery, statusFilter, formatDateTime])

  const handleClearSearch = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:rounded-3xl lg:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Your Appointments</h2>
          <p className="mt-1 text-xs text-slate-600 lg:text-sm">Search and manage your family's healthcare visits</p>
        </div>
        <Link href="/caregiver-appointments" className="w-full sm:w-auto">
          <Button className="w-full shadow-sm sm:w-auto">
            <span className="mr-2">➕</span>
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Search Bar - Only show if there are appointments */}
      {appointments.length > 0 && (
        <div className="mb-5 space-y-3 lg:mb-6">
          {/* Search Input */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by child name, date, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 h-11 text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 lg:h-12 lg:text-base"
                aria-label="Search appointments"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-8 w-8 p-0"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-8 px-2 ${showFilters ? 'bg-slate-100' : ''}`}
                  aria-label="Toggle filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Status */}
            {(searchQuery || statusFilter !== 'all') && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  Showing {filteredAppointments.length} of {appointments.length} appointments
                </span>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Filter by Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No appointments at all */}
      {appointments.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-8 text-center lg:rounded-2xl lg:p-12">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm ring-1 ring-slate-900/5 lg:mb-5 lg:h-20 lg:w-20 lg:text-4xl">
            📋
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900 lg:text-xl">No appointments yet</h3>
          <p className="mx-auto mb-5 max-w-md text-sm text-slate-600 leading-relaxed lg:mb-6">
            Ready to schedule your first visit? It only takes a minute to book an appointment for your child.
          </p>
          <Link href="/caregiver-appointments">
            <Button size="lg" className="shadow-md">
              <span className="mr-2">📅</span>
              Schedule First Appointment
            </Button>
          </Link>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State - No search results */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center lg:p-12">
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No appointments found
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Try adjusting your search or filters
          </p>
          <Button
            variant="ghost"
            onClick={handleClearSearch}
            className="text-sm"
          >
            Clear search
          </Button>
        </div>
      ) : (
        /* Appointments List */
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="group flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/20 p-4 ring-1 ring-slate-900/5 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:p-5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white shadow-md shadow-blue-500/25 lg:h-14 lg:w-14 lg:rounded-2xl lg:text-xl">
                  {apt.child?.full_name?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-slate-900 truncate lg:text-base">
                    {apt.child?.full_name || 'Unknown Child'}
                  </p>
                  <p className="text-xs text-slate-600 lg:text-sm">
                    {apt.scheduled_for ? formatDateTime(apt.scheduled_for) : 'No date scheduled'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Badge variant={statusVariant(apt.status)} className="capitalize">
                  {apt.status}
                </Badge>

                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <Link href={`/caregiver-appointments?viewQR=${apt.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs transition-all hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      QR Code
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>
                )}

                {(apt.status === 'completed' || apt.status === 'cancelled') && (
                  <Link href="/caregiver-appointments">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs transition-all hover:bg-slate-50 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      Details
                      <span className="ml-1">→</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
