import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Stack } from 'expo-router'

export default function AuthLayout() {
  const { isSignedIn } = useAuth()

  // Already signed in — bounce back to root so index.tsx can handle routing
  if (isSignedIn) return <Redirect href="/" />

  return <Stack screenOptions={{ headerShown: false }} />
}
