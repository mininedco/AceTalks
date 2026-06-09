// POST /api/tts
// body: { text: string, language: LanguageCode }
// SHIELD: AZURE_TTS_KEY is server-side only — never returned to client.
// SHIELD: Rate limited via Upstash Redis sliding window (30 req/60s per IP).
//         Persists across Railway container restarts — unlike an in-memory Map.

import { Hono } from 'hono'
import { ttsKey, getCachedUrl, uploadAudio } from '../../lib/r2-cache'
import { getLanguage } from '../../constants/languages'
import { getTtsRatelimit } from '../lib/redis'
import type { LanguageCode } from '../../types'
import { z } from 'zod'

const app = new Hono()

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  language: z.string(),
})

app.post('/', async (c) => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'

  // WHY: Upstash Redis sliding window survives container restarts.
  // Falls back to allowing the request if Redis is unreachable (graceful degradation)
  // so TTS never goes down due to a Redis outage.
  try {
    const ratelimit = getTtsRatelimit()
    const { success, remaining } = await ratelimit.limit(ip)
    if (!success) {
      return c.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        429,
        { 'X-RateLimit-Remaining': String(remaining) }
      )
    }
  } catch (err) {
    // Redis unavailable — log and continue (graceful degradation)
    console.error('[TTS] Rate limit check failed (Redis unavailable)', err)
  }

  const parsed = bodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body.' }, 400)
  }

  const { text, language } = parsed.data
  const lang = language as LanguageCode
  const langConfig = getLanguage(lang)

  if (!langConfig) {
    return c.json({ error: `Unsupported language: ${language}` }, 400)
  }

  const key = ttsKey(lang, text)

  // Check R2 cache first — zero Azure cost on cache hit
  const cached = await getCachedUrl(key)
  if (cached) {
    return c.json({ url: cached })
  }

  // Generate via Azure Neural TTS
  const azureKey = process.env.AZURE_TTS_KEY
  const azureRegion = process.env.AZURE_TTS_REGION ?? 'eastus'

  if (!azureKey) {
    console.error('[TTS] AZURE_TTS_KEY not set — cannot generate audio')
    return c.json({ error: 'TTS service unavailable.' }, 503)
  }

  const xmlEscape = (s: string) =>
    s.replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch] ?? ch))

  const ssml = `<speak version="1.0" xml:lang="${lang}" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${langConfig.azureVoice}">${xmlEscape(text)}</voice></speak>`

  const azureRes = await fetch(
    `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'AceTalks',
      },
      body: ssml,
    }
  )

  if (!azureRes.ok) {
    const detail = await azureRes.text().catch(() => '')
    console.error('[TTS] Azure error', azureRes.status, detail)
    return c.json({ error: 'TTS generation failed.' }, 502)
  }

  const audioBuffer = Buffer.from(await azureRes.arrayBuffer())
  console.info('[TTS] Generated', { language: lang, voice: langConfig.azureVoice, bytes: audioBuffer.length })

  const url = await uploadAudio(key, audioBuffer)
  return c.json({ url })
})

export default app
