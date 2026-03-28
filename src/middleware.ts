import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'CLIENT' | 'CLEANER'
}

// Edge-compatible token verification using jose
async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  try {
    const secretBytes = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, secretBytes)
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

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Verify token if exists (async for jose)
  const payload = token ? await verifyTokenEdge(token) : null

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if trying to access auth routes while logged in
  if (isAuthRoute && payload) {
    const dashboardUrl = new URL(
      payload.role === 'ADMIN' ? '/admin' : payload.role === 'CLEANER' ? '/cleaner' : '/dashboard',
      request.url
    )
    return NextResponse.redirect(dashboardUrl)
  }

  // Check admin access
  if (isAdminRoute && payload && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const response = NextResponse.next()

  // Generate CSRF token and set as non-httpOnly cookie so JS can read it
  if (!request.cookies.get('csrfToken')?.value) {
    const csrfToken = crypto.randomUUID()
    response.cookies.set('csrfToken', csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })
  }

  // CSRF protection for mutating API requests
  // NOTE: All 11 frontend files need to include 'x-csrf-token' header before enabling.
  // SameSite=lax on auth cookies provides baseline CSRF protection in the meantime.
  // To enable: read document.cookie for 'csrfToken' and add as 'x-csrf-token' header,
  // then uncomment the block below.
  //
  // if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
  //   const isAuthApi = pathname.startsWith('/api/auth/')
  //   if (!isAuthApi) {
  //     const csrfHeader = request.headers.get('x-csrf-token')
  //     const csrfCookie = request.cookies.get('csrfToken')?.value
  //     if (csrfHeader !== csrfCookie) {
  //       return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  //     }
  //   }
  // }

  return response
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
