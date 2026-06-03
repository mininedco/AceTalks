import { View, Text, TouchableOpacity } from 'react-native'

// TODO: ACET-008 — Sentence strip: word pills, Speak button, Clear button
// ACCESS: Strip must always be visible and persistent — never hidden on scroll
// ACCESS: Speak button must be the largest, most distinct element
export default function SentenceStrip() {
  return (
    <View className="flex-row items-center bg-teal-light px-4 py-3 border-t border-teal">
      <View className="flex-1 flex-row flex-wrap gap-2">
        <Text className="text-charcoal text-base">Sentence strip</Text>
      </View>
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Speak sentence"
        className="min-w-[44px] min-h-[44px] bg-coral rounded-xl px-6 py-3 items-center justify-center"
      >
        <Text className="text-white font-bold text-base">Speak</Text>
      </TouchableOpacity>
    </View>
  )
}
