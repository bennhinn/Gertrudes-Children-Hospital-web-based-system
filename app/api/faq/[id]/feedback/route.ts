import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Mark FAQ as helpful/unhelpful
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const id = parseInt(params.id)
    const body = await request.json()
    const { helpful, feedback_text } = body
    
    // 1. Update helpful count if marked as helpful
    if (helpful === true) {
      // Use the rpc function to increment atomically
      const { error: rpcError } = await supabase.rpc('increment_faq_helpful', { item_id: id })
      if (rpcError) throw rpcError
    }
    
    // 2. Store detailed feedback if provided
    if (feedback_text) {
      const { error: insertError } = await supabase
        .from('faq_feedback')
        .insert([
          { 
            help_item_id: id, 
            was_helpful: helpful, 
            feedback_text: feedback_text 
          }
        ])
      
      if (insertError) throw insertError
    }
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!'
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

// GET - Get feedback for an FAQ item (admin only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const id = parseInt(params.id)
    
    const { data, error } = await supabase
      .from('faq_feedback')
      .select('id, was_helpful, feedback_text, created_at')
      .eq('help_item_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}