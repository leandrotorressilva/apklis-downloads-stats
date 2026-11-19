import { useState, type FormEvent } from 'react'
import { login, type Session } from './api'
import { errorMessageKey, useI18n, type MessageKey } from './i18n'
import { AlertIcon, LockIcon, SpinnerIcon } from './icons'
import { Shell } from './ui'

export default function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      onLogin(await login(username.trim(), password))
    } catch (err) {
      setError(errorMessageKey(err))
      setLoading(false)
    }
  }

  return (
    <Shell>
      <div className="login">
        <form className="card login-card" onSubmit={submit} aria-busy={loading}>
          <div className="login-heading">
            <p className="eyebrow">{t('login.eyebrow')}</p>
            <h1 className="login-title">{t('login.title')}</h1>
            <p className="muted">{t('login.subtitle')}</p>
          </div>

          <div className="login-fields">
            <label className="field">
              <span className="field-label">{t('login.username')}</span>
              <input
                className="input"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={error === 'error.credentials' || undefined}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">{t('login.password')}</span>
              <input
                className="input"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={error === 'error.credentials' || undefined}
                required
              />
            </label>
          </div>

          {error && (
            <p className="alert" role="alert">
              <AlertIcon />
              {t(error)}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading && <SpinnerIcon />}
            {t(loading ? 'login.submitting' : 'login.submit')}
          </button>
        </form>

        <p className="login-note">
          <LockIcon />
          <span>{t('login.privacy')}</span>
        </p>
      </div>
    </Shell>
  )
}
