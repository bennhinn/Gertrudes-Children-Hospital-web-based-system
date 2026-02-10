'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Stethoscope, 
  Building2, 
  Microscope, 
  Pill, 
  Settings,
  Hand,
  AlertCircle,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Info,
  ShieldCheck
} from 'lucide-react'

const ROLES = [
  { value: 'caregiver', label: 'Parent/Caregiver', icon: Users, description: 'Book appointments for your children' },
  { value: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'Manage patient consultations' },
  { value: 'receptionist', label: 'Receptionist', icon: Building2, description: 'Handle check-ins and front desk' },
  { value: 'lab_tech', label: 'Lab Technician', icon: Microscope, description: 'Process and manage lab results' },
  { value: 'pharmacist', label: 'Pharmacist', icon: Pill, description: 'Manage prescriptions and inventory' },
  { value: 'admin', label: 'Administrator', icon: Settings, description: 'System administration and settings' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('caregiver')
  const [showPassword, setShowPassword] = useState(false)

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

      // Redirect to login page after successful registration
      router.push('/login?registered=true')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-6 sm:px-6 sm:py-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/50 p-5 sm:p-8 lg:p-10 max-w-3xl mx-auto border border-white/50"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl mb-4 shadow-xl shadow-blue-500/30"
          >
            <Hand className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Create your account
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Join thousands of families who trust us with their children&apos;s care</p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              role="alert"
              className="mb-6 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-semibold">Oops! Something went wrong</p>
                  <p className="text-red-600 text-sm mt-0.5">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-5 sm:space-y-6"
        >
          {/* Role Selection */}
          <motion.fieldset
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <legend className="block text-sm font-semibold text-slate-700 mb-3">I am registering as</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ROLES.map((role, index) => {
                const IconComponent = role.icon
                return (
                  <motion.label
                    key={role.value}
                    htmlFor={`role-${role.value}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedRole === role.value
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md shadow-blue-200/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md hover:shadow-slate-200/50'
                    }`}
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
                      <motion.div
                        animate={{ scale: selectedRole === role.value ? 1.1 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconComponent 
                          className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                            selectedRole === role.value ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-700'
                          }`}
                          strokeWidth={1.5}
                        />
                      </motion.div>
                      <div>
                        <p className={`text-xs sm:text-sm font-semibold leading-tight ${
                          selectedRole === role.value ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {role.label}
                        </p>
                      </div>
                    </div>
                  </motion.label>
                )
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={selectedRole}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5"
              >
                <Info className="w-4 h-4 text-blue-500" />
                {ROLES.find(r => r.value === selectedRole)?.description}
              </motion.p>
            </AnimatePresence>
          </motion.fieldset>

          {/* Full Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-2">
              Your full name
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" strokeWidth={1.5} />
              </div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                required
                placeholder="e.g. Jane Muthoni"
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 text-[16px] sm:text-sm"
              />
            </div>
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email address
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" strokeWidth={1.5} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                required
                placeholder="you@example.com"
                aria-describedby="email-note"
                className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 text-[16px] sm:text-sm"
              />
            </div>
            <p id="email-note" className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              We&apos;ll send important notifications here
            </p>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Create a password
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" strokeWidth={1.5} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                required
                minLength={6}
                placeholder="At least 6 characters"
                aria-describedby="password-hint"
                className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 text-[16px] sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
            <p id="password-hint" className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Use at least 6 characters. Consider adding numbers or symbols for a stronger password.
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            aria-busy={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="relative w-full h-12 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            )}
            <span className="relative inline-flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating your account...
                </>
              ) : (
                'Create Account'
              )}
            </span>
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200"
        >
          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline">
              Sign in instead
            </Link>
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"
        >
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Your information is secure and encrypted</span>
        </motion.div>
      </motion.div>
    </div>
  )
}