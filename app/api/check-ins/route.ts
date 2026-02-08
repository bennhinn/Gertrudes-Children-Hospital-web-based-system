import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { appointmentId, childId, vitals, reason, notes } = body

        // Get the latest queue number for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: lastCheckIn } = await supabase
            .from('check_ins')
            .select('queue_number')
            .gte('checked_in_at', today.toISOString())
            .lt('checked_in_at', tomorrow.toISOString())
            .order('queue_number', { ascending: false })
            .limit(1)
            .single()

        const queueNumber = (lastCheckIn?.queue_number || 0) + 1

        // Create check-in record
        const { data: checkIn, error: checkInError } = await supabase
            .from('check_ins')
            .insert({
                appointment_id: appointmentId,
                child_id: childId,
                checked_in_by: user.id,
                vitals: vitals,
                reason: reason || 'General checkup',
                notes: notes || null,
                queue_number: queueNumber,
                status: 'waiting',
            })
            .select()
            .single()

        if (checkInError) {
            console.error('Error creating check-in:', checkInError)
            return NextResponse.json({ error: checkInError.message }, { status: 500 })
        }

        // Update appointment status to checked_in
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'checked_in' })
            .eq('id', appointmentId)

        if (updateError) {
            console.error('Error updating appointment:', updateError)
        }

        return NextResponse.json({ checkIn }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/check-ins:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}