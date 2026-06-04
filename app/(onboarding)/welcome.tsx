import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

const FREE_LANGUAGE_PILLS = ['English', 'Thai', 'Español', 'Tiếng Việt', 'Tagalog', 'Kreyòl']

export default function Welcome() {
  const router = useRouter()

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-cream">
      <View className="flex-1 px-6 pt-20 pb-12 justify-between">
        <View>
          <Text
            className="text-coral text-5xl font-bold mb-2"
            accessibilityRole="header"
          >
            AceTalks
          </Text>
          <Text className="text-charcoal text-2xl font-semibold mb-4">
            Every voice, every language.
          </Text>
          <Text className="text-charcoal/70 text-base leading-relaxed mb-10">
            Symbol-based communication boards with natural-sounding speech — in the
            languages your family actually speaks.
          </Text>

          <Text className="text-charcoal/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Free languages included
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FREE_LANGUAGE_PILLS.map((lang) => (
              <View
                key={lang}
                className="bg-teal-light rounded-full px-3 py-1"
                accessible
                accessibilityLabel={lang}
              >
                <Text className="text-teal-dark text-sm font-medium">{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel="Get started"
          accessibilityHint="Navigates to language selection"
          onPress={() => router.push('/(onboarding)/language')}
          className="bg-coral rounded-2xl items-center justify-center"
          style={{ minHeight: 56 }}
        >
          <Text className="text-white font-bold text-lg">Get started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
