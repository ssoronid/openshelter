import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Allow all public routes
  const publicRoutes = ['/', '/signin', '/setup', '/api/auth', '/animals']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // API routes
  if (pathname.startsWith('/api')) {
    const publicApiRoutes = ['/api/auth', '/api/adoptions', '/api/setup', '/api/public', '/api/payments/mercadopago/webhook']
    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
    
    if (isPublicApi) {
      return NextResponse.next()
    }
    
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.next()
  }

  // Dashboard routes require auth
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    const signinUrl = new URL('/signin', req.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  // Redirect logged-in users from signin to dashboard
  if (pathname === '/signin' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
