import { useEffect, useRef } from 'react'
import { useSupabaseWithAuth } from './useSupabaseWithAuth'
import { useBoardStore } from '../store/boardStore'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Tile } from '../types'

function mapRow(t: Record<string, unknown>): Tile {
  return {
    id: t.id as string,
    boardId: t.board_id as string,
    labelTranslations: (t.label_translations ?? {}) as Record<string, string>,
    imageUrl: (t.image_url as string) ?? undefined,
    ttsCacheKeys: (t.tts_cache_keys as Record<string, string>) ?? undefined,
    rowIndex: t.row_index as number,
    colIndex: t.col_index as number,
    linkBoardId: (t.link_board_id as string) ?? undefined,
    bgColor: (t.bg_color as string) ?? undefined,
  }
}

// WHY: A therapist editing a tile at 3pm should appear on the child's tablet
// immediately without a manual refresh. Supabase Realtime pushes postgres_changes
// events for INSERT/UPDATE/DELETE on the tiles table filtered by board_id.
// We subscribe to every board currently in the navigation stack so changes are
// visible whether the user is on the home board or a sub-board.
export function useBoardSync() {
  const supabase = useSupabaseWithAuth()
  const stack = useBoardStore((s) => s.stack)
  const upsertTile = useBoardStore((s) => s.upsertTile)
  const deleteTile = useBoardStore((s) => s.deleteTile)

  // Keep a ref of active channel IDs so we can clean up stale subscriptions
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())

  useEffect(() => {
    const activeBoardIds = new Set(stack.map((e) => e.board.id))
    const currentChannels = channelsRef.current

    // Remove channels for boards no longer in the stack
    for (const [boardId, channel] of currentChannels.entries()) {
      if (!activeBoardIds.has(boardId)) {
        supabase.removeChannel(channel)
        currentChannels.delete(boardId)
      }
    }

    // Subscribe to any new boards in the stack
    for (const boardId of activeBoardIds) {
      if (currentChannels.has(boardId)) continue

      const channel = supabase
        .channel(`tiles:board_id=eq.${boardId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tiles',
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            upsertTile(boardId, mapRow(payload.new as Record<string, unknown>))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tiles',
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            upsertTile(boardId, mapRow(payload.new as Record<string, unknown>))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tiles',
            filter: `board_id=eq.${boardId}`,
          },
          (payload) => {
            const old = payload.old as { id?: string }
            if (old.id) deleteTile(boardId, old.id)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.info('[Realtime] Subscribed to board', boardId)
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('[Realtime] Channel error for board', boardId)
          }
        })

      currentChannels.set(boardId, channel)
    }

    // Cleanup: unsubscribe all channels when component unmounts
    return () => {
      for (const channel of currentChannels.values()) {
        supabase.removeChannel(channel)
      }
      currentChannels.clear()
    }
  // WHY: Re-run when the stack changes (new board navigated to or popped)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stack.map((e) => e.board.id).join(',')])
}
