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
  getPaletteById,
  palettes,
  THEME_STORAGE_KEY,
  type ColorPalette,
  type PaletteId,
} from './palettes'

type ThemeContextValue = {
  palette: ColorPalette
  palettes: ColorPalette[]
  setPalette: (paletteId: PaletteId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    if (typeof window === 'undefined') {
      return defaultPalette
    }

    return getPaletteById(window.localStorage.getItem(THEME_STORAGE_KEY))
  })

  useEffect(() => {
    applyPalette(palette)
    window.localStorage.setItem(THEME_STORAGE_KEY, palette.id)
  }, [palette])

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette,
      palettes,
      setPalette: (paletteId) => setPaletteState(getPaletteById(paletteId)),
    }),
    [palette],
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

function applyPalette(palette: ColorPalette) {
  const root = document.documentElement

  root.dataset.palette = palette.id
  root.style.setProperty('--brand-primary', palette.primary)
  root.style.setProperty('--brand-secondary', palette.secondary)
  root.style.setProperty('--brand-accent', palette.accent)
  root.style.setProperty('--brand-primary-rgb', palette.primaryRgb)
  root.style.setProperty('--brand-secondary-rgb', palette.secondaryRgb)
  root.style.setProperty('--brand-accent-rgb', palette.accentRgb)
  root.style.setProperty('--brand-text', palette.text)
}
