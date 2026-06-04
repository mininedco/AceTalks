import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const ONBOARDING_KEY = 'acetalks_onboarding_complete'

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth()
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) =>
      setOnboardingDone(val === 'true')
    )
  }, [isSignedIn])

  // Clerk is still initializing
  if (!isLoaded) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator color="#E8673B" />
      </View>
    )
  }

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  // Checking SecureStore for onboarding flag
  if (onboardingDone === null) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator color="#E8673B" />
      </View>
    )
  }

  if (!onboardingDone) return <Redirect href="/(onboarding)/welcome" />
  return <Redirect href="/(tabs)/" />
}
