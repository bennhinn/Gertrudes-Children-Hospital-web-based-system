import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer, getRequestMetadata, ActivityActions } from '@/lib/activity-logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { appointment_id, doctor_id, child_id, notes, diagnosis } = body

    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert({ appointment_id, doctor_id, child_id, notes, diagnosis, completed_at: new Date().toISOString() })
      .select()
      .single()

    if (error) {
      console.error('Error creating consultation:', error)
      try {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        const meta = getRequestMetadata(request as unknown as Request)
        await logActivityServer(supabase, {
          user_id: user.id,
          user_email: user.email || null,
          user_role: profile?.role || null,
          action: ActivityActions.CONSULTATION_COMPLETE,
          target_table: 'consultations',
          description: `Failed to create consultation for appointment ${appointment_id}`,
          metadata: { appointment_id, child_id },
          status: 'failure',
          error_message: error.message,
          ip_address: meta.ip_address,
          user_agent: meta.user_agent,
        })
      } catch (logErr) {
        console.error('Failed to log consultation failure:', logErr)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log success
    try {
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      const meta = getRequestMetadata(request as unknown as Request)
      await logActivityServer(supabase, {
        user_id: user.id,
        user_email: user.email || null,
        user_role: profile?.role || null,
        action: ActivityActions.CONSULTATION_COMPLETE,
        target_table: 'consultations',
        target_id: consultation.id,
        description: `${profile?.full_name || user.email} completed consultation for child ${child_id}`,
        metadata: { appointment_id, child_id, diagnosis },
        status: 'success',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      })
    } catch (logErr) {
      console.error('Failed to log consultation creation:', logErr)
    }

    return NextResponse.json({ consultation }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/consultations:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
