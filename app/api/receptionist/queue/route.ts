import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all check-ins for today
        const { data: checkIns, error: checkInsError } = await supabase
            .from('check_ins')
            .select(`
        *,
        appointment:appointments(
          id,
          scheduled_for,
          child:children(id, full_name, dob, gender),
          caregiver:caregivers(id, profiles(full_name, phone)),
          doctor:doctors(id, profiles(full_name))
        )
      `)
            .gte('checked_in_at', today.toISOString())
            .order('queue_number', { ascending: true })

        if (checkInsError) {
            console.error('Error fetching check-ins:', checkInsError)
            return NextResponse.json({ error: checkInsError.message }, { status: 500 })
        }

        // Calculate stats
        const stats = {
            total: checkIns?.length || 0,
            waiting: checkIns?.filter(c => c.status === 'waiting').length || 0,
            inConsultation: checkIns?.filter(c => c.status === 'in_consultation').length || 0,
            completed: checkIns?.filter(c => c.status === 'completed').length || 0,
        }

        return NextResponse.json({
            checkIns: checkIns || [],
            stats,
        })
    } catch (error) {
        console.error('Error in queue API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { appointment_id, child_id, reason, vitals, checked_in_by } = body

        if (!appointment_id && !child_id) {
            return NextResponse.json(
                { error: 'Either appointment_id or child_id is required' },
                { status: 400 }
            )
        }

        // Get the current highest queue number for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: lastCheckIn } = await supabase
            .from('check_ins')
            .select('queue_number')
            .gte('checked_in_at', today.toISOString())
            .order('queue_number', { ascending: false })
            .limit(1)
            .single()

        const nextQueueNumber = (lastCheckIn?.queue_number || 0) + 1

        // Create the check-in record
        const { data: checkIn, error: checkInError } = await supabase
            .from('check_ins')
            .insert({
                appointment_id,
                child_id,
                checked_in_by,
                queue_number: nextQueueNumber,
                status: 'waiting',
                reason: reason || 'General checkup',
                vitals: vitals || null,
            })
            .select()
            .single()

        if (checkInError) {
            console.error('Error creating check-in:', checkInError)
            return NextResponse.json({ error: checkInError.message }, { status: 500 })
        }

        // Update appointment status to checked_in
        if (appointment_id) {
            await supabase
                .from('appointments')
                .update({ status: 'confirmed' })
                .eq('id', appointment_id)
        }

        return NextResponse.json({
            success: true,
            checkIn,
            queueNumber: nextQueueNumber,
        })
    } catch (error) {
        console.error('Error in check-in API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
