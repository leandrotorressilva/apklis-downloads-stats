/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Apklis · Resumen de descargas por correo (AWS Lambda)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Hace el mismo análisis que el dashboard web (total, año/mes/semana/día con
 * tendencia frente al periodo anterior, últimos 7 días y desglose por app) y lo
 * envía por correo usando la Lambda de envío de emails (POST /send-email).
 *
 * DESPLIEGUE
 *   1. Crear una Lambda "Author from scratch", runtime Node.js 20.x o superior.
 *   2. Pegar este archivo entero en `index.mjs` (handler: index.handler).
 *   3. Configuration → General: timeout 30 s (128 MB de memoria basta).
 *   4. Configuration → Environment variables: ver tabla de abajo.
 *   5. Disparador: EventBridge Scheduler, p. ej. todos los días a las 21:00 de
 *      Cuba → cron(0 21 * * ? *) con zona horaria America/Havana.
 *   Sin dependencias: no hace falta zip ni layers.
 *
 * VARIABLES DE ENTORNO
 *   Obligatorias
 *     APKLIS_USERNAME     Usuario de Apklis.
 *     APKLIS_PASSWORD     Contraseña de Apklis.
 *     EMAIL_LAMBDA_URL    URL de la Lambda de envío (Function URL o API Gateway).
 *     EMAIL_API_KEY       Valor del header x-api-key de la Lambda de envío.
 *     EMAIL_TO            Destinatario(s). Varios separados por coma.
 *
 *   Opcionales
 *     APKLIS_APPS         Package ids para el desglose por app, separados por coma.
 *                         Para añadir una app nueva basta con agregarla aquí.
 *                         Default: com.nautbol.android,com.ineed.tv.cu,com.ineed.mlc,
 *                                  com.ineed.whtasappfinder,com.ineed.directory
 *     EMAIL_SENDER_NAME   Nombre del remitente. Default: "Apklis Stats".
 *     TIMEZONE            Zona horaria para decidir qué es "hoy". Default: America/Havana.
 *     REPORT_OFFSET_DAYS  Día de referencia del informe: 0 = hoy (como la web),
 *                         1 = ayer (útil si la Lambda corre por la mañana y quieres
 *                         el último día completo). Default: 0.
 *     APKLIS_CLIENT_ID    OAuth client id de Apklis. Default: el que usa la web.
 *     SEND_ERROR_EMAIL    "false" para NO enviar un correo cuando falle. Default: true.
 *
 * PRUEBA MANUAL
 *   Botón "Test" en la consola con cualquier evento ({}). El evento también admite
 *   overrides puntuales: { "to": "otro@correo.com", "apps": ["com.x.y"], "offsetDays": 1 }
 *   (los overrides se ignoran si se invoca por HTTP / Function URL).
 *
 * TOLERANCIA A FALLOS
 *   El handler nunca lanza: siempre responde { statusCode, body } con un JSON que
 *   explica qué pasó (ok, stage, error/errors, warnings). Variables que faltan se
 *   listan todas juntas; TIMEZONE/REPORT_OFFSET_DAYS inválidos caen al default;
 *   si falla el desglose por app se envía igualmente el resumen general con aviso;
 *   las peticiones tienen timeout de 15 s; si algo falla se intenta avisar por correo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API = 'https://api.apklis.cu'

const DEFAULT_APPS = [
  'com.nautbol.android',
  'com.ineed.tv.cu',
  'com.ineed.mlc',
  'com.ineed.whtasappfinder',
  'com.ineed.directory',
]

// ── Config ──────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000
const DEFAULT_TZ = 'America/Havana'

const str = (v) => (typeof v === 'string' ? v.trim() : '')
const list = (v) => (Array.isArray(v) ? v : str(v).split(',')).map(str).filter(Boolean)

const validTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Lee la configuración sin lanzar nunca: devuelve { cfg, errors, warnings }.
 * Los overrides del evento solo se aceptan en invocaciones directas (Test de la
 * consola, CLI, EventBridge), no por HTTP, para que nadie pueda usar la Function
 * URL para mandar correos a otras direcciones.
 */
