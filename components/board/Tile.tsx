import { TouchableOpacity, Text, View } from 'react-native'

// TODO: ACET-006 — Full Tile component with audio-on-press, accessibility, 44pt touch target
// ACCESS: Must have accessibilityLabel, accessibilityHint, accessibilityRole, minWidth/Height 44pt
export default function Tile() {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Tile"
      accessibilityHint="Double tap to speak"
      className="min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-white border border-gray-200 p-2"
    >
      <View>
        <Text className="text-charcoal text-lg text-center">Tile</Text>
      </View>
    </TouchableOpacity>
  )
}
