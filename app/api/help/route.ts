import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')

    // Start building the query on the help_categories table
    let query = supabase
      .from('help_categories')
      .select('id, title, icon, description, display_order')
      .eq('is_active', true)

    // If your hook passes a specific section title or ID, filter here
    if (section) {
      // Assuming 'section' refers to the title. If it's an ID, use .eq('id', section)
      query = query.ilike('title', `%${section}%`)
    }

    // Always sort by display_order so the UI is consistent
    const { data, error } = await query.order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Help Content Fetch Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch help categories' },
      { status: 500 }
    )
  }
}