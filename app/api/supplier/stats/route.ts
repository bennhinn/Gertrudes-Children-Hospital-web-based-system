import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Your Queries
  const { count: totalMeds } = await supabase
    .from('medications')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', user.id)

  const { count: lowStock } = await supabase
    .from('medications')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', user.id)
    .lt('stock', 20)

  const { count: pendingOrders } = await supabase
    .from('supply_orders')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', user.id)
    .eq('status', 'pending')

  return NextResponse.json({
    totalMeds: totalMeds || 0,
    lowStock: lowStock || 0,
    pendingOrders: pendingOrders || 0,
  })
}