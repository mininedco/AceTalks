import { Redirect } from 'expo-router'

// TODO: ACET-003 — Check Clerk auth state and redirect accordingly:
//   - Unauthenticated → /(onboarding)/welcome
//   - Authenticated, no communicator → /(onboarding)/who-for
//   - Authenticated, has communicator → /(tabs)/
export default function Index() {
  return <Redirect href="/(tabs)/" />
}
