import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logActivityServer } from '@/lib/activity-logger';

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

// GET: List all medications for this supplier
export async function GET() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('supplier_id', user.id)
    .order('name');

  return NextResponse.json({ data, error });
}

// POST: Add new medication
export async function POST(request: Request) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from('medications')
    .insert([{
      ...body,
      supplier_id: user.id,
      stock: parseInt(body.stock)
    }])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Log the activity
  if (data && data[0]) {
    await logActivityServer(supabase, {
      user_id: user.id,
      action: 'MEDICATION_ADDED',
      target_table: 'medication',
      target_id: data[0].id,
      description: `New medication added: ${body.name}`,
      metadata: {
        medication_name: body.name,
        initial_stock: parseInt(body.stock),
        category: body.category
      },
      user_email: user.email || undefined,
      user_role: 'supplier'
    });
  }

  return NextResponse.json({ data });
}