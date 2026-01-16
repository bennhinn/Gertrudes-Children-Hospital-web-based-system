import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
