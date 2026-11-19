import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadSession, saveSession, type Session } from './api'
import Dashboard from './Dashboard'
import { createI18n, I18nContext, initialLang, storeLang, type Lang } from './i18n'
import Login from './Login'

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [session, setSession] = useState<Session | null>(loadSession)

  const i18n = useMemo(() => createI18n(lang, setLang), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    storeLang(lang)
  }, [lang])

  const updateSession = useCallback((next: Session | null) => {
    saveSession(next)
    setSession(next)
  }, [])
  const logout = useCallback(() => updateSession(null), [updateSession])

  return (
    <I18nContext.Provider value={i18n}>
      {session ? <Dashboard session={session} onSession={updateSession} onLogout={logout} /> : <Login onLogin={updateSession} />}
    </I18nContext.Provider>
  )
}
