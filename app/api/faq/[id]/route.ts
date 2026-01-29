import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET single FAQ item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const id = parseInt(params.id)

    // 1. Increment view count using an RPC (Remote Procedure Call)
    // This is the cleanest way to do an atomic increment in Supabase/Postgres
    await supabase.rpc('increment_faq_views', { item_id: id })

    // 2. Fetch from your view 'faq_with_categories'
    const { data, error } = await supabase
      .from('faq_with_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'FAQ item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Error fetching FAQ item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQ item' },
      { status: 500 }
    )
  }
}

// PUT - Update FAQ item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const id = parseInt(params.id)
    const body = await request.json()
    const { category_id, question, answer, tags, display_order } = body

    const { data, error } = await supabase
      .from('help_items')
      .update({
        category_id,
        question,
        answer,
        tags,
        display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Error updating FAQ item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ item' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete FAQ item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const id = parseInt(params.id)

    const { data, error } = await supabase
      .from('help_items')
      .update({ is_active: false })
      .eq('id', id)
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'FAQ item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting FAQ item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ item' },
      { status: 500 }
    )
  }
}