import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useSentenceStore } from '../../store/sentenceStore'
import { useTtsAudio } from '../../hooks/useTtsAudio'
import { useOnboardingStore } from '../../store/onboardingStore'

// ACCESS: Strip must always be visible — it lives outside the scroll view.
// ACCESS: Speak button is the primary action: largest element, distinct coral bg.
// ACCESS: Each word pill is individually removable with a clear tap target.
export default function SentenceStrip() {
  const words = useSentenceStore((s) => s.words)
  const removeWord = useSentenceStore((s) => s.removeWord)
  const clear = useSentenceStore((s) => s.clear)
  const language = useOnboardingStore((s) => s.language)
  const { playAudio } = useTtsAudio()

  function handleSpeak() {
    if (words.length === 0) return
    const sentence = words.join(' ')
    playAudio(sentence, language)
    clear()
  }

  return (
    <View
      className="bg-white border-t border-gray-100 px-3 py-2"
      accessible={false}
    >
      <View className="flex-row items-center min-h-[52px]">
        {/* ── Word pills ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 8 }}
          className="flex-1 mr-2"
          accessible={false}
        >
          {words.length === 0 ? (
            <Text
              className="text-charcoal/40 text-base italic"
              accessible={false}
            >
              Tap a tile to start…
            </Text>
          ) : (
            words.map((word, idx) => (
              <TouchableOpacity
                key={idx}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Remove "${word}" from sentence`}
                accessibilityHint="Double tap to remove this word"
                onPress={() => removeWord(idx)}
                className="bg-coral/10 border border-coral/30 rounded-xl px-3 py-1 mr-1"
                style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-coral font-semibold text-base">{word}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* ── Controls ────────────────────────────────────── */}
        <View className="flex-row items-center gap-2" accessible={false}>
          {words.length > 0 && (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear sentence"
              accessibilityHint="Double tap to remove all words"
              onPress={clear}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              className="rounded-xl bg-gray-100 px-3"
            >
              <Text className="text-charcoal/60 font-bold text-base">✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={words.length === 0 ? 'Speak sentence — add words first' : 'Speak sentence'}
            accessibilityHint="Double tap to speak the full sentence aloud"
            accessibilityState={{ disabled: words.length === 0 }}
            onPress={handleSpeak}
            disabled={words.length === 0}
            style={{ minWidth: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center' }}
            className={`rounded-2xl px-5 ${words.length === 0 ? 'bg-coral/30' : 'bg-coral'}`}
          >
            <Text className="text-white font-bold text-base">▶ Speak</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
