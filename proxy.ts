import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getLimiterForPath } from '@/lib/rate-limit'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/api/inngest',
  '/api/google-search-api'
])

export default clerkMiddleware(async (auth, req) => {
  // 1. Clerk auth — protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // 2. Rate limiting — only for /api/* routes
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    const limiter = getLimiterForPath(pathname)

    // Some routes are exempt (e.g. /api/inngest)
    if (!limiter) {
      return NextResponse.next()
    }

    // Use Clerk userId as the rate-limit key; fall back to IP for public routes
    const { userId } = await auth()
    const identifier =
      userId ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'anonymous'

    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)

      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }

    // Attach rate-limit info as response headers for client observability
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(reset))
    return response
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}