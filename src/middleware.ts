import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me'

interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'CLIENT'
}

// Edge-compatible token verification using jose
async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Routes that require authentication (handled by page components now)
const protectedRoutes: string[] = []
const adminRoutes: string[] = []
const authRoutes: string[] = []

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from cookies
  const token = request.cookies.get('accessToken')?.value

  // Debug logging
  console.log('[Middleware]', pathname, 'Token exists:', !!token)

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Verify token if exists (async for jose)
  const payload = token ? await verifyTokenEdge(token) : null

  if (isProtectedRoute || isAdminRoute) {
    console.log('[Middleware]', pathname, 'Payload:', payload ? 'valid' : 'null')
  }

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if trying to access auth routes while logged in
  if (isAuthRoute && payload) {
    const dashboardUrl = new URL(
      payload.role === 'ADMIN' ? '/admin' : '/dashboard',
      request.url
    )
    return NextResponse.redirect(dashboardUrl)
  }

  // Check admin access
  if (isAdminRoute && payload && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CSRF protection for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const csrfCookie = request.cookies.get('csrfToken')?.value

    // Skip CSRF for auth routes (login/register)
    const isAuthApi = pathname.startsWith('/api/auth/')

    if (!isAuthApi && csrfToken !== csrfCookie) {
      // For now, we'll be lenient during development
      // In production, uncomment the following:
      // return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }
  }

  return NextResponse.next()
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
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
}
