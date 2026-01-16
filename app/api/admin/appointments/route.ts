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

        // Fetch all appointments with related data
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                scheduled_for,
                status,
                notes,
                created_at,
                child:children(full_name),
                caregiver:caregivers(profiles(full_name)),
                doctor:doctors(profiles(full_name))
            `)
            .order('scheduled_for', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(appointments || []);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
