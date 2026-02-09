import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer, getRequestMetadata, ActivityActions } from '@/lib/activity-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const id = request.nextUrl.pathname.split('/').pop()

    const { data: appointment, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (error) {
      console.error('Error fetching appointment:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (err) {
    console.error('Error in GET /api/appointments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const id = request.url.split('/').pop()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: before } = await supabase.from('appointments').select('*').eq('id', id).single()

    const { data: updated, error } = await supabase.from('appointments').update(body).eq('id', id).select().single()
    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      const meta = getRequestMetadata(request as unknown as Request)
      await logActivityServer(supabase, {
        user_id: user.id,
        user_email: user.email || null,
        user_role: profile?.role || null,
        action: ActivityActions.APPOINTMENT_UPDATE,
        action_type: 'update',
        target_table: 'appointments',
        target_id: id,
        description: `${profile?.full_name || user.email} updated appointment ${id}`,
        metadata: { changes: { before, after: updated } },
        status: 'success',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      })
    } catch (logErr) {
      console.error('Failed to log appointment update:', logErr)
    }

    return NextResponse.json({ appointment: updated })
  } catch (err) {
    console.error('Error in PUT /api/appointments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const id = request.url.split('/').pop()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: before, error: fetchErr } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (fetchErr) {
      console.error('Error fetching appointment before delete:', fetchErr)
    }

    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) {
      console.error('Error deleting appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      const meta = getRequestMetadata(request as unknown as Request)
      await logActivityServer(supabase, {
        user_id: user.id,
        user_email: user.email || null,
        user_role: profile?.role || null,
        action: ActivityActions.APPOINTMENT_CANCEL,
        action_type: 'delete',
        target_table: 'appointments',
        target_id: id,
        description: `${profile?.full_name || user.email} deleted appointment ${id}`,
        metadata: { before },
        status: 'success',
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
      })
    } catch (logErr) {
      console.error('Failed to log appointment delete:', logErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/appointments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
