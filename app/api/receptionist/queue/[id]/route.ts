export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer } from '@/lib/activity-logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        const { status, notes } = body

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        const validStatuses = ['waiting', 'in_consultation', 'completed', 'cancelled']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Get the current user for logging
        const { data: { user } } = await supabase.auth.getUser()
        let userEmail = user?.email || null
        let userRole = 'staff'

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            userRole = profile?.role || 'staff'
        }

        const updateData: Record<string, unknown> = { status }

        if (status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        }

        if (notes) {
            updateData.notes = notes
        }

        const { data: checkIn, error } = await supabase
            .from('check_ins')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating check-in:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If marking as in_consultation, update appointment status too
        if (status === 'in_consultation' && checkIn.appointment_id) {
            await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', checkIn.appointment_id)
        }

        // If marking as completed, update appointment status
        if (status === 'completed' && checkIn.appointment_id) {
            await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', checkIn.appointment_id)
        }

        // Log the activity based on status
        const statusDescriptions: Record<string, string> = {
            'waiting': 'Patient returned to waiting',
            'in_consultation': 'Patient consultation started',
            'completed': 'Patient consultation completed',
            'cancelled': 'Patient check-in cancelled'
        }

        await logActivityServer(supabase, {
            user_id: user?.id,
            action: `QUEUE_STATUS_${status.toUpperCase()}`,
            target_table: 'check_in',
            target_id: id,
            description: statusDescriptions[status] || `Queue status changed to ${status}`,
            metadata: {
                queue_number: checkIn.queue_number,
                previous_status: body.previous_status,
                new_status: status,
                appointment_id: checkIn.appointment_id
            },
            user_email: userEmail || undefined,
            user_role: userRole
        })

        return NextResponse.json({ success: true, checkIn })
    } catch (error) {
        console.error('Error in check-in update API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data: checkIn, error } = await supabase
            .from('check_ins')
            .select(`
        *,
        appointment:appointments(
          id,
          scheduled_for,
          notes,
          child:children(id, full_name, dob, gender, medical_notes),
          caregiver:caregivers(id, profiles(full_name, phone)),
          doctor:doctors(id, profiles(full_name))
        )
      `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching check-in:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(checkIn)
    } catch (error) {
        console.error('Error in check-in get API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
