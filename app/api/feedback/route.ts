import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer } from '@/lib/activity-logger'

// POST - Submit feedback
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { type, content } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Feedback content is required' }, { status: 400 })
        }

        // Insert feedback
        const { data: feedback, error: insertError } = await supabase
            .from('feedback')
            .insert({
                user_id: user.id,
                type: type || 'general',
                content: content.trim()
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error inserting feedback:', insertError)
            return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
        }

        // Log feedback submission
        await logActivityServer(supabase, {
            user_id: user.id,
            action: 'feedback_submit',
            action_type: 'create',
            action_category: 'other',
            target_table: 'feedback',
            target_id: feedback.id,
            description: `User submitted ${type || 'general'} feedback`,
            metadata: { feedback_type: type || 'general' },
        })

        return NextResponse.json({
            success: true,
            message: 'Thank you for your feedback!',
            feedback
        })

    } catch (error) {
        console.error('Error in POST /api/feedback:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET - Get user's previous feedback (optional)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: feedback, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('Error fetching feedback:', error)
            return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
        }

        return NextResponse.json({ feedback: feedback || [] })

    } catch (error) {
        console.error('Error in GET /api/feedback:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
