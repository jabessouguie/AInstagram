/**
 * Lightweight in-memory rate limiter using a sliding-window algorithm.
 * Suitable for Next.js serverless environments (per-instance, not shared across workers).
 * For multi-instance production use, replace the backing store with Upstash Redis.
 */

/** Map of key → sorted list of request timestamps (ms). */
const store = new Map<string, number[]>();

/**
 * Checks whether the caller identified by `key` is within the allowed rate.
 * Mutates the internal store — call once per request.
 *
 * @param key - Unique identifier for the rate-limit bucket (e.g. IP address + route).
 * @param maxRequests - Maximum number of requests allowed within the window.
 * @param windowMs - Sliding window duration in milliseconds.
 * @returns True if the request is allowed, false if the limit has been reached.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Keep only timestamps within the current window
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) return false;

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

/**
 * Returns the X-RateLimit-* headers to include in the HTTP response.
 *
 * @param key - Same key used in `checkRateLimit`.
 * @param maxRequests - Limit used in `checkRateLimit`.
 * @param windowMs - Window used in `checkRateLimit`.
 */
export function rateLimitHeaders(
  key: string,
  maxRequests: number,
  windowMs: number
): Record<string, string> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff);
  const remaining = Math.max(0, maxRequests - timestamps.length);
  const reset = Math.ceil((now + windowMs) / 1000); // Unix timestamp

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
