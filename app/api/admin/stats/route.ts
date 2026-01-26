export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

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

        // Get total users count
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Get total children count
        const { count: totalChildren } = await supabase
            .from('children')
            .select('*', { count: 'exact', head: true });

        // Get total doctors count
        const { count: totalDoctors } = await supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true });

        // Get total appointments count
        const { count: totalAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true });

        // Get pending appointments count
        const { count: pendingAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Get today's appointments count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: todayAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('scheduled_for', today.toISOString())
            .lt('scheduled_for', tomorrow.toISOString());

        const stats = {
            totalUsers: totalUsers || 0,
            totalChildren: totalChildren || 0,
            totalDoctors: totalDoctors || 0,
            totalAppointments: totalAppointments || 0,
            pendingAppointments: pendingAppointments || 0,
            todayAppointments: todayAppointments || 0,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}