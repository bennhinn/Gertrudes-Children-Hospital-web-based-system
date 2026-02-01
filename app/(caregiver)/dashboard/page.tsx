import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getChildrenByCaregiver, getUpcomingAppointments, getCompletedAppointmentsCount } from '@/lib/db/queries'
import type { Appointment } from '@/types'
import Link from 'next/link'

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

  const nextAppointment = getNextAppointment(appointments)
  const upcomingCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length

  return (
    <main className="space-y-4 lg:space-y-8">
      {/* Hero section - Action-focused, no redundant identity */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-5 text-white shadow-lg lg:rounded-3xl lg:p-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl lg:h-64 lg:w-64" aria-hidden="true" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl lg:-left-20 lg:-bottom-20 lg:h-96 lg:w-96" aria-hidden="true" />

        <div className="relative">
          {/* Status-first messaging */}
          {upcomingCount > 0 ? (
            <div className="mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Next Appointment</span>
              </div>

              <h1 className="mb-2 text-2xl font-bold tracking-tight lg:text-4xl">
                {nextAppointment?.child?.full_name || 'Upcoming Visit'}
              </h1>

              {nextAppointment?.scheduled_for && (
                <p className="text-base text-white/90 lg:text-lg">
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
            <div className="mb-6 lg:mb-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs font-semibold uppercase tracking-wider">Quick Actions</span>
              </div>

              <h1 className="mb-2 text-2xl font-bold tracking-tight lg:text-4xl">
                Ready to schedule?
              </h1>

              <p className="text-base text-white/90 lg:text-lg">
                Book your child's next appointment in less than a minute
              </p>
            </div>
          )}

          {/* Clear, labeled primary actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            {nextAppointment?.scheduled_for ? (
              <>
                <Link href={`/caregiver-appointments?viewQR=${nextAppointment.id}`} className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl sm:w-auto">
                    <span className="mr-2">🎫</span>
                    <span className="font-semibold">View QR Code</span>
                  </Button>
                </Link>
                <Link href="/caregiver-appointments" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 sm:w-auto"
                  >
                    <span className="mr-2">📅</span>
                    <span className="font-semibold">Book Another</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/caregiver-appointments" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 transition-all hover:shadow-xl sm:w-auto">
                    <span className="mr-2">📅</span>
                    <span className="font-semibold">Book Appointment</span>
                  </Button>
                </Link>
                <Link href="/patients" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 sm:w-auto"
                  >
                    <span className="mr-2">👶</span>
                    <span className="font-semibold">Add Child Profile</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {/* Children Stat */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md lg:rounded-3xl lg:p-8">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 transition-transform group-hover:scale-110 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative flex items-center gap-4 lg:block">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl shadow-lg shadow-blue-500/25 lg:mb-4 lg:h-14 lg:w-14 lg:rounded-2xl lg:text-2xl">
              👶
            </div>
            <div className="min-w-0 flex-1 space-y-0.5 lg:space-y-1">
              <p className="text-xs font-medium text-slate-600 lg:text-sm">Children</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight lg:text-4xl">{children.length}</p>
              <p className="text-xs text-slate-500 truncate lg:text-sm">
                {children.length === 0 ? 'Add your first child' : `Registered profile${children.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md lg:rounded-3xl lg:p-8">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-50 transition-transform group-hover:scale-110 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative flex items-center gap-4 lg:block">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-xl shadow-lg shadow-purple-500/25 lg:mb-4 lg:h-14 lg:w-14 lg:rounded-2xl lg:text-2xl">
              📅
            </div>
            <div className="min-w-0 flex-1 space-y-0.5 lg:space-y-1">
              <p className="text-xs font-medium text-slate-600 lg:text-sm">Upcoming</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight lg:text-4xl">{upcomingCount}</p>
              <p className="text-xs text-slate-500 truncate lg:text-sm">
                {upcomingCount === 0 ? 'No visits scheduled' : 'Next 30 days'}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Visits */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md sm:col-span-2 lg:col-span-1 lg:rounded-3xl lg:p-8">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110 lg:-right-8 lg:-top-8 lg:h-32 lg:w-32" aria-hidden="true" />
          <div className="relative flex items-center gap-4 lg:block">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl shadow-lg shadow-emerald-500/25 lg:mb-4 lg:h-14 lg:w-14 lg:rounded-2xl lg:text-2xl">
              ✅
            </div>
            <div className="min-w-0 flex-1 space-y-0.5 lg:space-y-1">
              <p className="text-xs font-medium text-slate-600 lg:text-sm">Completed</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight lg:text-4xl">{completedCount}</p>
              <p className="text-xs text-slate-500 truncate lg:text-sm">
                {completedCount === 0 ? 'Start your journey' : 'Total visits'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appointments Section */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:rounded-3xl lg:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 lg:text-2xl">Your Appointments</h2>
            <p className="mt-1 text-xs text-slate-600 lg:text-sm">Manage your family's healthcare visits</p>
          </div>
          <Link href="/caregiver-appointments" className="w-full sm:w-auto">
            <Button className="w-full shadow-sm sm:w-auto">
              <span className="mr-2">➕</span>
              New Appointment
            </Button>
          </Link>
        </div>

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
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
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

      {/* Tips Section */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 shadow-sm ring-1 ring-purple-200/50 lg:rounded-3xl lg:p-8">
        <div className="mb-4 flex items-start justify-between lg:mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 lg:text-lg">Quick Tips</h2>
            <p className="mt-0.5 text-xs text-slate-600 lg:mt-1 lg:text-sm">Getting the most from your dashboard</p>
          </div>
          <span className="text-2xl lg:text-3xl" aria-hidden="true">💡</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 backdrop-blur-sm ring-1 ring-white/50">
            <span className="text-xl shrink-0 lg:text-2xl" aria-hidden="true">🔔</span>
            <div>
              <p className="font-medium text-slate-900 text-xs mb-1 lg:text-sm">Never miss a visit</p>
              <p className="text-[11px] text-slate-600 leading-relaxed lg:text-xs">
                Enable appointment reminders to get notified before each visit
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 backdrop-blur-sm ring-1 ring-white/50">
            <span className="text-xl shrink-0 lg:text-2xl" aria-hidden="true">🎫</span>
            <div>
              <p className="font-medium text-slate-900 text-xs mb-1 lg:text-sm">Faster check-ins</p>
              <p className="text-[11px] text-slate-600 leading-relaxed lg:text-xs">
                Save QR codes to your phone for quick access at appointments
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}