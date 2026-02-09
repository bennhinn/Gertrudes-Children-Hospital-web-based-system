'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 lg:bg-gradient-to-br lg:from-black/20 lg:via-transparent lg:to-black/10" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute bottom-6 left-6 hidden text-sm font-medium text-white/90 lg:block"
          >
            {"Gertrude's Children Hospital © 2024"}
          </motion.div>
        </div>

        {/* Right Section - Login Form */}
        <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center px-5 py-8 sm:px-8 lg:basis-2/5 lg:flex-none lg:bg-white lg:py-12">
          {/* Glass card container for mobile, transparent on desktop */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-sm rounded-2xl bg-white/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
          >
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              className="mb-8 flex justify-center lg:mb-10"
            >
              <Link href="/">
                <motion.span 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-3xl text-white shadow-xl ring-4 ring-blue-100/50 transition-shadow hover:shadow-2xl"
                >
                  🏥
                </motion.span>
              </Link>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6 text-center text-2xl font-semibold text-slate-800 sm:text-3xl lg:mb-8"
            >
              Welcome back
            </motion.h1>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center text-sm font-medium text-green-800 shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Success! Your account is ready. Please sign in.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 text-center text-sm font-medium text-red-800 shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-3"
            >
              {/* Google Button */}
              <motion.button
                type="button"
                onClick={() => handleOAuth('google')}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/50 bg-white/70 px-5 py-3.5 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a10.99 10.99 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0 0 12 1 10.99 10.99 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </motion.button>

              {/* Apple Button */}
              <motion.button
                type="button"
                onClick={() => handleOAuth('apple')}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/50 bg-white/70 px-5 py-3.5 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </motion.button>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/50 lg:border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/70 px-3 text-slate-500 lg:bg-white">Or</span>
                </div>
              </div>

              {/* Email Button */}
              <motion.button
                type="button"
                onClick={() => setShowEmailForm((v) => !v)}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/50 bg-white/70 px-5 py-3.5 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg active:scale-[0.98] lg:border-slate-200 lg:bg-white lg:backdrop-blur-none lg:hover:bg-slate-50"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.25 5.25a1.5 1.5 0 0 1-1.5 0L3.75 6.75" />
                </svg>
                Continue with email
                <motion.svg 
                  animate={{ rotate: showEmailForm ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-4 w-4 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>
            </motion.div>

            {/* Email Form */}
            <AnimatePresence>
              {showEmailForm && (
                <motion.form 
                  onSubmit={handleSubmit}
                  data-form-type="other"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="mt-6 space-y-4 overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email address
                    </label>
                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <svg className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.25 5.25a1.5 1.5 0 0 1-1.5 0L3.75 6.75" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        required
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/50 bg-white/70 py-3.5 pl-11 pr-4 text-[16px] text-slate-700 shadow-sm backdrop-blur-sm placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm lg:border-slate-200 lg:bg-white lg:backdrop-blur-none"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <a href="#" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <div className="group relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <svg className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute('readonly')}
                        required
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-white/50 bg-white/70 py-3.5 pl-11 pr-12 text-[16px] text-slate-700 shadow-sm backdrop-blur-sm placeholder:text-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 sm:text-sm lg:border-slate-200 lg:bg-white lg:backdrop-blur-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
                      >
                        {showPassword ? (
                          <motion.svg
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </motion.svg>
                        ) : (
                          <motion.svg
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </motion.svg>
                        )}
                      </button>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {loading && (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {loading ? 'Signing in...' : 'Sign In'}
                    </span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer link */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8 text-center text-sm text-slate-600"
            >
              {"Don't have an account? "}
              <Link href="/register" className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                Sign up
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </Suspense>
  )
}