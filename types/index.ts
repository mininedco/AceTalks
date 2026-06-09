// AceTalks core type definitions

export type AgeGroup = 'child' | 'adult' | 'elderly'
export type SupervisorRole = 'parent' | 'therapist' | 'teacher'
export type GridSize = '2x3' | '3x3' | '3x4' | '4x4'

// BCP 47 language codes supported by AceTalks
export type LanguageCode =
  | 'en' | 'th' | 'es' | 'vi' | 'tl' | 'ht'  // free tier
  | 'zh-Hans' | 'ar' | 'ko' | 'pt-BR' | 'fr'   // pro tier
  | 'hi' | 'am' | 'so' | 'ru' | 'ja'            // pro tier

export interface CommunicatorProfile {
  id: string
  ownerId: string           // Clerk user ID
  displayName: string
  ageGroup: AgeGroup
  primaryLanguage: LanguageCode
  secondaryLanguage?: LanguageCode
  gridSize: GridSize
  createdAt: string
}

export interface Board {
  id: string
  communicatorId: string
  name: string
  isHome: boolean
  obfJson: OBFBoard         // Open Board Format
  createdAt: string
  updatedAt: string
}

export interface Tile {
  id: string
  boardId: string
  labelTranslations: Record<LanguageCode, string>
  imageUrl?: string
  ttsCacheKeys?: Record<LanguageCode, string>
  rowIndex: number
  colIndex: number
  linkBoardId?: string      // opens a sub-board when tapped
  bgColor?: string
  masked?: boolean          // ACET-029: hide without shifting grid position
}

// Open Board Format (OBF) — minimal type for compatibility
export interface OBFBoard {
  format: string
  id: string
  name: string
  buttons: OBFButton[]
  grid: { rows: number; columns: number; order: (string | null)[][] }
}

export interface OBFButton {
  id: string
  label: string
  image_id?: string
  load_board?: { id: string }
  background_color?: string
}

export interface Supervisor {
  id: string
  communicatorId: string
  userId: string
  role: SupervisorRole
  canEdit: boolean
}
