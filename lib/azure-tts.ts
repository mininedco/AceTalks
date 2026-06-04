// Client-side TTS helper — calls the Node.js /api/tts endpoint.
// WHY: Azure key is server-side only. The client never contacts Azure directly.
// The server generates audio, caches it in R2, and returns a public URL.

import type { LanguageCode } from '../types'

const TTS_ENDPOINT = process.env.EXPO_PUBLIC_TTS_API_URL ?? ''

export interface TtsResult {
  url: string
}

export interface TtsError {
  message: string
}

export async function fetchTtsUrl(text: string, language: LanguageCode): Promise<TtsResult> {
  if (!TTS_ENDPOINT) {
    throw new Error('EXPO_PUBLIC_TTS_API_URL is not set')
  }
  const res = await fetch(`${TTS_ENDPOINT}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `TTS request failed: ${res.status}`)
  }
  return res.json() as Promise<TtsResult>
}
