import { useEffect, useState } from 'react'
import { useUser } from '@clerk/expo'
import { useSupabaseWithAuth } from './useSupabaseWithAuth'
import type { CommunicatorProfile, Board, Tile } from '../types'

interface HomeBoardData {
  communicator: CommunicatorProfile | null
  board: Board | null
  tiles: Tile[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useHomeBoardData(): HomeBoardData {
  const { user } = useUser()
  const supabase = useSupabaseWithAuth()

  const [communicator, setCommunicator] = useState<CommunicatorProfile | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch the first communicator owned by this user
        const { data: commsData, error: commsErr } = await supabase
          .from('communicators')
          .select('*')
          .eq('owner_id', user!.id)
          .limit(1)
          .single()

        if (commsErr || !commsData) {
          if (!cancelled) {
            setError(commsErr?.message ?? 'No communicator profile found.')
            setIsLoading(false)
          }
          return
        }

        const comm: CommunicatorProfile = {
          id: commsData.id,
          ownerId: commsData.owner_id,
          displayName: commsData.display_name,
          ageGroup: commsData.age_group,
          primaryLanguage: commsData.primary_language,
          secondaryLanguage: commsData.secondary_language ?? undefined,
          gridSize: commsData.grid_size,
          createdAt: commsData.created_at,
        }

        // Fetch the home board for this communicator
        const { data: boardData, error: boardErr } = await supabase
          .from('boards')
          .select('*')
          .eq('communicator_id', comm.id)
          .eq('is_home', true)
          .limit(1)
          .single()

        if (boardErr || !boardData) {
          if (!cancelled) {
            setCommunicator(comm)
            setBoard(null)
            setTiles([])
            setIsLoading(false)
          }
          return
        }

        const homeBoard: Board = {
          id: boardData.id,
          communicatorId: boardData.communicator_id,
          name: boardData.name,
          isHome: boardData.is_home,
          obfJson: boardData.obf_json,
          createdAt: boardData.created_at,
          updatedAt: boardData.updated_at,
        }

        // Fetch tiles for the home board
        const { data: tilesData, error: tilesErr } = await supabase
          .from('tiles')
          .select('*')
          .eq('board_id', homeBoard.id)
          .order('row_index')
          .order('col_index')

        if (tilesErr) {
          if (!cancelled) setError(tilesErr.message)
          return
        }

        const mappedTiles: Tile[] = (tilesData ?? []).map((t) => ({
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

        if (!cancelled) {
          setCommunicator(comm)
          setBoard(homeBoard)
          setTiles(mappedTiles)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load board. Please try again.')
          setIsLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id, tick])

  return {
    communicator,
    board,
    tiles,
    isLoading,
    error,
    refetch: () => setTick((n) => n + 1),
  }
}
