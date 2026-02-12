import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Correct: filter by id, not user_id
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', user.id)
    .single()

  if (supplierError || !supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  const { data: invoices, error } = await supabase
    .from('supplier_invoices')
    .select(`
      *,
      supply_order:supply_orders!purchase_order_id(
        po_number,
        requested_at,
        delivered_at,
        medication:medications(name)
      )
    `)
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }

  return NextResponse.json({ data: invoices })
}