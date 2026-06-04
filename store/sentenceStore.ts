import { create } from 'zustand'

interface SentenceState {
  words: string[]
  addWord: (word: string) => void
  removeWord: (index: number) => void
  clear: () => void
}

export const useSentenceStore = create<SentenceState>((set) => ({
  words: [],
  addWord: (word) => set((s) => ({ words: [...s.words, word] })),
  removeWord: (index) => set((s) => ({ words: s.words.filter((_, i) => i !== index) })),
  clear: () => set({ words: [] }),
}))
