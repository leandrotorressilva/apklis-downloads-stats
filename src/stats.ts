import type { HistogramPoint } from './api'

const pad = (n: number) => String(n).padStart(2, '0')

/** `YYYY-MM-DD` key of a date in local time. */
export const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** The date `days` days before `from`. */
export function daysAgo(days: number, from: Date) {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return date
}

const pointKey = (point: HistogramPoint) => point.dates.slice(0, 10)

/** Sum of downloads between `from` and `to` days ago (both inclusive, 0 = today). */
export function sumRange(data: HistogramPoint[], from: number, to: number, today: Date) {
  const start = dayKey(daysAgo(from, today))
  const end = dayKey(daysAgo(to, today))
  return data.reduce((sum, point) => {
    const key = pointKey(point)
    return key >= start && key <= end ? sum + point.count : sum
  }, 0)
}

export const total = (data: HistogramPoint[]) => data.reduce((sum, point) => sum + point.count, 0)

export type PeriodId = 'year' | 'month' | 'week' | 'today'

export interface Period {
  id: PeriodId
  value: number
  /** Same-length period right before this one. */
  previous: number
}

const PERIOD_DAYS: Record<PeriodId, number> = { year: 365, month: 30, week: 7, today: 1 }

export function periods(data: HistogramPoint[], today: Date): Period[] {
  return (Object.keys(PERIOD_DAYS) as PeriodId[]).map((id) => {
    const days = PERIOD_DAYS[id]
    return { id, value: sumRange(data, days - 1, 0, today), previous: sumRange(data, 2 * days - 1, days, today) }
  })
}

export interface Day {
  key: string
  date: Date
  count: number
}

/** Downloads per day for the last `days` days, oldest first. */
export function lastDays(data: HistogramPoint[], days: number, today: Date): Day[] {
  return Array.from({ length: days }, (_, i) => {
    const date = daysAgo(days - 1 - i, today)
    const key = dayKey(date)
    return { key, date, count: data.reduce((sum, p) => (pointKey(p) === key ? sum + p.count : sum), 0) }
  })
}

// ── Apps ─────────────────────────────────────────────────────────────────────

export interface AppStats {
  /** Name as reported by the per-app histogram. */
  name: string
  today: number
  yesterday: number
  week: number
  previousWeek: number
}

/** Per-app downloads by day: day key → app name → count. */
function appCountsByDay(data: HistogramPoint[]) {
  const days = new Map<string, Map<string, number>>()
  for (const point of data) {
    const key = pointKey(point)
    const counts = days.get(key) ?? new Map<string, number>()
    for (const app of point.apps ?? []) {
      const name = String(app.app_name)
      counts.set(name, (counts.get(name) ?? 0) + (Number(app.count) || 0))
    }
    days.set(key, counts)
  }
  return days
}

/** Apps with downloads today, with today vs. yesterday and last 7 days vs. the 7 before, sorted by today. */
export function appStats(byApp: HistogramPoint[], today: Date): AppStats[] {
  const days = appCountsByDay(byApp)
  const countOn = (name: string, daysBack: number) => days.get(dayKey(daysAgo(daysBack, today)))?.get(name) ?? 0
  const sum = (name: string, from: number, to: number) => {
    let total = 0
    for (let i = from; i <= to; i++) total += countOn(name, i)
    return total
  }

  const names = [...(days.get(dayKey(today))?.keys() ?? [])]
  return names
    .map((name) => ({
      name,
      today: countOn(name, 0),
      yesterday: countOn(name, 1),
      week: sum(name, 0, 6),
      previousWeek: sum(name, 7, 13),
    }))
    .filter((app) => app.today > 0)
    .sort((a, b) => b.today - a.today || b.week - a.week)
}
