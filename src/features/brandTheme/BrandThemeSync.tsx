import { useEffect } from 'react'
import { useAppConfig } from '@/hooks/useAppConfig'
import { applyTheme, cacheTheme, resolveTheme } from './brandTheme'

/** Keeps the page in the admin's theme whenever /config (re)loads. Renders nothing. */
export function BrandThemeSync() {
  const { data } = useAppConfig()
  const theme = data?.theme

  useEffect(() => {
    if (!theme) return
    const resolved = resolveTheme(theme)
    applyTheme(resolved)
    cacheTheme(resolved)
  }, [theme])

  return null
}
