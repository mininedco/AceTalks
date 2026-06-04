import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import { PostHogProvider } from 'posthog-react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Platform } from 'react-native'

// WHY: expo-secure-store is native only. On web, Clerk uses its own cookie/localStorage.
// Passing undefined on web lets Clerk fall back to its built-in web storage.
const tokenCache =
  Platform.OS === 'web'
    ? undefined
    : {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key)
          } catch {
            await SecureStore.deleteItemAsync(key)
            return null
          }
        },
        async saveToken(key: string, value: string) {
          try {
            await SecureStore.setItemAsync(key, value)
          } catch {}
        },
        async clearToken(key: string) {
          await SecureStore.deleteItemAsync(key)
        },
      }

// WHY: PostHog is only active for non-child profiles. The provider is mounted
// unconditionally here; screens gate capture calls behind an age_group check.
// Apple Kids Category rules prohibit third-party analytics on child-facing screens.
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? ''
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'

// TODO: ACET-017 — Initialize Sentry.wrap around the root component
export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: POSTHOG_HOST }}>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaProvider>
        </PostHogProvider>
      </ClerkLoaded>
    </ClerkProvider>
  )
}
