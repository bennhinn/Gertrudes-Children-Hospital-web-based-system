import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Debug logging (remove in production)
  console.log('Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('Service Role Key:', serviceRoleKey ? `SET (length: ${serviceRoleKey.length})` : 'MISSING')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