function loadConfig(event) {
  const env = process.env
  const errors = []
  const warnings = []
  const isHttp = !!(event && typeof event === 'object' && (event.requestContext || event.rawPath || event.httpMethod))
  const ov = !isHttp && event && typeof event === 'object' ? event : {}

  const req = (name) => {
    const v = str(env[name])
    if (!v) errors.push(`Falta la variable de entorno ${name}`)
    return v
  }

  const to = list(ov.to).length ? list(ov.to) : list(req('EMAIL_TO'))
  if (str(env.EMAIL_TO) && !to.length) errors.push('EMAIL_TO no contiene ninguna dirección')

  let timeZone = str(env.TIMEZONE) || DEFAULT_TZ
  if (!validTimeZone(timeZone)) {
    warnings.push(`TIMEZONE "${timeZone}" no es válida; se usa ${DEFAULT_TZ}`)
    timeZone = DEFAULT_TZ
  }

  const rawOffset = ov.offsetDays ?? env.REPORT_OFFSET_DAYS ?? 0
  let offsetDays = Math.trunc(Number(rawOffset))
  if (!Number.isFinite(offsetDays) || offsetDays < 0 || offsetDays > 365) {
    warnings.push(`REPORT_OFFSET_DAYS "${rawOffset}" no es válido; se usa 0`)
    offsetDays = 0
  }

  const apps = list(ov.apps).length ? list(ov.apps) : list(env.APKLIS_APPS).length ? list(env.APKLIS_APPS) : DEFAULT_APPS

  return {
    errors,
    warnings,
    cfg: {
      username: req('APKLIS_USERNAME'),
      password: req('APKLIS_PASSWORD'),
      clientId: str(env.APKLIS_CLIENT_ID) || 'uX02RsZTSZN2NbOCYT0jAN0bqTeI8BEcRQXRgDu7',
      apps,
      emailUrl: req('EMAIL_LAMBDA_URL'),
      emailKey: req('EMAIL_API_KEY'),
      to,
      senderName: str(env.EMAIL_SENDER_NAME) || 'Apklis Stats',
      timeZone,
      offsetDays,
      sendErrorEmail: str(env.SEND_ERROR_EMAIL).toLowerCase() !== 'false',
    },
  }
}

// ── HTTP con timeout y errores legibles ─────────────────────────────────────

async function request(label, url, init) {
  let res
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  } catch (err) {
    const why = err?.name === 'TimeoutError' ? `sin respuesta en ${FETCH_TIMEOUT_MS / 1000} s` : err?.cause?.code || err?.message || String(err)
    throw new Error(`${label}: no se pudo conectar (${why})`)
  }
  const body = await res.text().catch(() => '')
  let json = null
  try {
    json = body ? JSON.parse(body) : null
  } catch {
    /* respuesta no JSON */
  }
  return { res, json, body }
}

// ── Apklis API ──────────────────────────────────────────────────────────────

async function login({ username, password, clientId }) {
  const { res, json } = await request('Apklis login', `${API}/o/token/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, username, password, grant_type: 'password' }),
  })
  if (res.status === 400 || res.status === 401) throw new Error('Apklis: credenciales incorrectas')
  if (!res.ok) throw new Error(`Apklis login: HTTP ${res.status}`)
  if (!str(json?.access_token)) throw new Error('Apklis login: la respuesta no trae access_token')
  return json.access_token
}

/**
 * Devuelve el histograma normalizado (descarta registros mal formados).
 * @returns {Promise<{dates: string, count: number, apps: {app_name: string, count: number}[]}[]>}
 */
async function getHistogram(token, apps = []) {
  const { res, json } = await request('Apklis histogram', `${API}/v3/dashboard/histogram/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ apps, type: 'day' }),
  })
  if (!res.ok) throw new Error(`Apklis histogram: HTTP ${res.status}`)
  if (!Array.isArray(json)) throw new Error('Apklis histogram: respuesta inesperada (no es una lista)')
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return json
    .filter((p) => p && typeof p.dates === 'string' && /^\d{4}-\d{2}-\d{2}/.test(p.dates))
    .map((p) => ({
      dates: p.dates,
      count: num(p.count),
      apps: (Array.isArray(p.apps) ? p.apps : [])
        .filter((a) => a && a.app_name != null)
        .map((a) => ({ app_name: String(a.app_name), count: num(a.count) })),
    }))
}

