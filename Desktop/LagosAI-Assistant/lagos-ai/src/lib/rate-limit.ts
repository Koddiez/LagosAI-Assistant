// Simple in-memory rate limiter
// In production, use Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Function to generate rate limit key
}

export function rateLimit(options: RateLimitOptions) {
  return async (request: Request) => {
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : getDefaultKey(request)

    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      })
      return { success: true, remaining: options.maxRequests - 1 }
    }

    if (entry.count >= options.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        error: 'Rate limit exceeded'
      }
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)

    return { success: true, remaining: options.maxRequests - entry.count }
  }
}

function getDefaultKey(request: Request): string {
  // Use IP address + path as key
  // Note: In production, get real IP from headers like x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  const url = new URL(request.url)
  return `${ip}:${url.pathname}`
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute