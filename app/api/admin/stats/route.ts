// /api/admin/stats/route.ts (Enhanced version)
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current week dates
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(today.getDate() - 14);

        // Fetch all stats in parallel
        const [
            { count: totalUsers },
            { count: totalAppointments },
            { count: totalChildren },
            { count: totalDoctors },
            { count: thisWeekAppointments },
            { count: lastWeekAppointments },
            { data: completedAppointments }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('appointments').select('*', { count: 'exact', head: true }),
            supabase.from('children').select('*', { count: 'exact', head: true }),
            supabase.from('doctors').select('*', { count: 'exact', head: true }),
            supabase.from('appointments')
                .select('*', { count: 'exact', head: true })
                .gte('scheduled_for', lastWeek.toISOString()),
            supabase.from('appointments')
                .select('*', { count: 'exact', head: true })
                .gte('scheduled_for', twoWeeksAgo.toISOString())
                .lt('scheduled_for', lastWeek.toISOString()),
            supabase.from('appointments')
                .select('status')
                .gte('scheduled_for', lastWeek.toISOString())
        ]);

        // Calculate growth percentage
        const appointmentGrowth = lastWeekAppointments && lastWeekAppointments > 0
            ? Math.round(((thisWeekAppointments || 0) - lastWeekAppointments) / lastWeekAppointments * 100)
            : 0;

        // Calculate completion rate
        const completedCount = completedAppointments?.filter(apt => apt.status === 'completed').length || 0;
        const completionRate = thisWeekAppointments && thisWeekAppointments > 0
            ? Math.round((completedCount / thisWeekAppointments) * 100)
            : 0;

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            totalAppointments: totalAppointments || 0,
            totalChildren: totalChildren || 0,
            totalDoctors: totalDoctors || 0,
            appointmentGrowth: appointmentGrowth > 0 ? `+${appointmentGrowth}%` : `${appointmentGrowth}%`,
            completionRate: `${completionRate}%`
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}