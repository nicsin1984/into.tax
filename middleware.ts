import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of spam/scraper bots to block (AI crawlers are allowed)
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'Bytespider',
  'PetalBot',
]

// Simple in-memory rate limiting (resets on deployment)
// For production, consider using Upstash Redis for persistent rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60 // 60 requests per minute per IP

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }
  
  record.count++
  
  if (record.count > MAX_REQUESTS) {
    return true
  }
  
  return false
}

// Clean up old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(ip)
    }
  }
}, 60 * 1000)

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check if the request is from a blocked bot
  const isBlockedBot = BLOCKED_BOTS.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  )
  
  if (isBlockedBot) {
    return new NextResponse('Access denied', { status: 403 })
  }
  
  // Rate limiting
  const clientIP = getClientIP(request)
  if (isRateLimited(clientIP)) {
    return new NextResponse('Too many requests. Please slow down.', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    })
  }
  
  return NextResponse.next()
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
