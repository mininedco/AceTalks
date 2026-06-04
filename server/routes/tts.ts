// POST /api/tts
// body: { text: string, language: LanguageCode }
// SHIELD: AZURE_TTS_KEY is server-side only — never returned to client.
// SHIELD: Rate limited to 30 req/min per IP to prevent quota abuse.

import { Hono } from 'hono'
import { ttsKey, getCachedUrl, uploadAudio } from '../../lib/r2-cache'
import { getLanguage } from '../../constants/languages'
import type { LanguageCode } from '../../types'
import { z } from 'zod'

const app = new Hono()

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  language: z.string(),
})

// Simple in-memory rate limiter (per IP, 30 req/60s)
// WHY: Prevents a single user from exhausting the Azure TTS free tier quota.
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

app.post('/', async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429)
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

  const ssml = `
    <speak version="1.0" xml:lang="${lang}" xmlns="http://www.w3.org/2001/10/synthesis">
      <voice name="${langConfig.azureVoice}">
        ${text.replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch] ?? ch))}
      </voice>
    </speak>
  `.trim()

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
