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

        // FIX: Get role from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch recent appointments as activity
        const { data: recentAppointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                scheduled_for,
                status,
                created_at,
                child:children(full_name),
                caregiver:caregivers(profiles(full_name))
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching recent activity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(recentAppointments || []);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}