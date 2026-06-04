import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Tabs } from 'expo-router'

export default function TabsLayout() {
  const { isSignedIn } = useAuth()

  // Protect all tab routes — redirect to sign-in if not authenticated
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E8673B',
        tabBarInactiveTintColor: '#9B8F88',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#F0EBE6' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="boards" options={{ title: 'Boards' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
