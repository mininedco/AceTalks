import { LanguageCode } from '../types'

export interface LanguageConfig {
  code: LanguageCode
  name: string           // English name
  nativeName: string     // Name in that language
  azureVoice: string     // Azure Neural TTS voice ID
  rtl: boolean
  free: boolean
}

export const LANGUAGES: LanguageConfig[] = [
  // ── Free tier ──────────────────────────────────────────────────────
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    azureVoice: 'en-US-JennyNeural',
    rtl: false,
    free: true,
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    azureVoice: 'th-TH-PremwadeeNeural',
    rtl: false,
    free: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    azureVoice: 'es-US-PalomaNeural',
    rtl: false,
    free: true,
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    azureVoice: 'vi-VN-HoaiMyNeural',
    rtl: false,
    free: true,
  },
  {
    code: 'tl',
    name: 'Tagalog',
    nativeName: 'Tagalog',
    azureVoice: 'fil-PH-BlessicaNeural',
    rtl: false,
    free: true,
  },
  {
    code: 'ht',
    name: 'Haitian Creole',
    nativeName: 'Kreyòl Ayisyen',
    // WHY: Azure does not currently have a dedicated Haitian Creole neural voice.
    // Using French Caribbean regional voice as closest available approximation.
    // Flag this for review — community feedback needed on voice quality.
    azureVoice: 'fr-FR-DeniseNeural',
    rtl: false,
    free: true,
  },
  // ── Pro tier (add Azure voice IDs when implementing) ───────────────
  { code: 'zh-Hans', name: 'Mandarin (Simplified)', nativeName: '普通话', azureVoice: 'zh-CN-XiaoxiaoNeural', rtl: false, free: false },
  { code: 'ar',      name: 'Arabic',                nativeName: 'العربية',   azureVoice: 'ar-SA-ZariyahNeural',  rtl: true,  free: false },
  { code: 'ko',      name: 'Korean',                nativeName: '한국어',    azureVoice: 'ko-KR-SunHiNeural',    rtl: false, free: false },
  { code: 'pt-BR',   name: 'Portuguese (Brazil)',   nativeName: 'Português', azureVoice: 'pt-BR-FranciscaNeural', rtl: false, free: false },
  { code: 'fr',      name: 'French',                nativeName: 'Français',  azureVoice: 'fr-FR-DeniseNeural',   rtl: false, free: false },
  { code: 'hi',      name: 'Hindi',                 nativeName: 'हिन्दी',    azureVoice: 'hi-IN-SwaraNeural',    rtl: false, free: false },
]

export const FREE_LANGUAGES = LANGUAGES.filter((l) => l.free)
export const PRO_LANGUAGES  = LANGUAGES.filter((l) => !l.free)

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function getLanguage(code: LanguageCode): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.code === code)
}
