import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!isLoaded || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email.trim(), password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/')
      }
    } catch (err: unknown) {
      const clerr = err as { errors?: { message: string }[] }
      setError(clerr.errors?.[0]?.message ?? 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-12">
          <Text className="text-charcoal text-3xl font-bold mb-2">Welcome back</Text>
          <Text className="text-charcoal/60 text-base mb-8">
            Sign in to continue to AceTalks
          </Text>

          <Text className="text-charcoal text-sm font-semibold mb-1">
            Email address
          </Text>
          <TextInput
            accessible
            accessibilityLabel="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            className="bg-white border border-gray-200 rounded-xl px-4 text-charcoal text-base mb-4"
            style={{ minHeight: 48 }}
          />

          <Text className="text-charcoal text-sm font-semibold mb-1">Password</Text>
          <TextInput
            accessible
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            className="bg-white border border-gray-200 rounded-xl px-4 text-charcoal text-base mb-2"
            style={{ minHeight: 48 }}
          />

          {error ? (
            <Text
              accessible
              accessibilityRole="alert"
              className="text-red-500 text-sm mb-4"
            >
              {error}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: loading || !isLoaded }}
            onPress={handleSignIn}
            disabled={loading || !isLoaded}
            className="bg-coral rounded-xl items-center justify-center mb-4"
            style={{ minHeight: 52 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign in</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-charcoal/60 text-sm">Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity
                accessible
                accessibilityRole="link"
                accessibilityLabel="Go to sign up"
              >
                <Text className="text-coral font-semibold text-sm">Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
