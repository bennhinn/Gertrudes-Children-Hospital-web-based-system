// app/api/auth/logout/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = supabaseServer()
  
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}