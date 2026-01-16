import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle auth errors from Supabase (expired links, invalid tokens, etc.)
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || 'Verification failed')}`,
        request.url
      )
    )
  }

  // If no code, something went wrong
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=Missing verification code', request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Exchange the code for a session (sets cookies via SSR helper)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.user) {
      console.error('Token exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError?.message || 'Verification failed')}`,
          request.url
        )
      )
    }

    // Get user role from app_metadata
    const userRole = data.user?.app_metadata?.role || 'caregiver'

    // Redirect based on role to appropriate dashboard
    const roleRedirects: Record<string, string> = {
      admin: '/admin',
      doctor: '/doctor',
      receptionist: '/receptionist',
      lab_tech: '/lab',
      pharmacist: '/pharmacy',
      supplier: '/supplier',
      caregiver: '/dashboard',
    }

    const redirectPath = roleRedirects[userRole] || '/dashboard'

    // Redirect to dashboard with success flag; cookies already set by helper
    return NextResponse.redirect(new URL(`${redirectPath}?verified=true`, request.url))
  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(
      new URL(
        '/login?error=An unexpected error occurred during verification',
        request.url
      )
    )
  }
}
