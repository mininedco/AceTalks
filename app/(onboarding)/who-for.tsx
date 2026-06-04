import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useSupabaseWithAuth } from '../../hooks/useSupabaseWithAuth'
import { AgeGroup, GridSize } from '../../types'

// SHIELD: age_group = 'child' triggers COPPA flow — no communicator is created
// until parental consent is collected. See ACET-018 for the full consent screen.
const ONBOARDING_KEY = 'acetalks_onboarding_complete'

const AGE_OPTIONS: { label: string; description: string; value: AgeGroup; gridSize: GridSize }[] = [
  {
    label: 'A child',
    description: 'Under 13 — parental consent required',
    value: 'child',
    gridSize: '3x3',
  },
  {
    label: 'An adult',
    description: 'Ages 13 and up',
    value: 'adult',
    gridSize: '3x3',
  },
  {
    label: 'An elderly person',
    description: 'Larger tiles and simpler grid',
    value: 'elderly',
    gridSize: '2x3',
  },
]

export default function WhoFor() {
  const router = useRouter()
  const { user } = useUser()
  const { language, reset } = useOnboardingStore()
  const supabase = useSupabaseWithAuth()

  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!ageGroup || !user) return

    // SHIELD: Child profile — route to parental consent first (ACET-018).
    // No data is written until consent is recorded.
    if (ageGroup === 'child') {
      router.push('/(onboarding)/consent')
      return
    }

    setLoading(true)
    try {
      const selected = AGE_OPTIONS.find((o) => o.value === ageGroup)!

      const { error } = await supabase.from('communicators').insert({
        owner_id: user.id,
        display_name: 'My Communicator',
        age_group: ageGroup,
        primary_language: language,
        grid_size: selected.gridSize,
      })

      if (error) throw error

      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true')
      reset()
      router.replace('/(tabs)/')
    } catch (err) {
      Alert.alert(
        'Something went wrong',
        'Could not create your profile. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <Text
          className="text-charcoal text-3xl font-bold mb-2"
          accessibilityRole="header"
        >
          Who is this for?
        </Text>
        <Text className="text-charcoal/60 text-base mb-8">
          This helps us set the right board size and features.
        </Text>

        <View className="gap-3 mb-8">
          {AGE_OPTIONS.map((option) => {
            const selected = ageGroup === option.value
            return (
              <TouchableOpacity
                key={option.value}
                accessible
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={option.description}
                accessibilityState={{ selected }}
                onPress={() => setAgeGroup(option.value)}
                className={`rounded-2xl px-5 py-4 border-2 ${
                  selected ? 'bg-coral-light border-coral' : 'bg-white border-gray-100'
                }`}
                style={{ minHeight: 72 }}
              >
                <Text
                  className={`text-base font-semibold mb-0.5 ${
                    selected ? 'text-coral-dark' : 'text-charcoal'
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-charcoal/50 text-sm">{option.description}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !ageGroup || loading }}
          onPress={handleContinue}
          disabled={!ageGroup || loading}
          className={`rounded-2xl items-center justify-center ${
            ageGroup ? 'bg-coral' : 'bg-gray-200'
          }`}
          style={{ minHeight: 56 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={`font-bold text-lg ${ageGroup ? 'text-white' : 'text-gray-400'}`}
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
