import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getChildrenByCaregiver, getUpcomingAppointments, getCompletedAppointmentsCount } from '@/lib/db/queries'
import type { Appointment } from '@/types'
import Link from 'next/link'

function statusVariant(status: string) {
  if (status === 'pending') return 'blue' as const
  if (status === 'confirmed') return 'pink' as const
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
  // Already sorted by date ascending from query
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

  // Fetch real data
  const [children, appointments, completedCount] = await Promise.all([
    getChildrenByCaregiver(user.id),
    getUpcomingAppointments(user.id),
    getCompletedAppointmentsCount(user.id),
  ])

  const nextAppointment = getNextAppointment(appointments)
  const upcomingCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length

  return (
    <main className="space-y-6 sm:space-y-8">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-5 sm:p-8 text-white shadow-xl sm:shadow-2xl lg:p-12">
        <div className="absolute right-0 top-0 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-16 -bottom-16 sm:-left-20 sm:-bottom-20 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-5 sm:gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 sm:px-4 sm:py-1.5 backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight lg:text-5xl">Hi, {fullName} 👋</h1>
            <p className="max-w-xl text-sm sm:text-base text-white/90 lg:text-lg">
              Your personalized hub for managing children's health appointments
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2">
              <Link href="/caregiver-appointments">
                <Button className="bg-white text-blue-600 hover:bg-white/90 text-sm sm:text-base">
                  📅 Book Appointment
                </Button>
              </Link>
              <Link href="/patients">
                <Button variant="ghost" className="bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 text-sm sm:text-base">
                  👶 Add Child
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-white/70">Next Visit</p>
                {nextAppointment && nextAppointment.scheduled_for ? (
                  <>
                    <p className="mt-2 text-2xl font-bold">{new Date(nextAppointment.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm text-white/80">{new Date(nextAppointment.scheduled_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-white/80">No upcoming</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 sm:p-6 shadow-md sm:shadow-lg transition-all hover:shadow-xl">
          <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-blue-200/40 transition-transform group-hover:scale-110" aria-hidden="true" />
          <div className="relative">
            <div className="mb-2 sm:mb-3 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600 text-xl sm:text-2xl shadow-md">
              👶
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600">Children</p>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold text-blue-600">{children.length}</p>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">Registered</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 sm:p-6 shadow-md sm:shadow-lg transition-all hover:shadow-xl">
          <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-purple-200/40 transition-transform group-hover:scale-110" aria-hidden="true" />
          <div className="relative">
            <div className="mb-2 sm:mb-3 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-purple-600 text-xl sm:text-2xl shadow-md">
              📅
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600">Upcoming</p>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold text-purple-600">{upcomingCount}</p>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">In 30 days</p>
          </div>
        </div>

        <div className="group relative col-span-2 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 sm:p-6 shadow-md sm:shadow-lg transition-all hover:shadow-xl lg:col-span-1">
          <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-emerald-200/40 transition-transform group-hover:scale-110" aria-hidden="true" />
          <div className="relative flex items-center gap-4 lg:block">
            <div className="mb-0 lg:mb-3 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-600 text-xl sm:text-2xl shadow-md">
              ✅
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-600">Completed Visits</p>
              <p className="mt-0 lg:mt-2 text-2xl sm:text-4xl font-bold text-emerald-600">{completedCount}</p>
              <p className="mt-0 lg:mt-1 text-[10px] sm:text-xs text-slate-500">All time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 p-4 sm:p-6 shadow-md sm:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">Quick Tips</h2>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600">Make the most of your dashboard</p>
          </div>
          <span className="text-xl sm:text-2xl" aria-hidden="true">💡</span>
        </div>
        <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-white/60 p-3 sm:p-4 backdrop-blur-sm">
            <span className="text-lg sm:text-xl shrink-0" aria-hidden="true">🔔</span>
            <span className="text-xs sm:text-sm text-slate-700">Enable reminders to never miss appointments</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-white/60 p-3 sm:p-4 backdrop-blur-sm">
            <span className="text-lg sm:text-xl shrink-0" aria-hidden="true">📱</span>
            <span className="text-xs sm:text-sm text-slate-700">Download QR codes for faster check-ins</span>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-md sm:shadow-lg lg:p-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Your Appointments</h2>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600">Upcoming and recent visits</p>
          </div>
          <Link href="/caregiver-appointments" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full shadow-sm sm:w-auto">+ New Appointment</Button>
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8 text-center">
            <div className="mx-auto mb-3 sm:mb-4 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-200 text-2xl sm:text-3xl">
              📋
            </div>
            <p className="text-base sm:text-lg font-medium text-slate-700">No appointments yet</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Schedule your first visit to get started</p>
            <Link href="/caregiver-appointments">
              <Button size="sm" className="mt-3 sm:mt-4">Book Appointment</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="group flex flex-col gap-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 p-3 sm:p-4 transition-all hover:shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-600 text-lg sm:text-xl font-bold text-white shadow-sm">
                    {apt.child?.full_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{apt.child?.full_name || 'Unknown'}</p>
                    <p className="text-xs sm:text-sm text-slate-500">{apt.scheduled_for ? formatDateTime(apt.scheduled_for) : 'No date'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge variant={statusVariant(apt.status)}>{apt.status}</Badge>
                  <Button variant="ghost" size="sm" className="text-xs sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    View QR →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}