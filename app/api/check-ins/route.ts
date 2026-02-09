import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer, getRequestMetadata, ActivityActions } from '@/lib/activity-logger'

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
            // Log failure
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single()

                const meta = getRequestMetadata(request as unknown as Request)

                await logActivityServer(supabase, {
                    user_id: user.id,
                    user_email: user.email || null,
                    user_role: profile?.role || null,
                    action: ActivityActions.CHECKIN_CREATE,
                    action_type: 'create',
                    target_table: 'check_ins',
                    description: `Failed to create check-in for appointment ${appointmentId || 'n/a'}`,
                    metadata: { appointmentId, childId, reason },
                    status: 'failure',
                    error_message: checkInError.message,
                    ip_address: meta.ip_address,
                    user_agent: meta.user_agent,
                })
            } catch (logErr) {
                console.error('Failed to log failed check-in:', logErr)
            }

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

        // Log success
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', user.id)
                .single()

            const meta = getRequestMetadata(request as unknown as Request)

            await logActivityServer(supabase, {
                user_id: user.id,
                user_email: user.email || null,
                user_role: profile?.role || null,
                action: ActivityActions.CHECKIN_CREATE,
                action_type: 'create',
                target_table: 'check_ins',
                target_id: checkIn.id,
                description: `${profile?.full_name || user.email} created check-in (Queue #${queueNumber})`,
                metadata: {
                    queue_number: queueNumber,
                    appointment_id: appointmentId,
                    child_id: childId,
                },
                status: 'success',
                ip_address: meta.ip_address,
                user_agent: meta.user_agent,
            })
        } catch (logErr) {
            console.error('Failed to log check-in activity:', logErr)
        }

        return NextResponse.json({ checkIn }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/check-ins:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}