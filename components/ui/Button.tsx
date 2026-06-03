import { TouchableOpacity, Text } from 'react-native'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  accessibilityHint?: string
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-coral',
    secondary: 'bg-teal',
    ghost: 'bg-transparent border border-charcoal',
  }

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-6 py-3 ${variantStyles[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base font-semibold ${variant === 'ghost' ? 'text-charcoal' : 'text-white'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
