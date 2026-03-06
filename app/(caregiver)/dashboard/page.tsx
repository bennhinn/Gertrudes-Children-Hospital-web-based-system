import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer } from '@/lib/activity-logger'
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
  CreditCard,
  ChevronRight,
  AlertCircle,
  Clock
} from 'lucide-react'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'blue' | 'purple' | 'green' | 'gray' | 'red' | 'yellow' | null | undefined

function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'blue',
    confirmed: 'purple',
    completed: 'green',
    cancelled: 'gray',
    missed: 'red',
    'in-progress': 'yellow'
  }
  return map[status] ?? 'gray'
}

// UPDATED: Shillings currency formatter
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Alternative simple format:
// function formatCurrency(amount: number): string {
//   return `KES ${amount.toLocaleString('en-KE')}`
// }

function formatDateTime(dateString: string | null | undefined, opts: { time?: boolean; weekday?: boolean } = {}): string {
  if (!dateString) return 'Not scheduled'

  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(opts.weekday && { weekday: 'long' }),
    ...(opts.time && { hour: 'numeric', minute: '2-digit' }),
    ...(!opts.time && { year: 'numeric' })
  })
}

function getTimeUntil(dateString: string | null | undefined): string {
  if (!dateString) return 'Not scheduled'

  const now = new Date()
  const then = new Date(dateString)
  const diffMs = then.getTime() - now.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHrs / 24)

  if (diffHrs < 0) return 'Started'
  if (diffHrs < 1) return 'Starting soon'
  if (diffHrs < 24) return `In ${diffHrs} hour${diffHrs !== 1 ? 's' : ''}`
  if (diffDays === 1) return 'Tomorrow'
  return `In ${diffDays} days`
}

function groupAppointmentsByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: []
  }

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  appointments.forEach(apt => {
    if (!apt.scheduled_for) {
      groups.later.push(apt)
      return
    }

    const aptDate = new Date(apt.scheduled_for)
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()

    if (isSameDay(aptDate, now)) {
      groups.today.push(apt)
    } else if (isSameDay(aptDate, tomorrow)) {
      groups.tomorrow.push(apt)
    } else if (aptDate < weekFromNow) {
      groups.thisWeek.push(apt)
    } else {
      groups.later.push(apt)
    }
  })

  return groups
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  // Log caregiver dashboard view (server-side)
  try {
    await logActivityServer(supabase, {
      user_id: user.id,
      user_email: user.email,
      user_role: (user.user_metadata as any)?.role || null,
      action: 'caregiver_dashboard_view',
      resource_name: 'caregiver_dashboard',
      description: `Caregiver ${user.id} viewed dashboard`
    }, { autoUser: false })
  } catch (e) {
    // ignore logging errors
  }

  const fullName = (user?.user_metadata as { full_name?: string })?.full_name || 'Caregiver'
  const firstName = fullName.split(' ')[0]

  // Fetch data
  const [children, appointments, completedCount] = await Promise.all([
    getChildrenByCaregiver(user.id),
    getUpcomingAppointments(user.id),
    getCompletedAppointmentsCount(user.id)
  ])

  // Fetch only billing summary
  const { data: billingSummary } = await supabase
    .from('invoices')
    .select('status, total, created_at')
    .eq('caregiver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const outstandingTotal = billingSummary
    ?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

  const recentInvoices = billingSummary?.slice(0, 3) || []
  const unpaidCount = billingSummary?.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length || 0

  const nextAppointment = appointments[0] || null
  const upcomingCount = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length
  const appointmentGroups = groupAppointmentsByDate(appointments)

  return (
    <main className="space-y-4 pb-6 lg:space-y-8 lg:pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-linear-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 text-white shadow-lg sm:rounded-2xl sm:p-6 lg:rounded-3xl lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl motion-safe:animate-pulse sm:h-40 sm:w-40 lg:h-64 lg:w-64" style={{ animationDuration: '4s' }} aria-hidden="true" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl motion-safe:animate-pulse sm:-left-12 sm:-bottom-12 sm:h-48 sm:w-48 lg:-left-20 lg:-bottom-20 lg:h-96 lg:w-96" style={{ animationDuration: '5s' }} aria-hidden="true" />

        <div className="relative">
          {nextAppointment ? (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {getTimeUntil(nextAppointment.scheduled_for)}
                </span>
              </div>

              <h1 className="mb-1.5 text-xl font-extrabold tracking-tight text-white sm:mb-2 sm:text-2xl lg:text-4xl">
                {nextAppointment.child?.full_name || 'Upcoming Visit'}
              </h1>

              {nextAppointment.scheduled_for && (
                <p className="text-sm text-white/90 sm:text-base lg:text-lg">
                  {formatDateTime(nextAppointment.scheduled_for, { weekday: true })}
                  {' at '}
                  {formatDateTime(nextAppointment.scheduled_for, { time: true })}
                </p>
              )}

              {nextAppointment.scheduled_for &&
                new Date(nextAppointment.scheduled_for).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-amber-950">
                    <Clock className="h-3 w-3" />
                    Starting soon - Prepare QR code
                  </div>
                )}
            </div>
          ) : (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">Quick Actions</span>
              </div>

              <h1 className="mb-1.5 text-xl font-extrabold tracking-tight text-white sm:mb-2 sm:text-3xl lg:text-4xl">
                Welcome back, {firstName}
              </h1>

              <p className="text-sm text-white/90 sm:text-base lg:text-lg">
                Ready to schedule your next appointment?
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            {nextAppointment ? (
              <>
                <Link href={`/caregiver-appointments?viewQR=${nextAppointment.id}`} className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
                    <QrCode className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">View QR Code</span>
                  </Button>
                </Link>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" variant="ghost" className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 active:scale-95 transition-transform">
                    <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Book Another</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
                    <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Book Appointment</span>
                  </Button>
                </Link>
                <Link href="/patients" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" variant="ghost" className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 active:scale-95 transition-transform">
                    <Baby className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">Add Child</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          icon={Baby}
          label="Children"
          value={children.length}
          subtext={children.length === 0 ? 'Add your first' : `Profile${children.length === 1 ? '' : 's'}`}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming"
          value={upcomingCount}
          subtext={upcomingCount === 0 ? 'No visits scheduled' : 'Next 30 days'}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          subtext={completedCount === 0 ? 'Start your journey' : 'Total visits'}
          color="emerald"
        />
        {/* UPDATED: Shillings format for outstanding */}
        <StatCard
          icon={Receipt}
          label="Outstanding"
          value={formatCurrency(outstandingTotal)}
          subtext={unpaidCount > 0 ? `${unpaidCount} unpaid invoice${unpaidCount !== 1 ? 's' : ''}` : 'All paid up'}
          color="amber"
        />
      </section>

      {/* Billing Alert */}
      {unpaidCount > 0 && (
        <section className="rounded-xl border-l-4 border-amber-400 bg-linear-to-r from-amber-50 to-orange-50 p-4 shadow-sm ring-1 ring-amber-200/50 transition-all active:scale-[0.98] sm:p-5 lg:rounded-3xl lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600 motion-safe:animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Payment Required</h3>
                {/* UPDATED: Shillings format */}
                <p className="text-sm text-slate-600">
                  You have {unpaidCount} outstanding invoice{unpaidCount !== 1 ? 's' : ''} totaling {formatCurrency(outstandingTotal)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/billing" className="flex-1 sm:flex-none">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Pay Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Appointments Section */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5 lg:rounded-3xl lg:p-8">
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Your Appointments</h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">Manage your family&apos;s healthcare visits</p>
          </div>
          <Link href="/caregiver-appointments" className="w-full sm:w-auto">
            <Button className="w-full shadow-sm sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">New Appointment</span>
            </Button>
          </Link>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No appointments yet"
            description="Ready to schedule your first visit? It only takes a minute to book an appointment for your child."
            action={
              <Link href="/caregiver-appointments">
                <Button size="lg" className="shadow-md">
                  <CalendarPlus className="h-4 w-4 mr-2 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Schedule First Appointment</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {appointmentGroups.today.length > 0 && (
              <AppointmentGroup title="Today" appointments={appointmentGroups.today} isUrgent />
            )}
            {appointmentGroups.tomorrow.length > 0 && (
              <AppointmentGroup title="Tomorrow" appointments={appointmentGroups.tomorrow} />
            )}
            {appointmentGroups.thisWeek.length > 0 && (
              <AppointmentGroup title="This Week" appointments={appointmentGroups.thisWeek} />
            )}
            {appointmentGroups.later.length > 0 && (
              <AppointmentGroup title="Upcoming" appointments={appointmentGroups.later} />
            )}
          </div>
        )}
      </section>

      {/* Billing Summary */}
      <section className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden sm:rounded-2xl lg:rounded-3xl">
        <div className="bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 sm:h-12 sm:w-12 lg:h-14 lg:w-14 lg:rounded-2xl">
                <Receipt className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white sm:text-xl lg:text-2xl">Billing Summary</h2>
                {/* UPDATED: Shillings format */}
                <p className="mt-0.5 text-xs text-white/85 sm:mt-1 sm:text-sm lg:text-base">
                  {unpaidCount > 0 ? `${formatCurrency(outstandingTotal)} outstanding` : 'All payments up to date'}
                </p>
              </div>
            </div>
            <Link href="/billing">
              <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          {recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.map((invoice, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {invoice.status === 'paid' ? 'Payment Received' : 'Invoice Issued'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoice.created_at ? formatDateTime(invoice.created_at) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  {/* UPDATED: Shillings format */}
                  <span className={`text-sm font-semibold ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {invoice.status === 'paid' ? '+' : ''}{formatCurrency(invoice.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No recent billing activity</p>
            </div>
          )}

          <Link href="/billing" className="mt-4 block">
            <Button variant="secondary" className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Payments & Invoices
            </Button>
          </Link>
        </div>
      </section>

      {/* Tips Section */}
      <section className="rounded-xl bg-linear-to-r from-slate-50 to-blue-50/40 p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-5 sm:rounded-2xl lg:rounded-3xl lg:p-8">
        <div className="mb-3 flex items-start justify-between sm:mb-4 lg:mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Quick Tips</h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm lg:mt-1">Getting the most from your dashboard</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-linear-to-br from-amber-100 to-yellow-100 flex items-center justify-center sm:h-10 sm:w-10 sm:rounded-xl lg:h-12 lg:w-12">
            <Lightbulb className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          <TipCard
            icon={Bell}
            title="Never miss a visit"
            description="Enable appointment reminders to get notified before each visit"
            color="blue"
          />
          <TipCard
            icon={Ticket}
            title="Faster check-ins"
            description="Save QR codes to your phone for quick access at appointments"
            color="purple"
          />
        </div>
      </section>
    </main>
  )
}

// Sub-components remain the same...

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext: string
  color: 'blue' | 'purple' | 'emerald' | 'amber'
}) {
  const theme = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/25',
      blob: 'bg-blue-100/60',
      cardBg: 'bg-linear-to-br from-white via-white to-blue-50/80',
      num: 'text-blue-600',
      label: 'text-blue-900',
      sub: 'text-blue-400',
      ring: 'ring-blue-100',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/25',
      blob: 'bg-purple-100/60',
      cardBg: 'bg-linear-to-br from-white via-white to-purple-50/80',
      num: 'text-purple-600',
      label: 'text-purple-900',
      sub: 'text-purple-400',
      ring: 'ring-purple-100',
    },
    emerald: {
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/25',
      blob: 'bg-emerald-100/60',
      cardBg: 'bg-linear-to-br from-white via-white to-emerald-50/80',
      num: 'text-emerald-600',
      label: 'text-emerald-900',
      sub: 'text-emerald-400',
      ring: 'ring-emerald-100',
    },
    amber: {
      gradient: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/25',
      blob: 'bg-amber-100/60',
      cardBg: 'bg-linear-to-br from-white via-white to-amber-50/80',
      num: 'text-amber-600',
      label: 'text-amber-900',
      sub: 'text-amber-400',
      ring: 'ring-amber-100',
    },
  }
  const t = theme[color]

  return (
    <div className={`group relative overflow-hidden rounded-xl ${t.cardBg} p-4 shadow-sm ring-1 ${t.ring} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95 active:shadow-md sm:p-5 lg:rounded-3xl lg:p-8`}>
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full transition-transform duration-500 group-hover:scale-125 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32 ${t.blob}`} aria-hidden="true" />
      <div className="relative space-y-2 sm:space-y-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${t.gradient} ${t.shadow} shadow-lg transition-transform duration-200 group-hover:scale-110 group-active:rotate-[-8deg] group-active:scale-110 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14 lg:rounded-2xl`}>
          <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
        </div>
        <div className="space-y-0.5 lg:space-y-1">
          <p className={`text-xs font-semibold ${t.label} sm:text-xs lg:text-sm`}>{label}</p>
          <p className={`text-2xl font-bold ${t.num} tracking-tight sm:text-3xl lg:text-4xl`}>{value}</p>
          <p className={`text-xs font-medium ${t.sub} sm:text-xs lg:text-sm line-clamp-1`}>{subtext}</p>
        </div>
      </div>
    </div>
  )
}

function AppointmentGroup({
  title,
  appointments,
  isUrgent
}: {
  title: string
  appointments: Appointment[]
  isUrgent?: boolean
}) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isUrgent ? 'text-red-600' : 'text-slate-500'}`}>
        {title}
        {isUrgent && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {appointments.map((apt) => (
          <AppointmentRow key={apt.id} appointment={apt} />
        ))}
      </div>
    </div>
  )
}

function AppointmentRow({ appointment: apt }: { appointment: Appointment }) {
  const isActionable = ['pending', 'confirmed'].includes(apt.status)
  const isPast = ['completed', 'cancelled', 'missed'].includes(apt.status)

  return (
    <div className="group flex flex-col gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100 transition-all duration-200 hover:ring-blue-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4 lg:p-5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100 sm:h-12 sm:w-12 sm:rounded-xl">
          <span className="text-base font-bold leading-none text-blue-600 sm:text-lg">
            {apt.scheduled_for ? new Date(apt.scheduled_for).getDate() : '?'}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-blue-400 sm:text-[10px]">
            {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleString('en-US', { month: 'short' }) : ''}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
          <p className="text-sm font-semibold text-slate-800 truncate sm:text-base">
            {apt.child?.full_name || 'Unknown Child'}
          </p>
          <p className="text-xs text-slate-500 truncate sm:text-sm">
            {apt.scheduled_for
              ? formatDateTime(apt.scheduled_for, { time: true })
              : 'No date scheduled'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <Badge variant={statusVariant(apt.status)} className="capitalize text-xs transition-colors duration-150">
          {apt.status}
        </Badge>

        {isActionable && (
          <Link href={`/caregiver-appointments?viewQR=${apt.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs transition-all duration-200 hover:bg-blue-50 sm:opacity-0 sm:translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0"
            >
              <span className="hidden sm:inline">QR Code</span>
              <span className="sm:hidden">QR</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}

        {isPast && (
          <Link href="/caregiver-appointments">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs transition-all duration-200 hover:bg-slate-50 sm:opacity-0 sm:translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0"
            >
              Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ElementType
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-linear-to-br from-slate-50 to-blue-50/30 p-6 text-center sm:rounded-2xl sm:p-8 lg:p-12">
      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 sm:mb-4 sm:h-16 sm:w-16 lg:mb-5 lg:h-20 lg:w-20 lg:rounded-3xl">
        <Icon className="h-7 w-7 text-slate-400 sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-slate-900 sm:mb-2 sm:text-lg lg:text-xl">{title}</h3>
      <p className="mx-auto mb-4 max-w-md text-xs text-slate-600 leading-relaxed sm:mb-5 sm:text-sm lg:mb-6">
        {description}
      </p>
      {action}
    </div>
  )
}

function TipCard({
  icon: Icon,
  title,
  description,
  color
}: {
  icon: React.ElementType
  title: string
  description: string
  color: 'blue' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white/80 p-3 ring-1 ring-slate-100 transition-all duration-200 hover:shadow-sm hover:ring-blue-200 active:scale-[0.97] sm:gap-3 sm:rounded-2xl sm:p-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 sm:h-10 sm:w-10 sm:rounded-xl ${colors[color]}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 text-xs mb-0.5 sm:mb-1 sm:text-sm">{title}</p>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}