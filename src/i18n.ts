import { createContext, useContext } from 'react'
import { ApiError } from './api'

const es = {
  'app.name': 'Apklis Stats',
  'header.switchLanguage': 'Switch to English',
  'header.theme': 'Cambiar tema',
  'header.logout': 'Cerrar sesión',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  'theme.system': 'Sistema',

  'login.eyebrow': 'Estadísticas de descargas',
  'login.title': 'Entra con tu cuenta de desarrollador',
  'login.subtitle': 'Usa el mismo usuario y contraseña que en la consola de Apklis (console.apklis.cu).',
  'login.username': 'Usuario',
  'login.password': 'Contraseña',
  'login.submit': 'Entrar',
  'login.submitting': 'Entrando…',
  'login.privacy': 'No guardamos tus credenciales: se envían a la API de Apklis y solo la sesión queda en este navegador.',
  'login.source': 'Código abierto en GitHub',

  'dashboard.eyebrow': 'Tus apps en Apklis',
  'dashboard.title': 'Descargas',
  'dashboard.subtitle': 'El total, cómo vas frente al periodo anterior y el detalle de los últimos días.',
  'dashboard.refresh': 'Actualizar',
  'dashboard.refreshing': 'Actualizando…',
  'dashboard.loading': 'Cargando tus estadísticas',

  'kpi.total': 'Descargas totales',
  'kpi.year': 'Últimos 365 días',
  'kpi.month': 'Últimos 30 días',
  'kpi.week': 'Últimos 7 días',
  'kpi.today': 'Hoy',
  'kpi.previous': 'frente a {value}',
  'kpi.previousToday': 'ayer: {value}',

  'chart.title': 'Últimos 7 días',
  'chart.subtitle': '{count} descargas en total',
  'chart.subtitle_one': '{count} descarga en total',
  'chart.bar': '{day}: {count} descargas',
  'chart.bar_one': '{day}: {count} descarga',
  'chart.best': 'Mejor día',


  'apps.title': 'Tus apps',
  'apps.subtitle': '{count} descargas hoy entre las seleccionadas, de más a menos.',
  'apps.subtitle_one': '{count} descarga hoy entre las seleccionadas.',
  'apps.app': 'App',
  'apps.today': 'Hoy',
  'apps.week': '7 días',
  'apps.empty': 'Todavía no hay descargas hoy. ¡Ya llegarán!',

  'error.title': 'No pudimos cargar tus estadísticas',
  'error.credentials': 'Usuario o contraseña incorrectos. Revísalos e inténtalo de nuevo.',
  'error.network': 'No pudimos conectar con Apklis. Revisa tu conexión e inténtalo de nuevo.',
  'error.server': 'Apklis no respondió como esperábamos. Inténtalo de nuevo en unos minutos.',
  'error.retry': 'Reintentar',
  'error.reference': 'Referencia: {code}',
}

export type MessageKey = keyof typeof es

const en: Record<MessageKey, string> = {
  'app.name': 'Apklis Stats',
  'header.switchLanguage': 'Cambiar a español',
  'header.theme': 'Change theme',
  'header.logout': 'Log out',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',

  'login.eyebrow': 'Download stats',
  'login.title': 'Sign in with your developer account',
  'login.subtitle': 'Use the same username and password as in the Apklis console (console.apklis.cu).',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.submitting': 'Signing in…',
  'login.privacy': 'We never store your credentials: they go to the Apklis API and only the session stays in this browser.',
  'login.source': 'Open source on GitHub',

  'dashboard.eyebrow': 'Your apps on Apklis',
  'dashboard.title': 'Downloads',
  'dashboard.subtitle': 'Your total, how you compare with the previous period and a close look at the last few days.',
  'dashboard.refresh': 'Refresh',
  'dashboard.refreshing': 'Refreshing…',
  'dashboard.loading': 'Loading your stats',

  'kpi.total': 'Total downloads',
  'kpi.year': 'Last 365 days',
  'kpi.month': 'Last 30 days',
  'kpi.week': 'Last 7 days',
  'kpi.today': 'Today',
  'kpi.previous': 'vs. {value}',
  'kpi.previousToday': 'yesterday: {value}',

  'chart.title': 'Last 7 days',
  'chart.subtitle': '{count} downloads in total',
  'chart.subtitle_one': '{count} download in total',
  'chart.bar': '{day}: {count} downloads',
  'chart.bar_one': '{day}: {count} download',
  'chart.best': 'Best day',


  'apps.title': 'Your apps',
  'apps.subtitle': '{count} downloads today across the selected apps, from most to least.',
  'apps.subtitle_one': '{count} download today across the selected apps.',
  'apps.app': 'App',
  'apps.today': 'Today',
  'apps.week': '7 days',
  'apps.empty': 'No downloads yet today. They’ll come!',

  'error.title': 'We couldn’t load your stats',
  'error.credentials': 'Wrong username or password. Check them and try again.',
  'error.network': 'We couldn’t reach Apklis. Check your connection and try again.',
  'error.server': 'Apklis didn’t respond as expected. Try again in a few minutes.',
  'error.retry': 'Try again',
  'error.reference': 'Reference: {code}',
}

export const messages = { es, en } as const

export type Lang = keyof typeof messages

const LANG_KEY = 'apklis-stats.lang'

export function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    // Storage unavailable: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function storeLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // Storage unavailable: the choice just won't persist.
  }
}

type Vars = Record<string, string | number>

export interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Translates `key`, interpolating `{name}` placeholders. A numeric `count` var picks the `_one` form when it is 1. */
  t: (key: MessageKey, vars?: Vars) => string
  formatNumber: (value: number) => string
  formatPercent: (value: number) => string
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string
}

export function createI18n(lang: Lang, setLang: (lang: Lang) => void): I18n {
  const dictionary: Record<string, string> = messages[lang]
  // Always group thousands: Spanish skips it for 4-digit numbers, which looks inconsistent next to bigger ones.
  const numbers = new Intl.NumberFormat(lang, { useGrouping: 'always' })
  const percents = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })

  return {
    lang,
    setLang,
    t: (key, vars = {}) => {
      const template = (vars.count === 1 && dictionary[`${key}_one`]) || dictionary[key]
      return template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = vars[name]
        if (value === undefined) return match
        return typeof value === 'number' ? numbers.format(value) : value
      })
    },
    formatNumber: (value) => numbers.format(value),
    formatPercent: (value) => percents.format(value),
    formatDate: (date, options) => date.toLocaleDateString(lang, options),
  }
}

/** Friendly message for an error thrown by the API client. */
export function errorMessageKey(err: unknown): MessageKey {
  if (!(err instanceof ApiError)) return 'error.server'
  if (err.code === 'INVALID_CREDENTIALS') return 'error.credentials'
  if (err.code === 'NETWORK') return 'error.network'
  return 'error.server'
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const i18n = useContext(I18nContext)
  if (!i18n) throw new Error('useI18n must be used inside <I18nContext.Provider>')
  return i18n
}
