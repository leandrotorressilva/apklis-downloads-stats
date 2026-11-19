import { useCallback, useEffect, useMemo, useState } from 'react'
import { freshSession, getHistogram, isUnauthorized, refresh, type HistogramPoint, type Session } from './api'
import { errorMessageKey, useI18n } from './i18n'
import { AlertIcon, DownloadIcon, RefreshIcon, SpinnerIcon } from './icons'
import { apklisToday, appStats, lastDays, periods, total, type Period } from './stats'
import { PageHeader, Shell, StatusPanel, TrendPill } from './ui'

interface Data {
  /** Daily histogram; each day also carries the per-app breakdown by name. */
  all: HistogramPoint[]
  /** Calendar day in Cuba when the data was loaded (see `apklisToday`). */
  today: Date
}

interface Props {
  session: Session
  onSession: (session: Session) => void
  onLogout: () => void
}

export default function Dashboard({ session, onSession, onLogout }: Props) {
  const { t } = useI18n()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const fetchAll = async (s: Session) => {
      setData({ all: await getHistogram(s), today: apklisToday() })
    }
    try {
      let current = await freshSession(session)
      if (current !== session) onSession(current)
      try {
        await fetchAll(current)
      } catch (err) {
        if (!isUnauthorized(err)) throw err
        // The token was revoked before expiring: refresh once, then give up and go back to login.
        current = await refresh(current.refreshToken)
        onSession(current)
        await fetchAll(current)
      }
    } catch (err) {
      if (isUnauthorized(err)) onLogout()
      else setError(err)
    } finally {
      setLoading(false)
    }
  }, [session, onSession, onLogout])

  useEffect(() => {
    void load()
    // Load once on mount; afterwards only the Refresh button reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshButton = (
    <button type="button" className="btn btn-primary" onClick={() => void load()} disabled={loading}>
      {loading ? <SpinnerIcon /> : <RefreshIcon />}
      {t(loading ? 'dashboard.refreshing' : 'dashboard.refresh')}
    </button>
  )

  return (
    <Shell onLogout={onLogout}>
      <PageHeader eyebrow={t('dashboard.eyebrow')} title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} aside={refreshButton} />

      {data ? (
        <>
          {error != null && (
            <p className="alert alert-banner" role="alert">
              <AlertIcon />
              {t(errorMessageKey(error))}
            </p>
          )}
          <Stats data={data} />
        </>
      ) : error != null ? (
        <StatusPanel
          error
          title={t('error.title')}
          actions={
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              <RefreshIcon />
              {t('error.retry')}
            </button>
          }
        >
          <p>{t(errorMessageKey(error))}</p>
          {error instanceof Error && <p className="status-reference">{t('error.reference', { code: error.message })}</p>}
        </StatusPanel>
      ) : (
        <DashboardSkeleton />
      )}
    </Shell>
  )
}

function Stats({ data }: { data: Data }) {
  const { t, formatNumber } = useI18n()
  const today = data.today
  const summary = useMemo(() => periods(data.all, today), [data.all, today])
  const allTime = useMemo(() => total(data.all), [data.all])

  return (
    <>
      <section className="kpis" aria-label={t('dashboard.title')}>
        <article className="card kpi kpi-total">
          <span className="kpi-total-icon squircle">
            <DownloadIcon />
          </span>
          <div className="kpi-total-body">
            <h2 className="micro">{t('kpi.total')}</h2>
            <p className="kpi-hero tabular">{formatNumber(allTime)}</p>
          </div>
        </article>
        {summary.map((period) => (
          <PeriodCard key={period.id} period={period} />
        ))}
      </section>

      <WeekChart all={data.all} today={today} />
      <AppsSection all={data.all} today={today} />
    </>
  )
}

function PeriodCard({ period }: { period: Period }) {
  const { t, formatNumber } = useI18n()
  return (
    <article className="card kpi">
      <h2 className="micro">{t(`kpi.${period.id}`)}</h2>
      <p className="kpi-value tabular">{formatNumber(period.value)}</p>
      <div className="kpi-trend">
        <TrendPill value={period.value} previous={period.previous} />
        <span className="kpi-previous tabular">
          {t(period.id === 'today' ? 'kpi.previousToday' : 'kpi.previous', { value: period.previous })}
        </span>
      </div>
    </article>
  )
}

function WeekChart({ all, today }: { all: HistogramPoint[]; today: Date }) {
  const { t, formatNumber, formatDate } = useI18n()
  const days = useMemo(() => lastDays(all, 7, today), [all, today])
  const max = Math.max(...days.map((d) => d.count))
  const weekTotal = days.reduce((sum, d) => sum + d.count, 0)

  return (
    <section className="card panel section">
      <div className="panel-head">
        <h2 className="panel-title">{t('chart.title')}</h2>
        <p className="muted small tabular">{t('chart.subtitle', { count: weekTotal })}</p>
      </div>

      <ol className="chart">
        {days.map((day, i) => {
          const isBest = max > 0 && day.count === max
          const isToday = i === days.length - 1
          const label = formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })
          return (
            <li key={day.key} className="chart-col" aria-label={t('chart.bar', { day: label, count: day.count })}>
              <span className="chart-value tabular" aria-hidden="true">
                {formatNumber(day.count)}
              </span>
              <span className="chart-track" aria-hidden="true">
                <span className={`chart-bar${isBest ? ' is-best' : ''}`} style={{ height: max ? `${(day.count / max) * 100}%` : 0 }} />
              </span>
              <span className={`chart-label${isToday ? ' is-today' : ''}`} aria-hidden="true">
                <span className="micro">{formatDate(day.date, { weekday: 'short' })}</span>
                <span className="chart-day tabular">{day.date.getUTCDate()}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {max > 0 && (
        <p className="chart-legend">
          <span className="chart-swatch" aria-hidden="true" />
          {t('chart.best')}
        </p>
      )}
    </section>
  )
}

function AppsSection({ all, today }: { all: HistogramPoint[]; today: Date }) {
  const { t, formatNumber } = useI18n()
  const apps = useMemo(() => appStats(all, today), [all, today])

  return (
    <section className="section" aria-labelledby="apps-title">
      <div className="section-head">
        <h2 id="apps-title" className="panel-title">
          {t('apps.title')}
        </h2>
        <p className="muted small tabular">{t('apps.subtitle', { count: apps.reduce((sum, app) => sum + app.today, 0) })}</p>
      </div>

      {apps.length === 0 ? (
        <p className="panel-empty">{t('apps.empty')}</p>
      ) : (
        <div className="table-card">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">{t('apps.app')}</th>
                <th scope="col" aria-sort="descending">
                  {t('apps.today')}
                </th>
                <th scope="col">{t('apps.week')}</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.name}>
                  <th scope="row">
                    <span className="app-name" title={app.name}>
                      {app.name}
                    </span>
                  </th>
                  <td className="tabular is-sorted">
                    <span className="cell-trend">
                      {formatNumber(app.today)}
                      <TrendPill value={app.today} previous={app.yesterday} />
                    </span>
                  </td>
                  <td className="tabular">
                    <span className="cell-trend">
                      {formatNumber(app.week)}
                      <TrendPill value={app.week} previous={app.previousWeek} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DashboardSkeleton() {
  const { t } = useI18n()
  return (
    <div role="status" aria-label={t('dashboard.loading')}>
      <div className="kpis">
        <div className="skeleton kpi-total skeleton-total" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton skeleton-kpi" />
        ))}
      </div>
      <div className="skeleton skeleton-panel section" />
      <div className="skeleton skeleton-table section" />
    </div>
  )
}
