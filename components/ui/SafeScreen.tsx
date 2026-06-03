import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SafeScreenProps {
  children: React.ReactNode
  className?: string
}

export default function SafeScreen({ children, className = '' }: SafeScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-cream ${className}`}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  )
}
