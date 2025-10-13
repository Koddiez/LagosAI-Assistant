import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Middleware: Supabase environment variables not configured')
    // Allow the request to continue without auth checks
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Middleware: Auth error:', error)
      // Allow the request to continue without auth checks
      return supabaseResponse
    }
    user = authUser
  } catch (err) {
    console.error('Middleware: Unexpected auth error:', err)
    // Allow the request to continue without auth checks
    return supabaseResponse
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/simulator', '/analytics']
  const authRoutes = ['/auth']
  const onboardingRoutes = ['/onboarding']

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isOnboardingRoute = onboardingRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is authenticated but hasn't completed onboarding, redirect to onboarding
  if (user && !isOnboardingRoute && !isAuthRoute) {
    try {
      // Check if user has completed onboarding (has agents)
      console.log('Middleware: Checking onboarding for user:', user.id)
      const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (agentError) {
        console.error('Middleware: Error querying agents:', agentError)
        // If we can't check agents, allow access to dashboard (fail open)
      } else {
        console.log('Middleware: Found agents:', agents?.length || 0)
        if (!agents || agents.length === 0) {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
      }
    } catch (err) {
      console.error('Middleware: Unexpected error checking agents:', err)
      // Allow access to dashboard on error (fail open)
    }
  }

  // This will refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}