import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const popular = searchParams.get('popular') === 'true'

    let data, error;

    // 1. If there is a SEARCH term, use the RPC function we just fixed
    if (search) {
      const result = await supabase.rpc('search_faq', {
        search_query: search
      }).limit(limit)
      
      data = result.data
      error = result.error

      // If searching within a specific category, filter the results in-memory 
      // or add category_id logic to the RPC. For now, we filter the return:
      if (categoryId && data) {
        data = data.filter((item: any) => item.category_id === parseInt(categoryId))
      }
    } 
    
    // 2. If POPULAR is requested, use the popular_faqs view
    else if (popular) {
      let query = supabase.from('popular_faqs').select('*')
      if (categoryId) query = query.eq('category_id', categoryId)
      
      const result = await query.limit(limit)
      data = result.data
      error = result.error
    } 
    
    // 3. DEFAULT: Fetch from the main view
    else {
      let query = supabase.from('faq_with_categories').select('*')
      if (categoryId) query = query.eq('category_id', categoryId)
      
      const result = await query.order('display_order', { ascending: true }).limit(limit)
      data = result.data
      error = result.error
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error: any) {
    console.error('Error fetching FAQ items:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch FAQ items' },
      { status: 500 }
    )
  }
}

// POST - Create new FAQ item (remains mostly the same, but with enhanced error logging)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { category_id, question, answer, tags, display_order } = body
    
    if (!category_id || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: category_id, question, answer' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('help_items')
      .insert([
        { 
          category_id, 
          question, 
          answer, 
          tags: tags || [], 
          display_order: display_order || 999 
        }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating FAQ item:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create FAQ item' },
      { status: 500 }
    )
  }
}