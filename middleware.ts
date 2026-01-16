import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PROTECTED_ROUTES, getDashboardForRole, type UserRole } from '@/lib/rbac'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth', '/api/qr', '/callback']
  const isPublic = publicPaths.some(p =>
    request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/')
  )

  // Static assets are always public
  const isStaticAsset = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/images') ||
    request.nextUrl.pathname.includes('.')

  if (isStaticAsset) {
    return supabaseResponse
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // For authenticated users, check role-based access
  if (user && !isPublic) {
    try {
      // Get user's role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = (profile?.role || 'caregiver') as UserRole
      const pathname = request.nextUrl.pathname

      // Check if trying to access a protected route
      for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
        if (pathname.startsWith(route)) {
          // Admin can access everything
          if (userRole === 'admin') {
            return supabaseResponse
          }

          // Check if user's role is allowed
          if (!allowedRoles.includes(userRole)) {
            // Redirect to their appropriate dashboard
            const url = request.nextUrl.clone()
            url.pathname = getDashboardForRole(userRole)
            return NextResponse.redirect(url)
          }
          break
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      // On error, allow access but log it
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}