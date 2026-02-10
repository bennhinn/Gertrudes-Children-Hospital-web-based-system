import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getChildrenByCaregiver, getUpcomingAppointments, getCompletedAppointmentsCount } from '@/lib/db/queries'
import type { Appointment } from '@/types'
import Link from 'next/link'
import {
  QrCode,
  CalendarPlus,
  Baby,
  Calendar,
  CheckCircle,
  ClipboardList,
  Plus,
  Lightbulb,
  Bell,
  Ticket,
  ArrowRight,
  Receipt,
  CreditCard
} from 'lucide-react'
import InvoicesClient from '@/components/caregiver/InvoicesClient'

function statusVariant(status: string) {
  if (status === 'pending') return 'blue' as const
  if (status === 'confirmed') return 'purple' as const
  if (status === 'completed') return 'green' as const
  if (status === 'cancelled') return 'gray' as const
  return 'gray' as const
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getNextAppointment(appointments: Appointment[]) {
  if (!appointments || appointments.length === 0) return null
  return appointments[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  const fullName = (user?.user_metadata as { full_name?: string })?.full_name || 'Caregiver'
  const firstName = fullName.split(' ')[0]

  // Fetch real data
  const [children, appointments, completedCount] = await Promise.all([
    getChildrenByCaregiver(user.id),
    getUpcomingAppointments(user.id),
    getCompletedAppointmentsCount(user.id),
  ])

  // Fetch invoices for caregiver (server-side)
  const { data: invoices = [] } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items(*),
      child:children(*)
    `)
    .eq('caregiver_id', user.id)
    .order('created_at', { ascending: false })

  const nextAppointment = getNextAppointment(appointments)
  const upcomingCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length

  return (
    <main className="space-y-4 pb-6 lg:space-y-8 lg:pb-8">
      {/* Hero section - Mobile optimized */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6 lg:rounded-3xl lg:p-10">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-40 sm:w-40 lg:h-64 lg:w-64" aria-hidden="true" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl sm:-left-12 sm:-bottom-12 sm:h-48 sm:w-48 lg:-left-20 lg:-bottom-20 lg:h-96 lg:w-96" aria-hidden="true" />

        <div className="relative">
          {/* Status-first messaging - Mobile optimized */}
          {upcomingCount > 0 ? (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">Next Appointment</span>
              </div>

              <h1 className="mb-1.5 text-xl font-bold tracking-tight sm:mb-2 sm:text-2xl lg:text-4xl">
                {nextAppointment?.child?.full_name || 'Upcoming Visit'}
              </h1>

              {nextAppointment?.scheduled_for && (
                <p className="text-sm text-white/90 sm:text-base lg:text-lg">
                  {new Date(nextAppointment.scheduled_for).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {' at '}
                  {new Date(nextAppointment.scheduled_for).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">Quick Actions</span>
              </div>

              <h1 className="mb-1.5 text-xl font-bold tracking-tight sm:mb-2 sm:text-2xl lg:text-4xl">
                Ready to schedule?
              </h1>

              <p className="text-sm text-white/90 sm:text-base lg:text-lg">
                Book your child's next appointment in less than a minute
              </p>
            </div>
          )}

          {/* Mobile-optimized action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            {nextAppointment?.scheduled_for ? (
              <>
                <Link href={`/caregiver-appointments?viewQR=${nextAppointment.id}`} className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl">
                    <QrCode className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">View QR Code</span>
                  </Button>
                </Link>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20"
                  >
                    <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Book Another</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl">
                    <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Book Appointment</span>
                  </Button>
                </Link>
                <Link href="/patients" className="w-full sm:w-auto sm:flex-1">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20"
                  >
                    <Baby className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Add Child Profile</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid - Mobile optimized */}
      <section className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Children Stat */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md sm:p-5 lg:rounded-3xl lg:p-8">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-50 transition-transform group-hover:scale-110 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative space-y-2 sm:space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14 lg:rounded-2xl">
              <Baby className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </div>
            <div className="space-y-0.5 lg:space-y-1">
              <p className="text-[10px] font-medium text-slate-600 sm:text-xs lg:text-sm">Children</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl lg:text-4xl">{children.length}</p>
              <p className="text-[10px] text-slate-500 sm:text-xs lg:text-sm line-clamp-1">
                {children.length === 0 ? 'Add your first child' : `Registered profile${children.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md sm:p-5 lg:rounded-3xl lg:p-8">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-50 transition-transform group-hover:scale-110 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative space-y-2 sm:space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14 lg:rounded-2xl">
              <Calendar className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </div>
            <div className="space-y-0.5 lg:space-y-1">
              <p className="text-[10px] font-medium text-slate-600 sm:text-xs lg:text-sm">Upcoming</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl lg:text-4xl">{upcomingCount}</p>
              <p className="text-[10px] text-slate-500 sm:text-xs lg:text-sm line-clamp-1">
                {upcomingCount === 0 ? 'No visits scheduled' : 'Next 30 days'}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Visits */}
        <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md col-span-2 sm:p-5 lg:col-span-1 lg:rounded-3xl lg:p-8">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-50 transition-transform group-hover:scale-110 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative space-y-2 sm:space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14 lg:rounded-2xl">
              <CheckCircle className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </div>
            <div className="space-y-0.5 lg:space-y-1">
              <p className="text-[10px] font-medium text-slate-600 sm:text-xs lg:text-sm">Completed</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl lg:text-4xl">{completedCount}</p>
              <p className="text-[10px] text-slate-500 sm:text-xs lg:text-sm line-clamp-1">
                {completedCount === 0 ? 'Start your journey' : 'Total visits'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appointments Section - Mobile optimized */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5 lg:rounded-3xl lg:p-8">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">Your Appointments</h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:mt-1 lg:text-sm">Manage your family's healthcare visits</p>
          </div>
          <Link href="/caregiver-appointments" className="w-full sm:w-auto">
            <Button className="w-full shadow-sm sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">New Appointment</span>
            </Button>
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 text-center sm:rounded-2xl sm:p-8 lg:p-12">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 sm:mb-4 sm:h-16 sm:w-16 lg:mb-5 lg:h-20 lg:w-20 lg:rounded-3xl">
              <ClipboardList className="h-7 w-7 text-slate-400 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
            </div>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900 sm:mb-2 sm:text-lg lg:text-xl">No appointments yet</h3>
            <p className="mx-auto mb-4 max-w-md text-xs text-slate-600 leading-relaxed sm:mb-5 sm:text-sm lg:mb-6">
              Ready to schedule your first visit? It only takes a minute to book an appointment for your child.
            </p>
            <Link href="/caregiver-appointments">
              <Button size="lg" className="shadow-md">
                <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Schedule First Appointment</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="group flex flex-col gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/20 p-3 ring-1 ring-slate-900/5 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4 lg:p-5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-base font-bold text-white shadow-md shadow-blue-500/25 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg lg:h-14 lg:w-14 lg:rounded-2xl lg:text-xl">
                    {apt.child?.full_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                    <p className="text-sm font-semibold text-slate-900 truncate sm:text-base">
                      {apt.child?.full_name || 'Unknown Child'}
                    </p>
                    <p className="text-xs text-slate-600 truncate sm:text-sm">
                      {apt.scheduled_for ? formatDateTime(apt.scheduled_for) : 'No date scheduled'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
                  <Badge variant={statusVariant(apt.status)} className="capitalize text-xs">
                    {apt.status}
                  </Badge>

                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <Link href={`/caregiver-appointments?viewQR=${apt.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs transition-all hover:bg-blue-50 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <span className="hidden sm:inline">QR Code</span>
                        <span className="sm:hidden">QR</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
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
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payments Section - Completely redesigned for mobile */}
      <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden sm:rounded-2xl lg:rounded-3xl">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 sm:h-12 sm:w-12 lg:h-14 lg:w-14 lg:rounded-2xl">
                <Receipt className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white sm:text-xl lg:text-2xl">Billing & Payments</h2>
                <p className="mt-0.5 text-xs text-white/90 sm:mt-1 sm:text-sm lg:text-base">
                  Manage invoices and payment history
                </p>
              </div>
            </div>
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12 lg:h-14 lg:w-14 lg:rounded-2xl">
              <CreditCard className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </div>
          </div>
        </div>

        {/* Content area with better mobile padding */}
        <div className="p-4 sm:p-5 lg:p-8">
          <InvoicesClient initialInvoices={invoices || []} caregiverId={user.id} />
        </div>
      </section>

      {/* Tips Section - Mobile optimized */}
      <section className="rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 shadow-sm ring-1 ring-purple-200/50 sm:p-5 sm:rounded-2xl lg:rounded-3xl lg:p-8">
        <div className="mb-3 flex items-start justify-between sm:mb-4 lg:mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">Quick Tips</h2>
            <p className="mt-0.5 text-[10px] text-slate-600 sm:text-xs lg:mt-1 lg:text-sm">Getting the most from your dashboard</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center sm:h-10 sm:w-10 sm:rounded-xl lg:h-12 lg:w-12">
            <Lightbulb className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3 backdrop-blur-sm ring-1 ring-white/50 sm:gap-3 sm:rounded-2xl sm:p-4">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 sm:h-10 sm:w-10 sm:rounded-xl">
              <Bell className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 text-xs mb-0.5 sm:mb-1 sm:text-sm">Never miss a visit</p>
              <p className="text-[10px] text-slate-600 leading-relaxed sm:text-xs">
                Enable appointment reminders to get notified before each visit
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3 backdrop-blur-sm ring-1 ring-white/50 sm:gap-3 sm:rounded-2xl sm:p-4">
            <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 sm:h-10 sm:w-10 sm:rounded-xl">
              <Ticket className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 text-xs mb-0.5 sm:mb-1 sm:text-sm">Faster check-ins</p>
              <p className="text-[10px] text-slate-600 leading-relaxed sm:text-xs">
                Save QR codes to your phone for quick access at appointments
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}