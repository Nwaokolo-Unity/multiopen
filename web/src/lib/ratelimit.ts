import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const cache = new Map<string, Ratelimit>()

export async function rateLimit(key: string, max: number, window: string) {
  if (!cache.has(window)) {
    cache.set(window, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window as any),
    }))
  }
  const limiter = cache.get(window)!
  const result = await limiter.limit(key)
  if (!result.success) throw new Error('RATE_LIMIT')
}
