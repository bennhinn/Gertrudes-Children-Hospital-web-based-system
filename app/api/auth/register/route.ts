import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['caregiver', 'doctor', 'lab_tech', 'pharmacist', 'supplier', 'receptionist', 'admin'] as const

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  role: z.enum(VALID_ROLES).default('caregiver'),
})

// Map roles to their respective database tables
const ROLE_TABLES: Record<string, string | null> = {
  caregiver: 'caregivers',
  doctor: 'doctors',
  lab_tech: 'lab_technicians',
  pharmacist: 'pharmacists',
  supplier: 'suppliers',
  receptionist: 'receptionists',
  admin: null, // admins don't need a separate table
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Register request received:', { email: body.email, role: body.role, name: body.full_name })

    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, full_name, role } = parsed.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create auth user with email_confirmed_at set (auto-verified)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This auto-confirms the email
      user_metadata: { full_name },
      app_metadata: { role },
    })

    if (error) {
      console.error('Auth createUser FAILED:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      return NextResponse.json(
        { error: `Auth error creating user: ${error.message}` },
        { status: 400 }
      )
    }

    const userId = data.user.id

    // Create profile entry (if trigger doesn't exist or fails)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        role,
      })
      .select()

    if (profileError) {
      console.error('Profile creation FAILED:', {
        error: profileError,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        userId,
        role
      })
      return NextResponse.json(
        { error: `Database error creating profile: ${profileError.message}` },
        { status: 400 }
      )
    }

    console.log('Profile created successfully for user:', userId)

    // Create role-specific entry
    const roleTable = ROLE_TABLES[role]
    if (roleTable) {
      const { error: roleError } = await supabase
        .from(roleTable)
        .insert({ id: userId })
        .select()

      if (roleError) {
        console.error(`Role table (${roleTable}) creation FAILED:`, {
          error: roleError,
          message: roleError.message,
          details: roleError.details,
          hint: roleError.hint,
          userId,
          roleTable
        })
        return NextResponse.json(
          { error: `Database error creating ${role} entry: ${roleError.message}` },
          { status: 400 }
        )
      }

      console.log(`Role entry created successfully in ${roleTable} for user:`, userId)
    }

    console.log('✅ User registered successfully:', userId)

    return NextResponse.json(
      { 
        user: { id: data.user.id, email: data.user.email },
        message: 'Registration successful. You can now log in.'
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}