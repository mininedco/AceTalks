import { useCallback } from 'react'
import { useSupabaseWithAuth } from './useSupabaseWithAuth'
import { useBoardStore } from '../store/boardStore'
import type { Board, Tile } from '../types'

async function fetchBoardWithTiles(
  supabase: ReturnType<typeof useSupabaseWithAuth>,
  boardId: string
): Promise<{ board: Board; tiles: Tile[] } | null> {
  const { data: boardData, error: boardErr } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single()

  if (boardErr || !boardData) return null

  const board: Board = {
    id: boardData.id,
    communicatorId: boardData.communicator_id,
    name: boardData.name,
    isHome: boardData.is_home,
    obfJson: boardData.obf_json,
    createdAt: boardData.created_at,
    updatedAt: boardData.updated_at,
  }

  const { data: tilesData } = await supabase
    .from('tiles')
    .select('*')
    .eq('board_id', boardId)
    .order('row_index')
    .order('col_index')

  const tiles: Tile[] = (tilesData ?? []).map((t) => ({
    id: t.id,
    boardId: t.board_id,
    labelTranslations: t.label_translations ?? {},
    imageUrl: t.image_url ?? undefined,
    ttsCacheKeys: t.tts_cache_keys ?? undefined,
    rowIndex: t.row_index,
    colIndex: t.col_index,
    linkBoardId: t.link_board_id ?? undefined,
    bgColor: t.bg_color ?? undefined,
  }))

  return { board, tiles }
}

interface UseBoardNavigationReturn {
  navigateTo: (boardId: string) => Promise<void>
  goBack: () => void
  goHome: () => void
  canGoBack: boolean
  isNavigating: boolean
}

export function useBoardNavigation(): UseBoardNavigationReturn {
  const supabase = useSupabaseWithAuth()
  const { push, pop, popToHome, stack, setNavigating, isNavigating } = useBoardStore()

  const navigateTo = useCallback(async (boardId: string) => {
    setNavigating(true)
    try {
      const result = await fetchBoardWithTiles(supabase, boardId)
      if (result) push(result.board, result.tiles)
    } finally {
      setNavigating(false)
    }
  }, [supabase, push, setNavigating])

  return {
    navigateTo,
    goBack: pop,
    goHome: popToHome,
    canGoBack: stack.length > 1,
    isNavigating,
  }
}
