// /api/admin/appointments/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Get the update data from request body
        const body = await request.json();
        const { child_id, caregiver_id, doctor_id, scheduled_for, status, notes } = body;

        // Prepare update object
        const updateData: any = {};
        if (child_id !== undefined) updateData.child_id = child_id;
        if (caregiver_id !== undefined) updateData.caregiver_id = caregiver_id;
        if (doctor_id !== undefined) updateData.doctor_id = doctor_id || null;
        if (scheduled_for !== undefined) updateData.scheduled_for = scheduled_for;
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        // Update the appointment
        const { data: updatedAppointment, error: updateError } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', params.id)
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
            .single();

        if (updateError) {
            console.error('Error updating appointment:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json(updatedAppointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Delete the appointment
        const { error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('id', params.id);

        if (deleteError) {
            console.error('Error deleting appointment:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}