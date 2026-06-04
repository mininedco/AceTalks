import { useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useHomeBoardData } from '../../hooks/useHomeBoardData'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useTtsAudio } from '../../hooks/useTtsAudio'
import TileGrid from '../../components/board/TileGrid'
import SentenceStrip from '../../components/board/SentenceStrip'
import { FREE_LANGUAGES } from '../../constants/languages'
import type { LanguageCode } from '../../types'

// Skeleton tile placeholder for loading state
function SkeletonTile({ size }: { size: number }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="mx-1 rounded-2xl bg-gray-100 animate-pulse"
      accessible={false}
    />
  )
}

function SkeletonGrid({ columns }: { columns: number }) {
  const tileSize = columns <= 2 ? 96 : 80
  const rows = columns <= 2 ? 3 : 3
  return (
    <View className="flex-1 p-3" accessible={false}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} className="flex-row justify-center mb-2" accessible={false}>
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonTile key={c} size={tileSize} />
          ))}
        </View>
      ))}
    </View>
  )
}

export default function HomeBoardScreen() {
  const { communicator, board, tiles, isLoading, error, refetch } = useHomeBoardData()
  const storeLanguage = useOnboardingStore((s) => s.language)
  const { playAudio } = useTtsAudio()

  // Active language: starts at communicator primary language, toggles with badge
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode | null>(null)

  const language: LanguageCode = activeLanguage ?? communicator?.primaryLanguage ?? storeLanguage

  // Sentence strip words state (full implementation in ACET-008)
  const [words, setWords] = useState<string[]>([])

  const handleTilePress = useCallback((label: string) => {
    setWords((prev) => [...prev, label])
  }, [])

  const handleTilePressIn = useCallback((tileId: string, lang: LanguageCode) => {
    // Look up the label from tiles by id and play audio immediately
    const tile = tiles.find((t) => t.id === tileId)
    if (!tile) return
    const label = tile.labelTranslations[lang] ?? tile.labelTranslations['en'] ?? ''
    if (label) playAudio(label, lang)
  }, [tiles, playAudio])

  // Language toggle cycles primary ↔ secondary if secondary is set
  function handleLanguageToggle() {
    if (!communicator?.secondaryLanguage) return
    const primary = communicator.primaryLanguage
    const secondary = communicator.secondaryLanguage
    setActiveLanguage((prev) => {
      const current = prev ?? primary
      return current === primary ? secondary : primary
    })
  }

  const columns = communicator?.ageGroup === 'elderly' ? 2 : 3
  const canToggle = !!communicator?.secondaryLanguage
  const langLabel = FREE_LANGUAGES.find((l) => l.code === language)?.code.toUpperCase() ?? language.toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-cream">
      {/* ── Header ─────────────────────────────────────────── */}
      <View
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
        accessible={false}
      >
        <Text className="flex-1 text-charcoal text-lg font-bold" accessibilityRole="header">
          {board?.name ?? 'Home Board'}
        </Text>

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Language: ${langLabel}. ${canToggle ? 'Tap to switch language.' : 'No secondary language set.'}`}
          accessibilityState={{ disabled: !canToggle }}
          onPress={handleLanguageToggle}
          disabled={!canToggle}
          className="px-3 py-1 rounded-full bg-teal-light border border-teal"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-teal font-bold text-sm">{langLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Body ───────────────────────────────────────────── */}
      <View className="flex-1">
        {isLoading ? (
          <SkeletonGrid columns={columns} />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text
              accessible
              accessibilityRole="alert"
              className="text-charcoal/60 text-base text-center mb-4"
            >
              {error}
            </Text>
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="Retry loading board"
              onPress={refetch}
              className="bg-coral rounded-xl px-6 py-3"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Text className="text-white font-semibold">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : tiles.length === 0 ? (
          /* Empty state */
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-charcoal text-xl font-bold mb-2 text-center">
              No tiles yet
            </Text>
            <Text className="text-charcoal/60 text-base text-center mb-6">
              Add tiles to start communicating
            </Text>
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="Add your first tile"
              className="bg-coral rounded-2xl px-8 py-4"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Text className="text-white font-bold text-lg">+ Add tile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <TileGrid
              tiles={tiles}
              language={language}
              columns={columns}
              onTilePress={handleTilePress}
              onTilePressIn={handleTilePressIn}
            />
          </ScrollView>
        )}
      </View>

      {/* ── Sentence strip — always at bottom ─────────────── */}
      <SentenceStrip />
    </SafeAreaView>
  )
}
