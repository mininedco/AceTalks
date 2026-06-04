import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

// SHIELD: COPPA gate — child communicator profile cannot be created until
// parental consent is collected and stored in parental_consents table.
// TODO: ACET-018 — implement the full parental consent flow here.
export default function Consent() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-cream px-6 pt-20 pb-12 justify-between">
      <View>
        <Text
          className="text-charcoal text-3xl font-bold mb-4"
          accessibilityRole="header"
        >
          Parental consent required
        </Text>
        <Text className="text-charcoal/70 text-base leading-relaxed mb-4">
          Because this profile is for a child under 13, we need a parent or guardian
          to review and accept our privacy policy before we can save any data.
        </Text>
        <View className="bg-coral-light rounded-2xl px-5 py-4">
          <Text className="text-coral-dark font-semibold text-sm">
            Full parental consent flow coming in a future update (ACET-018).
          </Text>
          <Text className="text-coral-dark/70 text-sm mt-1">
            In the meantime, set up an adult or elderly profile to explore the app.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel="Go back to who is this for"
        onPress={() => router.back()}
        className="bg-charcoal rounded-2xl items-center justify-center"
        style={{ minHeight: 56 }}
      >
        <Text className="text-white font-bold text-lg">Go back</Text>
      </TouchableOpacity>
    </View>
  )
}
