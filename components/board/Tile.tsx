import { Animated, Text, TouchableOpacity, View } from 'react-native'
import { useRef } from 'react'
import { useReducedMotion } from 'react-native-reanimated'
import type { Tile as TileType } from '../../types'
import type { LanguageCode } from '../../types'

export interface TileProps {
  tile: TileType
  language: LanguageCode
  onPress: (label: string) => void
  onPressIn?: (tileId: string, language: LanguageCode) => void
  size?: 'normal' | 'large'
}

const SIZE = {
  normal: { container: 80, icon: 24, label: 13 },
  large:  { container: 96, icon: 32, label: 16 },
}

export default function Tile({ tile, language, onPress, onPressIn, size = 'normal' }: TileProps) {
  const reducedMotion = useReducedMotion()
  const scale = useRef(new Animated.Value(1)).current
  const dim = SIZE[size]

  const label = tile.labelTranslations[language] ?? tile.labelTranslations['en'] ?? ''

  function handlePressIn() {
    if (!reducedMotion) {
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 0 }).start()
    }
    onPressIn?.(tile.id, language)
  }

  function handlePressOut() {
    if (!reducedMotion) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
    }
  }

  const bgStyle = tile.bgColor ? { backgroundColor: tile.bgColor } : undefined

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint="Double tap to speak this word"
        accessibilityRole="button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(label)}
        style={[
          {
            width: dim.container,
            height: dim.container,
            minWidth: 44,
            minHeight: 44,
          },
          bgStyle,
        ]}
        className="items-center justify-center rounded-2xl bg-white border border-gray-200 p-1 shadow-sm"
      >
        {/* Image placeholder — real images in ACET-013/014 */}
        {tile.imageUrl ? (
          <View
            style={{ width: dim.icon * 2, height: dim.icon * 2 }}
            className="rounded-lg bg-gray-100 mb-1"
            accessible={false}
          />
        ) : (
          <View
            style={{ width: dim.icon * 2, height: dim.icon * 2 }}
            className="rounded-lg bg-gray-100 mb-1"
            accessible={false}
          />
        )}
        <Text
          style={{ fontSize: dim.label, lineHeight: dim.label * 1.3 }}
          className="text-charcoal font-semibold text-center"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {label || '—'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
