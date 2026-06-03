import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// TODO: ACET-003 — Wrap with ClerkProvider (publishable key from EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
// TODO: ACET-017 — Add PostHogProvider (disabled for child profiles per ADR-009)
// TODO: ACET-017 — Initialize Sentry.wrap
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
