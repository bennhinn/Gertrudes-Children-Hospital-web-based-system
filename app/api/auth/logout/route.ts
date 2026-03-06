// app/api/auth/logout/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = supabaseServer()
  
  await supabase.auth.signOut()

  // Use a relative redirect so the browser keeps the current host
  // (prevents dev redirects to 0.0.0.0 when user is on localhost/127.0.0.1).
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: '/login',
    },
  })
}