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
    <main className="space-y-5 pb-6 lg:space-y-8 lg:pb-8">
      {/* Hero Section */}
      <section className="clay-hero" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5, #7C3AED)', padding: 0 }}>
        {/* Decorative blobs */}
        <div className="deco-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)', animationDelay: '0s' }} aria-hidden="true" />
        <div className="deco-blob" style={{ width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle, rgba(6,182,212,.15), transparent 70%)', animationDelay: '3s' }} aria-hidden="true" />

        <div className="relative p-5 sm:p-7 lg:p-10">
          {nextAppointment ? (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="clay-badge mb-3" style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', padding: '5px 14px', boxShadow: 'none' }}>
                <span className="live-dot h-2 w-2 rounded-full" style={{ background: '#34D399', display: 'inline-block' }} />
                <span className="text-xs font-extrabold uppercase tracking-widest text-white">
                  {getTimeUntil(nextAppointment.scheduled_for)}
                </span>
              </div>

              <h1 className="clay-display mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {nextAppointment.child?.full_name || 'Upcoming Visit'}
              </h1>

              {nextAppointment.scheduled_for && (
                <p className="text-sm text-white/85 sm:text-base lg:text-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {formatDateTime(nextAppointment.scheduled_for, { weekday: true })}
                  {' at '}
                  {formatDateTime(nextAppointment.scheduled_for, { time: true })}
                </p>
              )}

              {nextAppointment.scheduled_for &&
                new Date(nextAppointment.scheduled_for).getTime() - new Date().getTime() < 2 * 60 * 60 * 1000 && (
                  <div className="clay-badge mt-3" style={{ background: '#F59E0B', color: '#451A03', padding: '6px 14px', boxShadow: '0 3px 0 rgba(245,158,11,.35), 0 5px 12px rgba(245,158,11,.2)' }}>
                    <Clock className="h-3 w-3" />
                    <span className="text-xs font-extrabold">Starting soon - Prepare QR code</span>
                  </div>
                )}
            </div>
          ) : (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="clay-badge mb-3" style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', padding: '5px 14px', boxShadow: 'none' }}>
                <span className="text-xs font-extrabold uppercase tracking-widest text-white">Quick Actions</span>
              </div>

              <h1 className="clay-display mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Welcome back, {firstName}
              </h1>

              <p className="text-sm text-white/85 sm:text-base lg:text-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Ready to schedule your next appointment?
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {nextAppointment ? (
              <>
                <Link href={`/caregiver-appointments?viewQR=${nextAppointment.id}`} className="w-full sm:w-auto sm:flex-1">
                  <button className="clay-btn-sec flex w-full items-center justify-center gap-2 py-3.5 px-6 text-sm font-extrabold" style={{ background: 'white', color: '#6366F1' }}>
                    <QrCode className="h-5 w-5" />
                    View QR Code
                  </button>
                </Link>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <button className="clay-btn-sec flex w-full items-center justify-center gap-2 py-3.5 px-6 text-sm font-extrabold" style={{ background: 'rgba(255,255,255,.15)', color: 'white', borderColor: 'rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}>
                    <CalendarPlus className="h-5 w-5" />
                    Book Another
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/caregiver-appointments" className="w-full sm:w-auto sm:flex-1">
                  <button className="clay-btn-sec flex w-full items-center justify-center gap-2 py-3.5 px-6 text-sm font-extrabold" style={{ background: 'white', color: '#6366F1' }}>
                    <CalendarPlus className="h-5 w-5" />
                    Book Appointment
                  </button>
                </Link>
                <Link href="/patients" className="w-full sm:w-auto sm:flex-1">
                  <button className="clay-btn-sec flex w-full items-center justify-center gap-2 py-3.5 px-6 text-sm font-extrabold" style={{ background: 'rgba(255,255,255,.15)', color: 'white', borderColor: 'rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}>
                    <Baby className="h-5 w-5" />
                    Add Child
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <StatCard icon={Baby} label="Children" value={children.length} subtext={children.length === 0 ? 'Add your first' : `Profile${children.length === 1 ? '' : 's'}`} color="indigo" />
        <StatCard icon={Calendar} label="Upcoming" value={upcomingCount} subtext={upcomingCount === 0 ? 'No visits' : 'Next 30 days'} color="purple" />
        <StatCard icon={CheckCircle} label="Completed" value={completedCount} subtext={completedCount === 0 ? 'Start journey' : 'Total visits'} color="emerald" />
        <StatCard icon={Receipt} label="Outstanding" value={formatCurrency(outstandingTotal)} subtext={unpaidCount > 0 ? `${unpaidCount} unpaid` : 'All paid up'} color="amber" />
      </section>

      {/* Billing Alert */}
      {unpaidCount > 0 && (
        <section className="clay-card-static" style={{ borderLeft: '4px solid #F59E0B', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', padding: '20px' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="clay-ico" style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 3px 0 rgba(245,158,11,.3), 0 6px 12px rgba(245,158,11,.2), inset 0 1px 0 rgba(255,255,255,.3)' }}>
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold" style={{ color: 'var(--clay-text-dark)', fontFamily: "'Nunito', sans-serif" }}>Payment Required</h3>
                <p className="text-sm" style={{ color: 'var(--clay-text-mid)', fontFamily: "'Nunito', sans-serif" }}>
                  You have {unpaidCount} outstanding invoice{unpaidCount !== 1 ? 's' : ''} totaling {formatCurrency(outstandingTotal)}
                </p>
              </div>
            </div>
            <Link href="/billing">
              <button className="clay-cta clay-cta-amber flex items-center justify-center gap-2 px-8 py-3 text-sm font-extrabold text-white">
                Pay Now
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* Appointments Section */}
      <section className="clay-card-static" style={{ padding: 0 }}>
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="clay-display text-xl font-bold sm:text-2xl" style={{ color: 'var(--clay-text-dark)' }}>Your Appointments</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--clay-text-muted)', fontFamily: "'Nunito', sans-serif" }}>Manage your family&apos;s healthcare visits</p>
            </div>
            <Link href="/caregiver-appointments">
              <button className="clay-cta flex items-center gap-2 px-6 py-2.5 text-sm">
                <Plus className="h-4 w-4" />
                New Appointment
              </button>
            </Link>
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No appointments yet"
              description="Ready to schedule your first visit? It only takes a minute to book an appointment for your child."
              action={
                <Link href="/caregiver-appointments">
                  <button className="clay-cta flex items-center gap-2 px-8 py-3 text-sm">
                    <CalendarPlus className="h-5 w-5" />
                    Schedule First Appointment
                  </button>
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
        </div>
      </section>

      {/* Billing Summary */}
      <section className="clay-card-static" style={{ padding: 0 }}>
        <div className="clay-hero" style={{ background: 'linear-gradient(135deg, #10B981, #059669, #06B6D4)', padding: '20px', borderRadius: '24px 24px 0 0' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="clay-ico" style={{ width: 48, height: 48, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }}>
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="clay-display text-xl font-bold text-white sm:text-2xl">Billing Summary</h2>
                <p className="mt-0.5 text-sm text-white/85" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {unpaidCount > 0 ? `${formatCurrency(outstandingTotal)} outstanding` : 'All payments up to date'}
                </p>
              </div>
            </div>
            <Link href="/billing">
              <button className="clay-btn-sec flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold" style={{ background: 'rgba(255,255,255,.2)', color: 'white', borderColor: 'rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}>
                View All
                <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          {recentInvoices.length > 0 ? (
            <div className="space-y-2">
              {recentInvoices.map((invoice, idx) => (
                <div key={idx} className="clay-row flex items-center justify-between p-3.5" style={{ marginBottom: 6 }}>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ background: invoice.status === 'paid' ? '#10B981' : '#F59E0B', boxShadow: invoice.status === 'paid' ? '0 2px 6px rgba(16,185,129,.4)' : '0 2px 6px rgba(245,158,11,.4)' }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--clay-text-dark)', fontFamily: "'Nunito', sans-serif" }}>
                        {invoice.status === 'paid' ? 'Payment Received' : 'Invoice Issued'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--clay-text-muted)' }}>
                        {invoice.created_at ? formatDateTime(invoice.created_at) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <span className="clay-display text-sm font-bold" style={{ color: invoice.status === 'paid' ? '#10B981' : 'var(--clay-text-dark)' }}>
                    {invoice.status === 'paid' ? '+' : ''}{formatCurrency(invoice.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--clay-text-muted)', fontFamily: "'Nunito', sans-serif" }}>No recent billing activity</p>
            </div>
          )}

          <Link href="/billing" className="mt-5 block">
            <button className="clay-btn-sec flex w-full items-center justify-center gap-2 py-3 text-sm font-extrabold" style={{ color: 'var(--clay-text-dark)' }}>
              <CreditCard className="h-4 w-4" />
              Manage Payments & Invoices
            </button>
          </Link>
        </div>
      </section>

      {/* Tips Section */}
      <section className="clay-inset p-5 sm:p-6 lg:p-8" style={{ position: 'relative' }}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="clay-display text-xl font-bold" style={{ color: 'var(--clay-text-dark)' }}>Quick Tips</h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--clay-text-muted)', fontFamily: "'Nunito', sans-serif" }}>Getting the most from your dashboard</p>
          </div>
          <div className="clay-ico" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', boxShadow: '0 4px 0 rgba(245,158,11,.25), 0 6px 14px rgba(245,158,11,.15), inset 0 1px 0 rgba(255,255,255,.4)' }}>
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TipCard icon={Bell} title="Never miss a visit" description="Enable appointment reminders to get notified before each visit" color="indigo" />
          <TipCard icon={Ticket} title="Faster check-ins" description="Save QR codes to your phone for quick access at appointments" color="purple" />
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
  color: 'indigo' | 'purple' | 'emerald' | 'amber'
}) {
  const theme = {
    indigo: { grad: 'linear-gradient(135deg, #6366F1, #818CF8)', bg: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', labelColor: '#6366F1', shadow: '0 3px 0 rgba(99,102,241,.25), 0 6px 14px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.4)' },
    purple: { grad: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', labelColor: '#8B5CF6', shadow: '0 3px 0 rgba(139,92,246,.25), 0 6px 14px rgba(139,92,246,.15), inset 0 1px 0 rgba(255,255,255,.4)' },
    emerald: { grad: 'linear-gradient(135deg, #10B981, #34D399)', bg: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)', labelColor: '#10B981', shadow: '0 3px 0 rgba(16,185,129,.25), 0 6px 14px rgba(16,185,129,.15), inset 0 1px 0 rgba(255,255,255,.4)' },
    amber: { grad: 'linear-gradient(135deg, #F59E0B, #FBBF24)', bg: 'linear-gradient(135deg, #FFFBEB, #FDE68A)', labelColor: '#F59E0B', shadow: '0 3px 0 rgba(245,158,11,.25), 0 6px 14px rgba(245,158,11,.15), inset 0 1px 0 rgba(255,255,255,.4)' },
  }
  const t = theme[color]

  return (
    <div className="clay-stat" style={{ background: t.bg, padding: '18px 20px' }}>
      <div className="stat-blob" style={{ width: 80, height: 80, right: -15, bottom: -15 }} aria-hidden="true" />
      <div className="relative space-y-2.5">
        <div className="clay-ico" style={{ width: 44, height: 44, background: t.grad, boxShadow: t.shadow }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="clay-label" style={{ color: t.labelColor, marginBottom: 2 }}>{label}</p>
          <p className="clay-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--clay-text-dark)', lineHeight: 1.1 }}>{value}</p>
          <p className="text-xs font-bold mt-1" style={{ color: 'var(--clay-text-muted)', fontFamily: "'Nunito', sans-serif" }}>{subtext}</p>
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
      <h3 className="clay-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: isUrgent ? '#DC2626' : 'var(--clay-text-muted)' }}>
        {title}
        {isUrgent && <span className="live-dot" style={{ width: 7, height: 7 }} />}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    <div className="clay-row" style={{ flexDirection: 'column', gap: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div className="clay-ico" style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', borderRadius: 14, flexDirection: 'column', flexShrink: 0, boxShadow: '0 2px 0 rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.5)' }}>
          <span className="clay-display" style={{ fontSize: 16, lineHeight: 1, color: '#4F46E5' }}>
            {apt.scheduled_for ? new Date(apt.scheduled_for).getDate() : '?'}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818CF8', fontFamily: "'Nunito', sans-serif" }}>
            {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleString('en-US', { month: 'short' }) : ''}
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--clay-text-dark)', fontFamily: "'Nunito', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {apt.child?.full_name || 'Unknown Child'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--clay-text-muted)', fontFamily: "'Nunito', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {apt.scheduled_for
              ? formatDateTime(apt.scheduled_for, { time: true })
              : 'No date scheduled'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span className="clay-badge" style={{ textTransform: 'capitalize' }}>
          {apt.status}
        </span>

        {isActionable && (
          <Link href={`/caregiver-appointments?viewQR=${apt.id}`}>
            <button className="clay-btn-sec" style={{ fontSize: 12, padding: '6px 12px', gap: 4 }}>
              QR Code
              <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        )}

        {isPast && (
          <Link href="/caregiver-appointments">
            <button className="clay-btn-sec" style={{ fontSize: 12, padding: '6px 12px', gap: 4 }}>
              Details
              <ArrowRight className="h-3 w-3" />
            </button>
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
    <div className="clay-inset" style={{ textAlign: 'center', padding: '32px 24px' }}>
      <div className="clay-empty-ico" style={{ margin: '0 auto 14px' }}>
        <Icon className="h-8 w-8" style={{ color: 'var(--clay-text-muted)' }} />
      </div>
      <h3 className="clay-display" style={{ fontSize: 18, marginBottom: 6, color: 'var(--clay-text-dark)' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', maxWidth: 340, margin: '0 auto 18px', lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>
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
  color: 'indigo' | 'purple'
}) {
  const themes = {
    indigo: { grad: 'linear-gradient(135deg, #6366F1, #818CF8)', shadow: '0 2px 0 rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.4)' },
    purple: { grad: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', shadow: '0 2px 0 rgba(139,92,246,.2), inset 0 1px 0 rgba(255,255,255,.4)' },
  }
  const t = themes[color]

  return (
    <div className="clay-row" style={{ alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
      <div className="clay-ico" style={{ width: 38, height: 38, background: t.grad, boxShadow: t.shadow, flexShrink: 0 }}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontWeight: 700, color: 'var(--clay-text-dark)', fontSize: 13, marginBottom: 2, fontFamily: "'Nunito', sans-serif" }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--clay-text-muted)', lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>{description}</p>
      </div>
    </div>
  )
}