import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  );
}

export async function GET() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('supply_orders')
    .select(`
      *,
      medications (name)
    `)
    .eq('supplier_id', user.id)
    .order('requested_at', { ascending: false });

  return NextResponse.json({ data, error });
}
export async function PATCH(request: Request) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, status } = await request.json();

  // 1. Fetch the order details first to get medication_id and quantity
  const { data: order, error: orderError } = await supabase
    .from('supply_orders')
    .select('medication_id, quantity, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // 2. LOGIC: If moving to 'approved', deduct stock
  if (status === 'approved' && order.status === 'pending') {
    // Check current stock levels
    const { data: med } = await supabase
      .from('medications')
      .select('stock')
      .eq('id', order.medication_id)
      .single();

    if (!med || med.stock < order.quantity) {
      return NextResponse.json({ error: "Insufficient stock to approve this order" }, { status: 400 });
    }

    // Deduct stock from medications table
    await supabase
      .from('medications')
      .update({ stock: med.stock - order.quantity })
      .eq('id', order.medication_id);
  }

  // 3. Update the order status
  const { data, error } = await supabase
    .from('supply_orders')
    .update({ 
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null 
    })
    .eq('id', orderId)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}