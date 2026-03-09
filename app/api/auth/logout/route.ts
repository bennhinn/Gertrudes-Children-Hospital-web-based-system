// app/api/auth/logout/route.ts
import { supabaseServer } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { logActivityServer, ActivityActions } from '@/lib/activity-logger'

export async function POST() {
  const supabase = supabaseServer()

  // Get user info before signing out so we can log the event
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    await logActivityServer(supabase, {
      user_id: user.id,
      user_email: user.email,
      user_role: profile?.role,
      action: ActivityActions.USER_LOGOUT,
      target_table: 'auth',
      description: `User ${user.email} logged out`,
    })
  }

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