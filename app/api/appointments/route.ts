import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer, getRequestMetadata, ActivityActions } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_for', { ascending: false })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    return NextResponse.json({ appointments })
  } catch (err) {
    console.error('Error in GET /api/appointments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caregiver_id, child_id, doctor_id, scheduled_for, reason } = body

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({ caregiver_id, child_id, doctor_id, scheduled_for, reason, status: 'pending' })
      .select()
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      // log failure
      try {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        const meta = getRequestMetadata(request as unknown as Request)
        await logActivityServer(supabase, {
          user_id: user.id,
          user_email: user.email || null,
          user_role: profile?.role || null,
          action: ActivityActions.APPOINTMENT_CREATE,
          target_table: 'appointments',
          description: `Failed to create appointment for child ${child_id}`,
          metadata: { child_id, doctor_id, scheduled_for },
          status: 'failure',
          error_message: error.message,
          ip_address: meta.ip_address,
          user_agent: meta.user_agent,
        })
      } catch (logErr) {
        console.error('Failed to log appointment creation failure:', logErr)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // log success
    try {
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      const meta = getRequestMetadata(request as unknown as Request)
      await logActivityServer(supabase, {
        user_id: user.id,
        user_email: user.email || null,
        user_role: profile?.role || null,
        action: ActivityActions.APPOINTMENT_CREATE,
        target_table: 'appointments',
        target_id: appointment.id,
        description: `${profile?.full_name || user.email} booked appointment for child ${child_id}`,
        metadata: { child_id, doctor_id, scheduled_for },
        status: 'success',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      })
    } catch (logErr) {
      console.error('Failed to log appointment creation:', logErr)
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/appointments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
