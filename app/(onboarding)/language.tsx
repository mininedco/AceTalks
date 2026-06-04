import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { FREE_LANGUAGES } from '../../constants/languages'
import { useOnboardingStore } from '../../store/onboardingStore'
import { LanguageCode } from '../../types'

export default function LanguageSelect() {
  const router = useRouter()
  const { language, setLanguage } = useOnboardingStore()

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code)
  }

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <Text
          className="text-charcoal text-3xl font-bold mb-2"
          accessibilityRole="header"
        >
          Choose a language
        </Text>
        <Text className="text-charcoal/60 text-base mb-8">
          Pick the primary language for the communication board. You can add a
          second language later.
        </Text>

        <View className="gap-3">
          {FREE_LANGUAGES.map((lang) => {
            const selected = language === lang.code
            return (
              <TouchableOpacity
                key={lang.code}
                accessible
                accessibilityRole="radio"
                accessibilityLabel={`${lang.name} — ${lang.nativeName}`}
                accessibilityState={{ selected }}
                onPress={() => handleSelect(lang.code)}
                className={`rounded-2xl px-5 flex-row items-center justify-between border-2 ${
                  selected
                    ? 'bg-teal-light border-teal'
                    : 'bg-white border-gray-100'
                }`}
                style={{ minHeight: 64 }}
              >
                <View>
                  <Text
                    className={`text-base font-semibold ${
                      selected ? 'text-teal-dark' : 'text-charcoal'
                    }`}
                  >
                    {lang.name}
                  </Text>
                  <Text className="text-charcoal/50 text-sm">{lang.nativeName}</Text>
                </View>
                {selected && (
                  <View className="w-6 h-6 rounded-full bg-teal items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <View className="mt-8">
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
            onPress={() => router.push('/(onboarding)/who-for')}
            className="bg-coral rounded-2xl items-center justify-center"
            style={{ minHeight: 56 }}
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}
