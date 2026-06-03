import { View, Text } from 'react-native'

// TODO: ACET-004 — Language selection screen: pick primary + secondary language
// ACCESS: Each language option must meet 44pt touch target and 4.5:1 contrast
export default function LanguageSelect() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-charcoal text-lg">Choose Language</Text>
    </View>
  )
}
