import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get current user and verify admin role
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = user.app_metadata?.role;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all stats in parallel
        const [
            { count: totalUsers },
            { count: totalChildren },
            { count: totalAppointments },
            { count: totalDoctors },
            { count: pendingAppointments },
            { count: todayAppointments },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('children').select('*', { count: 'exact', head: true }),
            supabase.from('appointments').select('*', { count: 'exact', head: true }),
            supabase.from('doctors').select('*', { count: 'exact', head: true }),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('appointments').select('*', { count: 'exact', head: true })
                .gte('scheduled_for', new Date().toISOString().split('T')[0])
                .lt('scheduled_for', new Date(Date.now() + 86400000).toISOString().split('T')[0]),
        ]);

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            totalChildren: totalChildren || 0,
            totalAppointments: totalAppointments || 0,
            totalDoctors: totalDoctors || 0,
            pendingAppointments: pendingAppointments || 0,
            todayAppointments: todayAppointments || 0,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}