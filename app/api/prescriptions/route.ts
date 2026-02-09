import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer, getRequestMetadata, ActivityActions } from '@/lib/activity-logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { child_id, doctor_id, medication_name, dosage, duration, quantity, instructions } = body

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({ child_id, doctor_id, medication_name, dosage, duration, quantity, instructions, prescribed_at: new Date().toISOString() })
      .select()
      .single()

    if (error) {
      console.error('Error creating prescription:', error)
      try {
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        const meta = getRequestMetadata(request as unknown as Request)
        await logActivityServer(supabase, {
          user_id: user.id,
          user_email: user.email || null,
          user_role: profile?.role || null,
          action: ActivityActions.PRESCRIPTION_CREATE,
          target_table: 'prescriptions',
          description: `Failed to create prescription for child ${child_id}`,
          metadata: { medication_name, dosage, duration, quantity },
          status: 'failure',
          error_message: error.message,
          ip_address: meta.ip_address,
          user_agent: meta.user_agent,
        })
      } catch (logErr) {
        console.error('Failed to log prescription failure:', logErr)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      const meta = getRequestMetadata(request as unknown as Request)
      await logActivityServer(supabase, {
        user_id: user.id,
        user_email: user.email || null,
        user_role: profile?.role || null,
        action: ActivityActions.PRESCRIPTION_CREATE,
        target_table: 'prescriptions',
        target_id: prescription.id,
        description: `${profile?.full_name || user.email} prescribed ${medication_name} for child ${child_id}`,
        metadata: { medication_name, dosage, duration, quantity },
        status: 'success',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      })
    } catch (logErr) {
      console.error('Failed to log prescription creation:', logErr)
    }

    return NextResponse.json({ prescription }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/prescriptions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
