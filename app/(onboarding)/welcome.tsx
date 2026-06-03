import { View, Text } from 'react-native'

// TODO: ACET-004 — Welcome screen: app intro, tagline, get started CTA
export default function Welcome() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-charcoal text-lg">Welcome to AceTalks</Text>
    </View>
  )
}
