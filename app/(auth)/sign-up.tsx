import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { useSignUp, useClerk } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'

// SHIELD: Parent/caregiver creates the account — child does not have an account.
// COPPA: age-gate and parental consent are handled in onboarding (ACET-004/018).
export default function SignUp() {
  // WHY: In @clerk/expo v3, setActive moved to useClerk(). fetchStatus replaces isLoaded.
  const { signUp, fetchStatus } = useSignUp()
  const { setActive } = useClerk()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)

  const isReady = fetchStatus !== 'fetching'

  const handleSignUp = async () => {
    if (!isReady || loading) return
    setError('')
    setLoading(true)
    try {
      const { error: signUpError } = await signUp.create({
        emailAddress: email.trim(),
        password,
      })
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      // WHY: @clerk/expo v3 types signUp as SignUpFutureResource before create().
      // After create() succeeds, the reactive signUp object is a full SignUpResource
      // at runtime. Cast to any to access verification methods — safe post-create.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (signUp as any).prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch {
      setError('Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!isReady || loading) return
    setError('')
    setLoading(true)
    try {
      // WHY: Same runtime-safe cast as above — signUp is a full resource post-create.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: verifyError } = await (signUp as any).attemptEmailAddressVerification({ code })
      if (verifyError) {
        setError(verifyError.message)
        return
      }
      if (signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId! })
        router.replace('/')
      }
    } catch {
      setError('Verification failed. Check your code.')
    } finally {
      setLoading(false)
    }
  }

  const errorBlock = error ? (
    <Text accessible accessibilityRole="alert" className="text-red-500 text-sm mb-4">
      {error}
    </Text>
  ) : (
    <View className="mb-4" />
  )

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
          {!pendingVerification ? (
            <>
              <Text className="text-charcoal text-3xl font-bold mb-2">Create account</Text>
              <Text className="text-charcoal/60 text-base mb-8">
                Set up your caregiver account to get started
              </Text>

              <Text className="text-charcoal text-sm font-semibold mb-1">Email address</Text>
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
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                className="bg-white border border-gray-200 rounded-xl px-4 text-charcoal text-base mb-2"
                style={{ minHeight: 48 }}
              />

              {errorBlock}

              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityState={{ disabled: loading || !isReady }}
                onPress={handleSignUp}
                disabled={loading || !isReady}
                className="bg-coral rounded-xl items-center justify-center mb-4"
                style={{ minHeight: 52 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">Create account</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center">
                <Text className="text-charcoal/60 text-sm">Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity
                    accessible
                    accessibilityRole="link"
                    accessibilityLabel="Go to sign in"
                  >
                    <Text className="text-coral font-semibold text-sm">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          ) : (
            <>
              <Text className="text-charcoal text-3xl font-bold mb-2">Check your email</Text>
              <Text className="text-charcoal/60 text-base mb-8">
                We sent a verification code to {email}
              </Text>

              <Text className="text-charcoal text-sm font-semibold mb-1">Verification code</Text>
              <TextInput
                accessible
                accessibilityLabel="Verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                className="bg-white border border-gray-200 rounded-xl px-4 text-charcoal text-base mb-2"
                style={{ minHeight: 48 }}
              />

              {errorBlock}

              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="Verify email"
                accessibilityState={{ disabled: loading }}
                onPress={handleVerify}
                disabled={loading}
                className="bg-coral rounded-xl items-center justify-center"
                style={{ minHeight: 52 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">Verify email</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