// ── Fechas (en la zona horaria configurada; Lambda corre en UTC) ─────────────

const DAY = 86_400_000

/** Clave YYYY-MM-DD de "hoy" en la zona horaria dada. */
const todayKey = (timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/** Desplaza una clave YYYY-MM-DD `n` días hacia atrás. */
const shiftKey = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) - n * DAY).toISOString().slice(0, 10)

const dayLabel = (key, opts) => new Date(`${key}T12:00:00Z`).toLocaleDateString('es', { timeZone: 'UTC', ...opts })

// ── Análisis (mismo criterio que Dashboard.tsx) ─────────────────────────────

/** Mapa día → registro del histograma. */
const byDay = (data) => new Map(data.map((p) => [p.dates.slice(0, 10), p]))

/** Suma entre hace `from` y hace `to` días respecto a `ref` (ambos inclusive). */
function sumRange(data, ref, from, to) {
  const start = shiftKey(ref, from)
  const end = shiftKey(ref, to)
  return data.reduce((n, p) => {
    const k = p.dates.slice(0, 10)
    return k >= start && k <= end ? n + p.count : n
  }, 0)
}

const period = (data, ref, label, days) => ({
  label,
  value: sumRange(data, ref, days - 1, 0),
  previous: sumRange(data, ref, 2 * days - 1, days),
})

function analyze(all, perApp, ref) {
  const days = byDay(all)
  const appDays = byDay(perApp)
  const isToday = (k) => k === ref

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = shiftKey(ref, 6 - i)
    return { key, label: dayLabel(key, { weekday: 'short', day: 'numeric' }), count: days.get(key)?.count ?? 0 }
  })

  // Desglose por app: día de referencia, día anterior y suma de 7 días.
  const appCount = (key, name) => appDays.get(key)?.apps.find((a) => a.app_name === name)?.count ?? 0
  const names = new Set()
  for (let i = 0; i < 14; i++) appDays.get(shiftKey(ref, i))?.apps.forEach((a) => names.add(a.app_name))
  const apps = [...names]
    .map((name) => {
      const sumDays = (from, to) => {
        let n = 0
        for (let i = from; i <= to; i++) n += appCount(shiftKey(ref, i), name)
        return n
      }
      return {
        name,
        day: appCount(ref, name),
        prevDay: appCount(shiftKey(ref, 1), name),
        week: sumDays(0, 6),
        prevWeek: sumDays(7, 13),
      }
    })
    .sort((a, b) => b.day - a.day || b.week - a.week)

  return {
    ref,
    total: all.reduce((n, p) => n + p.count, 0),
    periods: [
      period(all, ref, 'Último año', 365),
      period(all, ref, 'Último mes', 30),
      period(all, ref, 'Última semana', 7),
      period(all, ref, isToday(ref) ? 'Hoy (vs ayer)' : 'Día (vs anterior)', 1),
    ],
    week,
    apps,
  }
}

// ── Render del correo ───────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString('es-ES')
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function trend(value, previous) {
  if (!previous) return null
  const pct = ((value - previous) / previous) * 100
  return { pct, arrow: pct > 0 ? '▲' : pct < 0 ? '▼' : '=', color: pct > 0 ? '#16a34a' : pct < 0 ? '#dc2626' : '#6b7280' }
}

const trendText = (v, p) => {
  const t = trend(v, p)
  return t ? ` ${t.arrow} ${Math.abs(t.pct).toFixed(1)}% (antes ${fmt(p)})` : ''
}

const trendHtml = (v, p, small = false) => {
  const t = trend(v, p)
  if (!t) return ''
  return `<span style="color:${t.color};font-size:${small ? 12 : 13}px;white-space:nowrap">${t.arrow} ${Math.abs(t.pct).toFixed(1)}%</span>`
}

