import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data: { user } } = await supabase.auth.getUser()

        // Allow clients to post logs; if authenticated, attach user info
        const logEntry = {
            user_id: user?.id || null,
            user_email: body.user_email || user?.email || null,
            user_role: body.user_role || null,
            action: body.action,
            action_type: body.action_type || null,
            action_category: body.action_category || null,
            target_table: body.target_table || null,
            target_id: body.target_id || null,
            resource_name: body.resource_name || null,
            description: body.description || null,
            metadata: body.metadata || {},
            status: body.status || 'success',
            error_message: body.error_message || null,
            changes: body.changes || null,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            user_agent: request.headers.get('user-agent') || null,
        }

        const { data, error } = await supabase.from('audit_logs').insert(logEntry).select().single()

        if (error) {
            console.error('Failed to create activity log:', error)
            return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Error in /api/activity-logs POST:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Use POST to submit activity logs' })
}
