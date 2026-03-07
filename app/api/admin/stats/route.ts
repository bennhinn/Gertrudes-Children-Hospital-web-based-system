export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const searchParams = new URL(request.url).searchParams;
        const requestedPeriod = searchParams.get('period');
        const isPeriodFiltered = requestedPeriod === 'week' || requestedPeriod === 'month' || requestedPeriod === 'year';
        const period = isPeriodFiltered ? requestedPeriod : 'all';

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get role from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const windowDays = period === 'year' ? 365 : period === 'month' ? 30 : 7;
        const startOfCurrentWindow = new Date(today);
        startOfCurrentWindow.setDate(startOfCurrentWindow.getDate() - (windowDays - 1));
        const startOfPreviousWindow = new Date(startOfCurrentWindow);
        startOfPreviousWindow.setDate(startOfPreviousWindow.getDate() - windowDays);

        let totalUsers = 0;
        let totalChildren = 0;
        let totalDoctors = 0;
        let totalAppointments = 0;
        let pendingAppointments = 0;
        let completedAppointments = 0;
        let todayAppointments = 0;

        if (isPeriodFiltered) {
            // Reports page: period-aware entity totals.
            const [usersResult, childrenResult, doctorsResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfCurrentWindow.toISOString())
                    .lte('created_at', now.toISOString()),
                supabase
                    .from('children')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfCurrentWindow.toISOString())
                    .lte('created_at', now.toISOString()),
                supabase
                    .from('doctors')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfCurrentWindow.toISOString())
                    .lte('created_at', now.toISOString()),
            ]);

            totalUsers = usersResult.count || 0;
            totalChildren = childrenResult.count || 0;
            totalDoctors = doctorsResult.count || 0;
        } else {
            // Dashboard: always system overview (all-time totals).
            const [usersResult, childrenResult, doctorsResult, appointmentsResult, pendingResult, completedResult, todayResult] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('children').select('*', { count: 'exact', head: true }),
                supabase.from('doctors').select('*', { count: 'exact', head: true }),
                supabase.from('appointments').select('*', { count: 'exact', head: true }),
                supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
                supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .gte('scheduled_for', today.toISOString())
                    .lt('scheduled_for', tomorrow.toISOString()),
            ]);

            totalUsers = usersResult.count || 0;
            totalChildren = childrenResult.count || 0;
            totalDoctors = doctorsResult.count || 0;
            totalAppointments = appointmentsResult.count || 0;
            pendingAppointments = pendingResult.count || 0;
            completedAppointments = completedResult.count || 0;
            todayAppointments = todayResult.count || 0;
        }

        const { data: recentAppointments, error: recentAppointmentsError } = await supabase
            .from('appointments')
            .select('scheduled_for, created_at, status')
            .or(`scheduled_for.gte.${startOfPreviousWindow.toISOString()},created_at.gte.${startOfPreviousWindow.toISOString()}`);

        if (recentAppointmentsError) {
            console.error('Error fetching appointment growth data:', recentAppointmentsError);
            return NextResponse.json({ error: 'Failed to fetch appointment growth data' }, { status: 500 });
        }

        let thisW = 0;
        let lastW = 0;
        let periodTotalAppointments = 0;
        let periodPendingAppointments = 0;
        let periodCompletedAppointments = 0;
        let periodTodayAppointments = 0;

        recentAppointments?.forEach((appointment) => {
            const eventDateRaw = appointment.scheduled_for || appointment.created_at;
            if (!eventDateRaw) {
                return;
            }

            const eventDate = new Date(eventDateRaw);
            if (Number.isNaN(eventDate.getTime())) {
                return;
            }

            if (eventDate >= startOfCurrentWindow && eventDate <= now) {
                thisW += 1;
                periodTotalAppointments += 1;

                if (eventDate >= today && eventDate < tomorrow) {
                    periodTodayAppointments += 1;
                }

                if (appointment.status === 'completed') {
                    periodCompletedAppointments += 1;
                }

                if (['pending', 'confirmed', 'checked_in'].includes(appointment.status || '')) {
                    periodPendingAppointments += 1;
                }
            } else if (eventDate >= startOfPreviousWindow && eventDate < startOfCurrentWindow) {
                lastW += 1;
            }
        });

        if (isPeriodFiltered) {
            totalAppointments = periodTotalAppointments;
            pendingAppointments = periodPendingAppointments;
            completedAppointments = periodCompletedAppointments;
            todayAppointments = periodTodayAppointments;
        }

        let appointmentGrowth: string;
        if (lastW === 0) {
            appointmentGrowth = thisW > 0 ? '+100%' : '+0%';
        } else {
            const pct = Math.round(((thisW - lastW) / lastW) * 100);
            appointmentGrowth = `${pct >= 0 ? '+' : ''}${pct}%`;
        }

        // Completion rate is based on appointments in the selected period.
        const total = totalAppointments || 0;
        const completed = completedAppointments || 0;
        const completionRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';

        const stats = {
            totalUsers: totalUsers || 0,
            totalChildren: totalChildren || 0,
            totalDoctors: totalDoctors || 0,
            totalAppointments: totalAppointments || 0,
            pendingAppointments: pendingAppointments || 0,
            todayAppointments: todayAppointments || 0,
            appointmentGrowth,
            completionRate,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}