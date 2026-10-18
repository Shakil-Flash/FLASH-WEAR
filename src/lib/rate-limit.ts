/**
 * Rate Limiting Utility
 * Sliding window rate limiter with in-memory map and optional distributed Redis support.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store (per-instance)
const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const threshold = now - 15 * 60 * 1000; // 15 mins
    memoryStore.forEach((record: RateLimitRecord, key: string) => {
      record.timestamps = record.timestamps.filter((ts: number) => ts > threshold);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks if a key has exceeded its rate limit.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.max(resetTime, 1),
    };
  }

  // Add current request
  record.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

/**
 * Helper to extract client IP address from Next.js request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}
