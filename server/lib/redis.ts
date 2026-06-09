// SHIELD: Server-only. Never import from client/Expo code.
// WHY: Upstash Redis uses an HTTP REST API — no persistent TCP connection needed.
// This works in Railway serverless containers and survives restarts/sleeps.
// Rate limit state persists across container restarts, unlike an in-memory Map.
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
  }
  return new Redis({ url, token })
}

// 30 requests per 60-second sliding window per identifier (IP or user ID)
let _ratelimit: Ratelimit | null = null

export function getTtsRatelimit(): Ratelimit {
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: 'acetalks:tts',
      analytics: false,
    })
  }
  return _ratelimit
}
