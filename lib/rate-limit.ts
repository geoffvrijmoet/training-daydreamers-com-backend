/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis-based rate limiting (Upstash, Vercel KV)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier?: string; // Custom identifier (defaults to IP)
}

/**
 * Simple rate limiter
 * @param request - Request object
 * @param options - Rate limit options
 * @returns Object with allowed status and remaining requests
 */
export function rateLimit(
  request: Request,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, maxRequests, identifier } = options;

  // Get identifier (IP address or custom)
  const key = identifier || getClientIP(request);

  const now = Date.now();
  const record = store[key];

  // Clean up expired entries periodically (simple cleanup)
  if (Math.random() < 0.01) {
    // 1% chance to clean up on each request
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  if (!record || record.resetTime < now) {
    // Create new record or reset expired one
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  // Check various headers for IP (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (shouldn't happen in production)
  return 'unknown';
}

/**
 * Rate limit middleware helper for Next.js API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  options: RateLimitOptions
) {
  return async (request: Request): Promise<Response> => {
    const limit = rateLimit(request, options);

    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': limit.remaining.toString(),
            'X-RateLimit-Reset': limit.resetTime.toString(),
            'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request);
    response.headers.set('X-RateLimit-Limit', options.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', limit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', limit.resetTime.toString());

    return response;
  };
}




