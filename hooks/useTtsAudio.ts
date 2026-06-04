import { useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import { fetchTtsUrl } from '../lib/azure-tts'
import type { LanguageCode } from '../types'

// In-memory URL cache — avoids re-fetching the same tile in one session
const urlCache = new Map<string, string>()

function cacheKey(text: string, language: LanguageCode): string {
  return `${language}:${text}`
}

interface UseTtsAudioReturn {
  playAudio: (text: string, language: LanguageCode) => void
}

// WHY: Audio plays on pres-down (onPressIn) for immediate feedback.
// Playback is fire-and-forget — we never block navigation waiting for audio.
// If TTS fails for any reason, we log the error and do nothing — the user
// still sees the text label and can communicate.
export function useTtsAudio(): UseTtsAudioReturn {
  const soundRef = useRef<Audio.Sound | null>(null)

  const playAudio = useCallback((text: string, language: LanguageCode) => {
    // Non-blocking: start the async work without awaiting it
    void (async () => {
      try {
        // Stop any currently playing audio immediately
        if (soundRef.current) {
          await soundRef.current.stopAsync().catch(() => {})
          await soundRef.current.unloadAsync().catch(() => {})
          soundRef.current = null
        }

        const key = cacheKey(text, language)
        let url = urlCache.get(key)

        if (!url) {
          const result = await fetchTtsUrl(text, language)
          url = result.url
          urlCache.set(key, url)
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, volume: 1.0 }
        )
        soundRef.current = sound

        // Unload after playback to free memory
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {})
            if (soundRef.current === sound) soundRef.current = null
          }
        })
      } catch (err) {
        // WHY: Graceful fallback — TTS failure must never crash or silence the user.
        // The tile label is still visible; the user can still communicate.
        console.error('[TTS] Playback failed', { text, language, err })
      }
    })()
  }, [])

  return { playAudio }
}
