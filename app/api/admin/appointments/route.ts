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

        // FIX: Get role from profiles table, not app_metadata
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('🔍 User role from profiles:', profile?.role); // Debug log

        if (profile?.role !== 'admin') {
            return NextResponse.json({ 
                error: 'Forbidden',
                debug: { role: profile?.role, userId: user.id }
            }, { status: 403 });
        }

        // Fetch all appointments with related data
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                child_id,
                caregiver_id,
                doctor_id,
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

export async function POST(request: Request) {
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

        const body = await request.json();
        const { child_id, caregiver_id, doctor_id, scheduled_for, status, notes } = body;

        // Validate required fields
        if (!child_id || !caregiver_id || !scheduled_for) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create appointment
        const appointmentData: any = {
            child_id,
            caregiver_id,
            scheduled_for,
            status: status || 'pending',
            notes: notes || null
        };

        // Only add doctor_id if provided
        if (doctor_id) {
            appointmentData.doctor_id = doctor_id;
        }

        const { data: newAppointment, error: createError } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();

        if (createError) {
            console.error('Error creating appointment:', createError);
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        return NextResponse.json(newAppointment, { status: 201 });

    } catch (error) {
        console.error('Error creating appointment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}