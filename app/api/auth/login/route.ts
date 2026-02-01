import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logActivityServer } from '@/lib/activity-logger'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed login attempt
      await logActivityServer(supabase, {
        action: 'login_failed',
        target_table: 'auth',
        description: `Failed login attempt for ${email}`,
        user_email: email,
      })
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Get user role for logging
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Log successful login
    await logActivityServer(supabase, {
      user_id: data.user.id,
      user_email: email,
      user_role: userData?.role,
      action: 'user_login',
      target_table: 'auth',
      description: `User ${email} logged in successfully`,
    })

    return NextResponse.json({ user: data.user, session: data.session })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}