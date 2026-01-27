import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Fetch all orders for status distribution
  const { data: orders } = await supabase
    .from('supply_orders')
    .select('status, quantity')
    .eq('supplier_id', user.id);

  // 2. Fetch inventory for stock health
  const { data: meds } = await supabase
    .from('medications')
    .select('name, stock')
    .eq('supplier_id', user.id);

  // Process Stats
  const statusCounts = orders?.reduce((acc: any, curr: any) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const totalOrders = orders?.length || 0;
  const deliveryRate = totalOrders > 0 
    ? Math.round(((statusCounts['delivered'] || 0) / totalOrders) * 100) 
    : 0;

  const lowStockCount = meds?.filter(m => m.stock < 20).length || 0;

  return NextResponse.json({
    summary: {
      totalOrders,
      deliveryRate,
      lowStockCount,
      activeInventory: meds?.length || 0
    },
    statusCounts,
    inventoryHealth: meds?.map(m => ({
      name: m.name,
      stock: m.stock,
      status: m.stock < 20 ? 'Critical' : 'Healthy'
    })).sort((a, b) => a.stock - b.stock).slice(0, 5) // Show top 5 lowest
  });
}