import { View, Text } from 'react-native'

interface HeaderProps {
  title: string
  rightElement?: React.ReactNode
}

export default function Header({ title, rightElement }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <Text
        className="text-charcoal text-xl font-bold"
        accessibilityRole="header"
      >
        {title}
      </Text>
      {rightElement}
    </View>
  )
}
