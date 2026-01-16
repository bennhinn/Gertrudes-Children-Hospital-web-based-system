

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { Suspense } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    const registered = searchParams.get('registered') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const err = searchParams.get('error')

    if (registered || verified) setShowSuccess(true)
    if (err) setError(err)
  }, [searchParams])

  async function handleOAuth(provider: 'google' | 'apple') {
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/callback` },
      })
    } catch {
      setError('Unable to start social login. Please try email instead.')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      // Check if email is confirmed
      if (!data.user?.email_confirmed_at) {
        setError('Please verify your email address before signing in. Check your inbox for a verification link.')
        setLoading(false)
        return
      }

      // Get user role from profiles table (source of truth)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Fallback to app_metadata if profile not found
      const userRole = profile?.role || data.user?.app_metadata?.role || 'caregiver'

      const roleRedirects: Record<string, string> = {
        admin: '/admin',
        doctor: '/doctor',
        receptionist: '/receptionist',
        lab_tech: '/lab',
        pharmacist: '/pharmacy',
        supplier: '/supplier',
        caregiver: '/dashboard',
        staff: '/staff-appointments',
      }
      const redirectPath = roleRedirects[userRole] || '/dashboard'

      router.push(redirectPath)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="relative flex min-h-dvh w-full flex-col lg:flex-row">
        {/* Background Image - visible on all screens */}
        <div
          className="fixed inset-0 bg-cover bg-center lg:relative lg:min-h-screen lg:basis-3/5 lg:flex-none"
          style={{ backgroundImage: "url('/images/locations/sign-in.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/20 lg:bg-black/10" />
          <div className="absolute bottom-6 left-6 hidden text-sm font-medium text-white/80 lg:block">
            {"Gertrude's Children Hospital © 2024"}
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-5 py-8 sm:px-8 lg:basis-2/5 lg:flex-none lg:bg-white lg:py-12">
          {/* Glass card container for mobile, transparent on desktop */}
          <div className="w-full max-w-sm rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            {/* Logo */}
            <div className="mb-8 flex justify-center lg:mb-10">
              <Link href="/">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg">
                  🏥
                </span>
              </Link>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-center text-2xl font-semibold text-slate-700 sm:text-3xl lg:mb-8">
              Log in
            </h1>

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
                Success! Your account is ready. Please sign in.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Login Buttons */}
            <div className="space-y-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/40 bg-white/60 px-5 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a10.99 10.99 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0 0 12 1 10.99 10.99 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/40 bg-white/60 px-5 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={() => setShowEmailForm((v) => !v)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/40 bg-white/60 px-5 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.25 5.25a1.5 1.5 0 0 1-1.5 0L3.75 6.75" />
                </svg>
                Continue with email
              </button>
            </div>

            {/* Email Form */}
            {showEmailForm && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-3.5 text-[16px] text-slate-700 backdrop-blur-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm lg:border-slate-200 lg:bg-white lg:backdrop-blur-none"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <a href="#" className="text-sm text-blue-600 hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-3.5 text-[16px] text-slate-700 backdrop-blur-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm lg:border-slate-200 lg:bg-white lg:backdrop-blur-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-slate-600">
              {"Don't have an account? "}
              <Link href="/register" className="font-medium text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  )
}