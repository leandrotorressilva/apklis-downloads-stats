/**
 * Minimal client for the Apklis API.
 *
 * Apklis does not allow cross-origin requests, so every call goes through
 * `/apklis`, which is proxied to https://api.apklis.cu (Vite in development,
 * `vercel.json` rewrites in production).
 */

const BASE = '/apklis'
/** Public OAuth client id of the Apklis developer console (console.apklis.cu). */
const CLIENT_ID = 'uX02RsZTSZN2NbOCYT0jAN0bqTeI8BEcRQXRgDu7'
const SESSION_KEY = 'apklis-stats.session'

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AppCount {
  app_name: string
  count: number
}

export interface HistogramPoint {
  dates: string
  count: number
  apps: AppCount[]
}

/** Package ids of the apps shown in the per-app table (see `.env.example`). */
export const PACKAGE_IDS: string[] = (import.meta.env.VITE_APKLIS_APPS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

export type ApiErrorCode = 'INVALID_CREDENTIALS' | 'UNAUTHORIZED' | 'NETWORK' | 'SERVER'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number

  constructor(code: ApiErrorCode, status?: number) {
    super(status ? `${code} (HTTP ${status})` : code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.code === 'UNAUTHORIZED'

// ── Session storage ──────────────────────────────────────────────────────────

const isSession = (value: unknown): value is Session => {
  const s = value as Session | null
  return !!s && typeof s.accessToken === 'string' && typeof s.refreshToken === 'string' && typeof s.expiresAt === 'number'
}

export function loadSession(): Session | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
    return isSession(value) ? value : null
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage may be unavailable (private mode, blocked site data): the session just won't persist.
  }
}

// ── Requests ─────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown, token?: string): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK')
  }
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

async function requestToken(body: Record<string, string>, rejectedCode: ApiErrorCode): Promise<Session> {
  const res = await post('/o/token/', { client_id: CLIENT_ID, ...body })
  if (res.status === 400 || res.status === 401) throw new ApiError(rejectedCode, res.status)
  if (!res.ok) throw new ApiError('SERVER', res.status)
  const token = (await res.json()) as TokenResponse
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  }
}

export const login = (username: string, password: string) =>
  requestToken({ username, password, grant_type: 'password' }, 'INVALID_CREDENTIALS')

export const refresh = (refreshToken: string) =>
  requestToken({ refresh_token: refreshToken, grant_type: 'refresh_token' }, 'UNAUTHORIZED')

/** Returns a valid session, refreshing it when it is about to expire. */
export async function freshSession(session: Session): Promise<Session> {
  if (session.expiresAt - Date.now() > 60_000) return session
  return refresh(session.refreshToken)
}

async function authorizedPost(session: Session, path: string, body?: unknown): Promise<unknown> {
  const res = await post(path, body, session.accessToken)
  if (res.status === 401 || res.status === 403) throw new ApiError('UNAUTHORIZED', res.status)
  if (!res.ok) throw new ApiError('SERVER', res.status)
  try {
    return await res.json()
  } catch {
    throw new ApiError('SERVER', res.status)
  }
}

/** Daily download histogram, optionally broken down by the given package ids. */
export async function getHistogram(session: Session, apps: string[] = []): Promise<HistogramPoint[]> {
  const data = await authorizedPost(session, '/v3/dashboard/histogram/', { apps, type: 'day' })
  if (!Array.isArray(data)) throw new ApiError('SERVER')
  return data as HistogramPoint[]
}
