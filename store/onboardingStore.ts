import { create } from 'zustand'
import { LanguageCode } from '../types'

interface OnboardingState {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
  reset: () => set({ language: 'en' }),
}))
