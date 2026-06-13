export type PaletteId =
  | 'nexus-blue'
  | 'creative-purple'
  | 'productive-green'
  | 'custom-pink'
  | 'energy-orange'
  | 'premium-black'

export type ThemeMode = 'light' | 'dark'

export type ColorPalette = {
  id: PaletteId
  name: string
  description: string
  primary: string
  secondary: string
  accent: string
  primaryRgb: string
  secondaryRgb: string
  accentRgb: string
  text: string
}

export const THEME_STORAGE_KEY = 'nexus:color-palette'
export const THEME_MODE_STORAGE_KEY = 'nexus:theme-mode'
export const defaultThemeMode: ThemeMode = 'light'

export function getThemeMode(value: string | null | undefined): ThemeMode {
  return value === 'dark' ? 'dark' : defaultThemeMode
}

export const palettes: ColorPalette[] = [
  {
    id: 'nexus-blue',
    name: 'Nexus Azul',
    description: 'Identidade padrão com azul e índigo.',
    primary: '#2563eb',
    secondary: '#4f46e5',
    accent: '#06b6d4',
    primaryRgb: '37 99 235',
    secondaryRgb: '79 70 229',
    accentRgb: '6 182 212',
    text: '#1e3a8a',
  },
  {
    id: 'creative-purple',
    name: 'Roxo Criativo',
    description: 'Violeta e fúcsia para um visual mais autoral.',
    primary: '#7c3aed',
    secondary: '#a21caf',
    accent: '#d946ef',
    primaryRgb: '124 58 237',
    secondaryRgb: '162 28 175',
    accentRgb: '217 70 239',
    text: '#581c87',
  },
  {
    id: 'productive-green',
    name: 'Verde Produtivo',
    description: 'Verde e teal com sensação organizada e ágil.',
    primary: '#059669',
    secondary: '#0f766e',
    accent: '#14b8a6',
    primaryRgb: '5 150 105',
    secondaryRgb: '15 118 110',
    accentRgb: '20 184 166',
    text: '#065f46',
  },
  {
    id: 'custom-pink',
    name: 'Rosa Personalizados',
    description: 'Rosa e rose para uma presença delicada e criativa.',
    primary: '#db2777',
    secondary: '#e11d48',
    accent: '#f472b6',
    primaryRgb: '219 39 119',
    secondaryRgb: '225 29 72',
    accentRgb: '244 114 182',
    text: '#9d174d',
  },
  {
    id: 'energy-orange',
    name: 'Laranja Energia',
    description: 'Laranja e amber para uma marca mais quente.',
    primary: '#ea580c',
    secondary: '#d97706',
    accent: '#f59e0b',
    primaryRgb: '234 88 12',
    secondaryRgb: '217 119 6',
    accentRgb: '245 158 11',
    text: '#9a3412',
  },
  {
    id: 'premium-black',
    name: 'Preto Premium',
    description: 'Grafite elegante mantendo a interface clara.',
    primary: '#111827',
    secondary: '#334155',
    accent: '#64748b',
    primaryRgb: '17 24 39',
    secondaryRgb: '51 65 85',
    accentRgb: '100 116 139',
    text: '#111827',
  },
]

export const defaultPalette = palettes[0]

export function getPaletteById(id: string | null | undefined) {
  return palettes.find((palette) => palette.id === id) ?? defaultPalette
}
