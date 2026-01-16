'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ROLES = [
  { value: 'caregiver', label: 'Parent/Caregiver', icon: '👨‍👩‍👧', description: 'Book appointments for your children' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', description: 'Manage patient consultations' },
  { value: 'receptionist', label: 'Receptionist', icon: '🏥', description: 'Handle check-ins and front desk' },
  { value: 'lab_tech', label: 'Lab Technician', icon: '🔬', description: 'Process and manage lab results' },
  { value: 'pharmacist', label: 'Pharmacist', icon: '💊', description: 'Manage prescriptions and inventory' },
  { value: 'admin', label: 'Administrator', icon: '⚙️', description: 'System administration and settings' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showVerifyMsg, setShowVerifyMsg] = useState(false)
  const [selectedRole, setSelectedRole] = useState('caregiver')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          full_name: formData.get('full_name'),
          role: selectedRole,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      // Show verification message instead of redirecting immediately
      setShowVerifyMsg(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-pink-100 rounded-full mb-4">
            <span className="text-2xl sm:text-3xl">👋</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">Create your account</h1>
          <p className="text-sm sm:text-base text-slate-600">Join thousands of families who trust us with their children&apos;s care</p>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="text-red-800 font-medium">Oops! Something went wrong</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Verification Message */}
        {showVerifyMsg ? (
          <div aria-live="polite" className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <span className="text-blue-500 text-lg">📧</span>
            <div>
              <p className="text-blue-800 font-medium">Verify your email</p>
              <p className="text-blue-600 text-sm">
                We&apos;ve sent a verification link to your email. Please check your inbox and verify your email before signing in.
              </p>
            </div>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Role Selection */}
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 mb-2">I am registering as</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  htmlFor={`role-${role.value}`}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 active:scale-[0.98] ${selectedRole === role.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <input
                    id={`role-${role.value}`}
                    name="role"
                    type="radio"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl" aria-hidden>{role.icon}</span>
                    <div>
                      <p className={`text-xs sm:text-sm font-medium leading-tight ${selectedRole === role.value ? 'text-blue-700' : 'text-slate-700'}`}>{role.label}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {ROLES.find(r => r.value === selectedRole)?.description}
            </p>
          </fieldset>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Your full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Jane Muthoni"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow placeholder:text-slate-400 text-[16px] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              aria-describedby="email-note"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow placeholder:text-slate-400 text-[16px] sm:text-sm"
            />
            <p id="email-note" className="mt-1.5 text-xs text-slate-500">We&apos;ll send important notifications here</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Create a password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              aria-describedby="password-hint"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow placeholder:text-slate-400 text-[16px] sm:text-sm"
            />
            <p id="password-hint" className="mt-1.5 text-xs text-slate-500">Use at least 6 characters. Consider adding numbers or symbols for a stronger password.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            aria-busy={loading}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating your account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>

        {/* Trust Badge */}
        <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  )
}