function renderText(r) {
  const lines = [
    `Resumen Apklis — ${dayLabel(r.ref, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    '',
    `Total: ${fmt(r.total)}`,
    ...r.periods.map((p) => `${p.label}: ${fmt(p.value)}${trendText(p.value, p.previous)}`),
    '',
    'Últimos 7 días:',
    ...r.week.map((d) => `  ${d.label.padEnd(10)} ${fmt(d.count)}`),
    '',
    'Por app (día / 7 días):',
    ...(r.apps.length
      ? r.apps.map((a) => `  ${a.name}: ${fmt(a.day)}${trendText(a.day, a.prevDay)} / ${fmt(a.week)}${trendText(a.week, a.prevWeek)}`)
      : ['  Sin descargas.']),
  ]
  return lines.join('\n')
}

function renderHtml(r) {
  const card = 'background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;'
  const muted = 'color:#6b7280;font-size:13px;'
  const max = Math.max(...r.week.map((d) => d.count), 1)
  const dateTitle = dayLabel(r.ref, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const kpi = (label, value, extra = '') => `
    <td style="padding:6px;width:50%;vertical-align:top">
      <div style="${card}">
        <div style="${muted}">${esc(label)}</div>
        <div style="font-size:24px;font-weight:700;color:#111827;margin:4px 0">${fmt(value)}</div>
        ${extra}
      </div>
    </td>`

  const kpis = [kpi('Total', r.total), ...r.periods.map((p) =>
    kpi(p.label, p.value, p.previous ? `${trendHtml(p.value, p.previous)} <span style="${muted}font-size:12px">antes ${fmt(p.previous)}</span>` : ''),
  )]
  const kpiRows = []
  for (let i = 0; i < kpis.length; i += 2) kpiRows.push(`<tr>${kpis[i]}${kpis[i + 1] ?? '<td></td>'}</tr>`)

  const bars = r.week.map((d) => {
    const h = Math.round((d.count / max) * 100)
    const top = d.count === max && max > 0
    return `
      <td style="vertical-align:bottom;text-align:center;padding:0 3px">
        <div style="font-size:12px;color:#111827;margin-bottom:4px">${fmt(d.count)}</div>
        <div style="height:${Math.max(h, 2)}px;background:${top ? '#2563eb' : '#93c5fd'};border-radius:4px 4px 0 0"></div>
      </td>`
  }).join('')
  const barLabels = r.week.map((d) => `<td style="text-align:center;${muted}font-size:11px;padding-top:4px">${esc(d.label)}</td>`).join('')

  const appRows = r.apps.length
    ? r.apps.map((a) => `
        <tr>
          <td style="padding:8px 0;border-top:1px solid #f3f4f6;color:#111827">${esc(a.name)}</td>
          <td style="padding:8px 0 8px 8px;border-top:1px solid #f3f4f6;text-align:right;white-space:nowrap">
            <strong>${fmt(a.day)}</strong><br>${trendHtml(a.day, a.prevDay, true)}
          </td>
          <td style="padding:8px 0 8px 8px;border-top:1px solid #f3f4f6;text-align:right;white-space:nowrap">
            <strong>${fmt(a.week)}</strong><br>${trendHtml(a.week, a.prevWeek, true)}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="${muted}">Sin descargas.</td></tr>`

  const appDayTotal = r.apps.reduce((n, a) => n + a.day, 0)

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
        <tr><td style="padding:0 6px 12px">
          <div style="font-size:22px;font-weight:700;color:#111827">Apklis</div>
          <div style="${muted}">Resumen del ${esc(dateTitle)}</div>
        </td></tr>

        <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kpiRows.join('')}</table></td></tr>

        <tr><td style="padding:6px">
          <div style="${card}">
            <div style="font-weight:600;color:#111827;margin-bottom:12px">Últimos 7 días</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed">
              <tr style="height:130px">${bars}</tr>
              <tr>${barLabels}</tr>
            </table>
          </div>
        </td></tr>

        <tr><td style="padding:6px">
          <div style="${card}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-weight:600;color:#111827;padding-bottom:8px">Por app</td>
                <td style="${muted}text-align:right;padding-bottom:8px">Día</td>
                <td style="${muted}text-align:right;padding-bottom:8px">7 días</td>
              </tr>
              ${appRows}
            </table>
            <div style="${muted}margin-top:8px">Total del día: ${fmt(appDayTotal)}</div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ── Envío ───────────────────────────────────────────────────────────────────

/** Envía a cada destinatario; un fallo en uno no impide los demás. */
async function sendEmail(cfg, { subject, text, html }) {
  const failed = []
  for (const to of cfg.to) {
    try {
      const { res, body } = await request('Lambda de correo', cfg.emailUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.emailKey },
        body: JSON.stringify({ to, subject, senderName: cfg.senderName, text, html }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${body.slice(0, 300)}`.trim())
    } catch (err) {
      failed.push(`${to}: ${err?.message ?? err}`)
    }
  }
  if (failed.length) throw new Error(`Envío de correo falló → ${failed.join(' | ')}`)
}

