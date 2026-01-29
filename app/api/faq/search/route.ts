import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 })
    }
    
    // Use .rpc() to call your custom PostgreSQL function 'search_faq'
    // Ensure the parameter name in the object ({ search_query: query }) 
    // matches the argument name defined in your SQL function.
    const { data, error } = await supabase.rpc('search_faq', {
      search_query: query // Change this key if your SQL function uses a different parameter name
    }).limit(limit)

    if (error) {
      console.error('Supabase RPC error:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      query: query,
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error searching FAQs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search FAQs' },
      { status: 500 }
    )
  }
}