import { hashIp } from './utils'

interface RateLimitEntry {
  count: number
  windowStart: number
}

const stores: Map<string, Map<string, RateLimitEntry>> = new Map()

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  return stores.get(name)!
}

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number,
  storeName: string = 'default'
): { allowed: boolean; retryAfter?: number } {
  const store = getStore(storeName)
  const now = Date.now()
  const ipHash = hashIp(ip)
  const entry = store.get(ipHash)

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(ipHash, { count: 1, windowStart: now })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (now - entry.windowStart > 3600000) { // 1 hour
        store.delete(key)
      }
    }
  }
}, 300000) // Every 5 minutes
