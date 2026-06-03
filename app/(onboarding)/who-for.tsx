import { View, Text } from 'react-native'

// TODO: ACET-004 — "Who is this for?" screen: sets age_group on CommunicatorProfile
// SHIELD: age_group = 'child' triggers COPPA flow and disables PostHog (ADR-009)
export default function WhoFor() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-charcoal text-lg">Who is this for?</Text>
    </View>
  )
}
