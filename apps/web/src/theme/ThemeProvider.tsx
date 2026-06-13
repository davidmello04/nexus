import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultPalette,
  defaultThemeMode,
  getPaletteById,
  getThemeMode,
  palettes,
  THEME_MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type ColorPalette,
  type PaletteId,
  type ThemeMode,
} from './palettes'

type ThemeContextValue = {
  palette: ColorPalette
  palettes: ColorPalette[]
  mode: ThemeMode
  setPalette: (paletteId: PaletteId) => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    if (typeof window === 'undefined') {
      return defaultPalette
    }

    return getPaletteById(window.localStorage.getItem(THEME_STORAGE_KEY))
  })
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return defaultThemeMode
    }

    return getThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY))
  })

  useEffect(() => {
    applyTheme(palette, mode)
    window.localStorage.setItem(THEME_STORAGE_KEY, palette.id)
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  }, [palette, mode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette,
      palettes,
      mode,
      setPalette: (paletteId) => setPaletteState(getPaletteById(paletteId)),
      setMode: setModeState,
    }),
    [mode, palette],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }

  return context
}

function applyTheme(palette: ColorPalette, mode: ThemeMode) {
  const root = document.documentElement

  root.dataset.palette = palette.id
  root.dataset.theme = mode
  root.style.colorScheme = mode
  root.style.setProperty('--brand-primary', palette.primary)
  root.style.setProperty('--brand-secondary', palette.secondary)
  root.style.setProperty('--brand-accent', palette.accent)
  root.style.setProperty('--brand-primary-rgb', palette.primaryRgb)
  root.style.setProperty('--brand-secondary-rgb', palette.secondaryRgb)
  root.style.setProperty('--brand-accent-rgb', palette.accentRgb)
  root.style.setProperty('--brand-text', palette.text)
}
