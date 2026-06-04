import { useAuth } from '@clerk/expo'
import { Redirect, Stack } from 'expo-router'

export default function OnboardingLayout() {
  const { isSignedIn } = useAuth()

  // Onboarding requires being signed in (auth happens first)
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
}
