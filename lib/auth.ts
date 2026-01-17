// Role helpers and guards
import { createClient } from './supabase/server'
import type { UserRole } from './rbac'
import { text, html } from 'framer-motion/client'
import { string } from 'zod'


export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getSession()
  if (!user) return null
  return (user.app_metadata?.role ?? user.user_metadata?.role) as UserRole | null
}

export async function requireRole(allowed: UserRole[]) {
  const user = await getSession()
  if (!user) return { allowed: false as const, reason: 'unauthenticated' }

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as UserRole | undefined
  if (!role || !allowed.includes(role)) {
    return { allowed: false as const, reason: 'forbidden' }
  }
  return { allowed: true as const, role, user }
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) {
  // Use the Resend-based sendEmail from lib/email
  const { sendEmail: resendSendEmail } = await import('./email');
  return resendSendEmail({ to, subject, text, html });
}