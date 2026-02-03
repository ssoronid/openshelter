import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  const publicRoutes = ['/auth/signin', '/auth/signup', '/api/auth']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // API routes - allow public access to certain endpoints
  if (pathname.startsWith('/api')) {
    const publicApiRoutes = ['/api/auth', '/api/animals/public']
    const isPublicApi = publicApiRoutes.some((route) =>
      pathname.startsWith(route)
    )

    if (isPublicApi) {
      return NextResponse.next()
    }

    // Protect API routes
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Redirect logged-in users away from auth pages
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

