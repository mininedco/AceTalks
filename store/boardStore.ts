import { create } from 'zustand'
import type { Board, Tile } from '../types'

interface BoardEntry {
  board: Board
  tiles: Tile[]
}

interface BoardState {
  // stack[0] is always the home board; stack.at(-1) is current
  stack: BoardEntry[]
  isNavigating: boolean

  setHome: (board: Board, tiles: Tile[]) => void
  push: (board: Board, tiles: Tile[]) => void
  pop: () => void
  popToHome: () => void
  setNavigating: (v: boolean) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  stack: [],
  isNavigating: false,

  setHome: (board, tiles) => set({ stack: [{ board, tiles }] }),
  push: (board, tiles) => set((s) => ({ stack: [...s.stack, { board, tiles }] })),
  pop: () => set((s) => ({ stack: s.stack.length > 1 ? s.stack.slice(0, -1) : s.stack })),
  popToHome: () => set((s) => ({ stack: s.stack.length > 0 ? [s.stack[0]] : s.stack })),
  setNavigating: (v) => set({ isNavigating: v }),
}))