// ── Handler ─────────────────────────────────────────────────────────────────

/**
 * Nunca lanza: siempre devuelve una respuesta JSON con statusCode, válida tanto
 * para invocación directa como para Function URL / API Gateway.
 */
const reply = (statusCode, payload) => {
  const level = statusCode >= 400 ? 'error' : 'log'
  console[level](JSON.stringify(payload))
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(payload, null, 2) }
}

const errMsg = (err) => (err instanceof Error ? err.message : String(err))

export const handler = async (event) => {
  let cfg
  let warnings = []
  try {
    const loaded = loadConfig(event)
    cfg = loaded.cfg
    warnings = loaded.warnings

    // Sin configuración mínima no hay nada que hacer (ni a quién avisar).
    if (loaded.errors.length) return reply(500, { ok: false, stage: 'config', errors: loaded.errors, warnings })

    const token = await login(cfg)

    // Si el desglose por app falla, se envía igualmente el resumen general.
    const [allRes, appsRes] = await Promise.allSettled([getHistogram(token), getHistogram(token, cfg.apps)])
    if (allRes.status === 'rejected') throw allRes.reason
    if (appsRes.status === 'rejected') warnings.push(`Sin desglose por app: ${errMsg(appsRes.reason)}`)

    const ref = shiftKey(todayKey(cfg.timeZone), cfg.offsetDays)
    const report = analyze(allRes.value, appsRes.status === 'fulfilled' ? appsRes.value : [], ref)
    const day = report.periods.at(-1)
    const subject = `Apklis · ${fmt(day.value)} descargas el ${dayLabel(ref, { day: 'numeric', month: 'short' })}${trendText(day.value, day.previous).replace(/ \(antes.*\)$/, '')}`

    const note = warnings.length ? `\n\nAvisos:\n${warnings.map((w) => `- ${w}`).join('\n')}` : ''
    const noteHtml = warnings.length
      ? `<div style="max-width:600px;margin:0 auto 24px;padding:0 18px;color:#b45309;font:13px sans-serif">${warnings.map((w) => `⚠ ${esc(w)}`).join('<br>')}</div>`
      : ''

    await sendEmail(cfg, {
      subject,
      text: renderText(report) + note,
      html: renderHtml(report).replace('</body>', `${noteHtml}</body>`),
    })
    return reply(200, { ok: true, subject, ref, total: report.total, to: cfg.to, warnings })
  } catch (err) {
    const error = errMsg(err)
    let errorEmail = 'no enviado'
    if (cfg?.sendErrorEmail && cfg.emailUrl && cfg.emailKey && cfg.to?.length && !error.startsWith('Envío de correo falló')) {
      try {
        await sendEmail(cfg, {
          subject: 'Apklis · Error generando el resumen',
          text: `No se pudo generar el resumen de Apklis.\n\n${error}`,
          html: `<p>No se pudo generar el resumen de Apklis.</p><pre>${esc(error)}</pre>`,
        })
        errorEmail = 'enviado'
      } catch (e) {
        errorEmail = `falló: ${errMsg(e)}`
      }
    }
    return reply(500, { ok: false, stage: 'run', error, errorEmail, warnings })
  }
}
