import { useEffect, useState, useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Must match the key read by the inline script in `index.html`. */
const THEME_KEY = 'apklis-stats.theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Storage unavailable: follow the system.
  }
  return 'system'
}

function subscribeToSystem(onChange: () => void) {
  const query = darkQuery()
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const systemPrefersDark = () => darkQuery().matches

export function useTheme() {
  const [preference, setPreference] = useState(readPreference)
  const systemDark = useSyncExternalStore(subscribeToSystem, systemPrefersDark)
  const dark = preference === 'dark' || (preference === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, preference)
    } catch {
      // Storage unavailable: the choice just won't persist.
    }
  }, [preference])

  return { preference, setPreference, dark }
}
