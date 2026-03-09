import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logActivityServer } from '@/lib/activity-logger'

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

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. ✅ Find supplier by `id`, not `user_id`
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', user.id)  // ✅ correct
    .single()

  if (supplierError || !supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  // 3. Fetch orders for this supplier
  const { data: orders, error } = await supabase
    .from('supply_orders')
    .select(`
      *,
      medications:medications(name)
    `)
    .eq('supplier_id', supplier.id)
    .order('requested_at', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }

  return NextResponse.json({ data: orders })
}

export async function PATCH(req: Request) {
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

  // ✅ Verify supplier
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', user.id)
    .single()

  if (supplierError || !supplier) {
    return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 })
  }

  // Update order status
  const { orderId, status } = await req.json()
  const { error } = await supabase
    .from('supply_orders')
    .update({ status, delivered_at: status === 'delivered' ? new Date().toISOString() : null })
    .eq('id', orderId)
    .eq('supplier_id', supplier.id) // ensure order belongs to this supplier

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log supply order status update
  await logActivityServer(supabase, {
    user_id: user.id,
    action: status === 'delivered' ? 'delivery_receive' : 'supply_order_update',
    target_table: 'supply_orders',
    target_id: orderId,
    description: `Supplier updated order ${orderId} status to ${status}`,
    metadata: { order_id: orderId, new_status: status },
  })

  return NextResponse.json({ success: true })
}