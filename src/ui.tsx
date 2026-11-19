import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode, type SVGProps } from 'react'
import { useI18n, type MessageKey } from './i18n'
import {
  AlertIcon,
  ChartIcon,
  CheckIcon,
  LogOutIcon,
  MinusIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from './icons'
import { useTheme, type ThemePreference } from './theme'

// ── Shell ────────────────────────────────────────────────────────────────────

const SOURCE_URL = 'https://github.com/leandrotorressilva/apklis-downloads-stats'

export function Shell({ onLogout, children }: { onLogout?: () => void; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="shell">
      <header className="shell-header">
        <span className="brand">
          <span className="brand-mark squircle">
            <ChartIcon />
          </span>
          {t('app.name')}
        </span>
        <div className="header-actions">
          <LanguageToggle />
          <ThemeMenu />
          {onLogout && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={onLogout} aria-label={t('header.logout')} title={t('header.logout')}>
              <LogOutIcon />
            </button>
          )}
        </div>
      </header>
      <main className="shell-main">{children}</main>
      <footer className="shell-footer">
        <span>
          © 2026{' '}
          <a href="https://kuantyk.com" target="_blank" rel="noreferrer">
            KUANTYK
          </a>
        </span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {t('footer.source')}
        </a>
      </footer>
    </div>
  )
}

function LanguageToggle() {
  const { t, lang, setLang } = useI18n()
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon lang-toggle"
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      aria-label={t('header.switchLanguage')}
      title={t('header.switchLanguage')}
    >
      {lang.toUpperCase()}
    </button>
  )
}

const THEME_OPTIONS: { value: ThemePreference; label: MessageKey; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { value: 'light', label: 'theme.light', Icon: SunIcon },
  { value: 'dark', label: 'theme.dark', Icon: MoonIcon },
  { value: 'system', label: 'theme.system', Icon: MonitorIcon },
]

function ThemeMenu() {
  const { t } = useI18n()
  const { preference, setPreference, dark } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus()

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') return setOpen(false)
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]')]
    const current = items.indexOf(document.activeElement as HTMLElement)
    items[(current + step + items.length) % items.length]?.focus()
  }

  const choose = (value: ThemePreference) => {
    setPreference(value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={t('header.theme')}
        title={t('header.theme')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </button>
      {open && (
        <div id={menuId} className="menu-list" role="menu" aria-label={t('header.theme')} onKeyDown={onMenuKeyDown}>
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              className="menu-item"
              onClick={() => choose(value)}
            >
              <Icon />
              {t(label)}
              {preference === value && <CheckIcon className="menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page building blocks ─────────────────────────────────────────────────────

export function PageHeader({ eyebrow, title, subtitle, aside }: { eyebrow: string; title: string; subtitle: string; aside?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {aside && <div className="page-header-aside">{aside}</div>}
    </div>
  )
}

/** Change of `value` against `previous`, as a soft colored pill. Renders nothing without a baseline. */
export function TrendPill({ value, previous }: { value: number; previous: number }) {
  const { formatPercent } = useI18n()
  if (previous === 0) return null
  const change = (value - previous) / previous
  const [tone, Icon] = change > 0 ? ['up', TrendingUpIcon] : change < 0 ? ['down', TrendingDownIcon] : ['flat', MinusIcon]
  return (
    <span className={`pill pill-${tone} tabular`}>
      <Icon />
      {formatPercent(change)}
    </span>
  )
}

export function StatusPanel({ title, children, actions, error = false }: { title: string; children: ReactNode; actions?: ReactNode; error?: boolean }) {
  return (
    <section className="status-panel" role={error ? 'alert' : undefined}>
      <span className={`status-icon squircle${error ? ' is-error' : ''}`}>
        <AlertIcon />
      </span>
      <div className="status-text">
        <h2>{title}</h2>
        <div className="muted">{children}</div>
      </div>
      {actions && <div className="status-actions">{actions}</div>}
    </section>
  )
}
