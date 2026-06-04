import { useState, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native'
import { useHomeBoardData } from '../../hooks/useHomeBoardData'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useSentenceStore } from '../../store/sentenceStore'
import { useBoardStore } from '../../store/boardStore'
import { useBoardNavigation } from '../../hooks/useBoardNavigation'
import { useTtsAudio } from '../../hooks/useTtsAudio'
import TileGrid from '../../components/board/TileGrid'
import SentenceStrip from '../../components/board/SentenceStrip'
import { FREE_LANGUAGES } from '../../constants/languages'
import type { LanguageCode } from '../../types'

function SkeletonTile({ size }: { size: number }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="mx-1 rounded-2xl bg-gray-100"
      accessible={false}
    />
  )
}

function SkeletonGrid({ columns }: { columns: number }) {
  const tileSize = columns <= 2 ? 96 : 80
  return (
    <View className="flex-1 p-3" accessible={false}>
      {Array.from({ length: 3 }).map((_, r) => (
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
  const { communicator, board: homeBoard, tiles: homeTiles, isLoading, error, refetch } = useHomeBoardData()
  const storeLanguage = useOnboardingStore((s) => s.language)
  const addWord = useSentenceStore((s) => s.addWord)
  const { playAudio } = useTtsAudio()

  // Board store — current board is always top of stack
  const boardStack = useBoardStore((s) => s.stack)
  const setHome = useBoardStore((s) => s.setHome)
  const { navigateTo, goBack, goHome, canGoBack, isNavigating } = useBoardNavigation()

  // Seed the board store once the home board loads
  useEffect(() => {
    if (homeBoard && homeTiles) setHome(homeBoard, homeTiles)
  }, [homeBoard?.id])

  const current = boardStack.at(-1)
  const tiles = current?.tiles ?? []
  const boardName = current?.board.name ?? homeBoard?.name ?? 'Home Board'

  // Language toggle
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode | null>(null)
  const language: LanguageCode = activeLanguage ?? communicator?.primaryLanguage ?? storeLanguage

  const handleTilePress = useCallback((label: string) => {
    addWord(label)
  }, [addWord])

  const handleTilePressIn = useCallback((tileId: string, lang: LanguageCode) => {
    const tile = tiles.find((t) => t.id === tileId)
    if (!tile) return
    const label = tile.labelTranslations[lang] ?? tile.labelTranslations['en'] ?? ''
    if (label) playAudio(label, lang)
  }, [tiles, playAudio])

  // WHY: Link tiles navigate to a sub-board instead of adding a word
  const handleTilePressWithNav = useCallback((label: string) => {
    // Find the tile whose label matches — if it has a linkBoardId, navigate
    const tile = tiles.find(
      (t) => (t.labelTranslations[language] ?? t.labelTranslations['en']) === label
    )
    if (tile?.linkBoardId) {
      void navigateTo(tile.linkBoardId)
    } else {
      addWord(label)
    }
  }, [tiles, language, navigateTo, addWord])

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
        className="flex-row items-center px-3 py-2 bg-white border-b border-gray-100"
        accessible={false}
      >
        {canGoBack ? (
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back to previous board"
            onPress={goBack}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            className="mr-1"
          >
            <Text className="text-charcoal text-xl">‹</Text>
          </TouchableOpacity>
        ) : null}

        {canGoBack ? (
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go to home board"
            onPress={goHome}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            className="mr-2"
          >
            <Text className="text-teal text-base">⌂</Text>
          </TouchableOpacity>
        ) : null}

        <Text
          className="flex-1 text-charcoal text-lg font-bold"
          accessibilityRole="header"
          numberOfLines={1}
        >
          {boardName}
        </Text>

        {isNavigating && (
          <ActivityIndicator size="small" color="#085041" className="mr-2" accessible={false} />
        )}

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Language: ${langLabel}. ${canToggle ? 'Tap to switch language.' : 'No secondary language set.'}`}
          accessibilityState={{ disabled: !canToggle }}
          onPress={handleLanguageToggle}
          disabled={!canToggle}
          className="px-3 rounded-full bg-teal-light border border-teal"
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
            <Text accessible accessibilityRole="alert" className="text-charcoal/60 text-base text-center mb-4">
              {error}
            </Text>
            <TouchableOpacity
              accessible accessibilityRole="button" accessibilityLabel="Retry loading board"
              onPress={refetch}
              className="bg-coral rounded-xl px-6 py-3"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Text className="text-white font-semibold">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : tiles.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-charcoal text-xl font-bold mb-2 text-center">No tiles yet</Text>
            <Text className="text-charcoal/60 text-base text-center mb-6">Add tiles to start communicating</Text>
            <TouchableOpacity
              accessible accessibilityRole="button" accessibilityLabel="Add your first tile"
              className="bg-coral rounded-2xl px-8 py-4"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Text className="text-white font-bold text-lg">+ Add tile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <TileGrid
              tiles={tiles}
              language={language}
              columns={columns}
              onTilePress={handleTilePressWithNav}
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
