/**
 * Theme provider. Toggles the `.dark` class on <html>.
 *
 * While per-user switching is off (featureFlags.darkMode), the admin's theme
 * decides: light, dark, or follow the phone ("system"). With the flag on, a
 * person's own saved choice wins, as before.
 */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { featureFlags } from '@/config/app.config'
import { storage } from '@/utils/storage'
import { useAppConfig } from '@/hooks/useAppConfig'
import { cachedThemeMode, prefersDark, type ThemeMode } from '@/features/brandTheme/brandTheme'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'listee.theme'

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveInitialTheme(): Theme {
  if (!featureFlags.darkMode) return prefersDark(cachedThemeMode()) ? 'dark' : 'light'
  const saved = storage.get(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme)
  const { data: config } = useAppConfig()
  const adminMode: ThemeMode | undefined = config?.theme?.mode

  // Admin-decided mode, kept in step with the phone when it's "system".
  useEffect(() => {
    if (featureFlags.darkMode || !adminMode) return
    setThemeState(prefersDark(adminMode) ? 'dark' : 'light')
    if (adminMode !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setThemeState(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [adminMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    if (featureFlags.darkMode) storage.set(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  )

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
