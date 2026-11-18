import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2.49.8'
import * as kv from './kv_store.tsx'
import { readiness, recommendations } from './domain.ts'

const app = new Hono()
const prefix = '/make-server-c6ad5cab'

app.use('*', logger(console.log))
app.use(
  '/*',
  cors({
    origin: (origin) => {
      const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      return allowed.length === 0 || allowed.includes(origin) ? origin : ''
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  }),
)

type AuthUser = {
  id: string
  email?: string
  app_metadata?: { role?: string }
}

async function authenticate(c: any): Promise<AuthUser | null> {
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null
  return data.user as AuthUser
}

async function requireUser(c: any): Promise<AuthUser | Response> {
  const user = await authenticate(c)
  return user ?? c.json({ error: 'Authentication required' }, 401)
}

const owned = (userId: string, resource: string) => `user:${userId}:${resource}`
function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

app.get(`${prefix}/health`, (c) =>
  c.json({
    status: 'ok',
    service: 'AgroVision AI API',
    weatherProvider: 'Open-Meteo',
    creditModel: 'disabled',
  }),
)

app.get(`${prefix}/bootstrap`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const [profile, activities, financial, notifications, savedMarkets] = await Promise.all([
    kv.get(owned(auth.id, 'profile')),
    kv.get(owned(auth.id, 'activities')),
    kv.get(owned(auth.id, 'financial')),
    kv.get(owned(auth.id, 'notifications')),
    kv.get(owned(auth.id, 'saved-markets')),
  ])
  return c.json({
    user: { id: auth.id, email: auth.email, role: auth.app_metadata?.role ?? 'farmer' },
    profile: profile ?? null,
    activities: asList(activities),
    financial: asList(financial),
    notifications: asList(notifications),
    savedMarkets: asList(savedMarkets),
    recommendations: recommendations(profile ?? {}),
    assessment: readiness(asList(financial), Boolean(profile?.financialConsent)),
  })
})

app.put(`${prefix}/profile`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const body = await c.req.json()
  const allowed = [
    'fullName',
    'farmName',
    'state',
    'lga',
    'latitude',
    'longitude',
    'farmSize',
    'farmSizeUnit',
    'crops',
    'soilType',
    'irrigation',
    'farmingMethod',
    'plantingDate',
    'expectedHarvestDate',
    'financialConsent',
  ]
  const profile: Record<string, unknown> = {}
  for (const field of allowed) if (field in body) profile[field] = body[field]
  if (Number(profile.farmSize) < 0) return c.json({ error: 'Farm size cannot be negative' }, 400)
  if (profile.latitude && (Number(profile.latitude) < -90 || Number(profile.latitude) > 90)) {
    return c.json({ error: 'Latitude must be between -90 and 90' }, 400)
  }
  await kv.set(owned(auth.id, 'profile'), profile)
  return c.json({ profile, recommendations: recommendations(profile) })
})

app.get(`${prefix}/activities`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  return c.json({ items: asList(await kv.get(owned(auth.id, 'activities'))) })
})

app.post(`${prefix}/activities`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const body = await c.req.json()
  if (!body.type || !body.date) return c.json({ error: 'Activity type and date are required' }, 400)
  const items = asList<Record<string, any>>(await kv.get(owned(auth.id, 'activities')))
  const item = {
    id: crypto.randomUUID(),
    type: String(body.type).slice(0, 50),
    date: body.date,
    crop: String(body.crop ?? '').slice(0, 80),
    quantity: Number(body.quantity || 0),
    unit: String(body.unit ?? '').slice(0, 20),
    notes: String(body.notes ?? '').slice(0, 500),
    createdAt: new Date().toISOString(),
  }
  await kv.set(owned(auth.id, 'activities'), [item, ...items].slice(0, 500))
  return c.json({ item }, 201)
})

app.post(`${prefix}/financial`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const body = await c.req.json()
  if (!['sale', 'expense'].includes(body.type) || Number(body.amount) <= 0) {
    return c.json({ error: 'Enter a valid sale or expense amount' }, 400)
  }
  const items = asList<Record<string, any>>(await kv.get(owned(auth.id, 'financial')))
  const item = {
    id: crypto.randomUUID(),
    type: body.type,
    amount: Number(body.amount),
    currency: 'NGN',
    date: body.date,
    category: String(body.category ?? '').slice(0, 100),
    evidenceStatus:
      body.evidenceStatus === 'document-supported' ? 'document-supported' : 'farmer-reported',
    createdAt: new Date().toISOString(),
  }
  const updated = [item, ...items].slice(0, 1000)
  await kv.set(owned(auth.id, 'financial'), updated)
  const profile = await kv.get(owned(auth.id, 'profile'))
  return c.json({ item, assessment: readiness(updated, Boolean(profile?.financialConsent)) }, 201)
})

app.get(`${prefix}/weather`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const profile = await kv.get(owned(auth.id, 'profile'))
  const latitude = Number(c.req.query('lat') ?? profile?.latitude)
  const longitude = Number(c.req.query('lng') ?? profile?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return c.json({ error: 'Add valid farm coordinates to view local weather' }, 400)
  }
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'Africa/Lagos',
    forecast_days: '7',
  }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(9000) })
  if (!response.ok) return c.json({ error: 'Weather provider is temporarily unavailable' }, 502)
  const data = await response.json()
  const alerts = []
  const maxRain = Math.max(...(data.daily?.precipitation_sum ?? [0]))
  const maxTemp = Math.max(...(data.daily?.temperature_2m_max ?? [0]))
  const maxWind = Math.max(...(data.daily?.wind_speed_10m_max ?? [0]))
  if (maxRain >= 40)
    alerts.push({
      severity: 'high',
      trigger: 'Forecast rainfall ≥ 40 mm/day',
      precaution: 'Inspect drainage and avoid scheduling harvest during the affected period.',
    })
  if (maxTemp >= 38)
    alerts.push({
      severity: 'medium',
      trigger: 'Forecast temperature ≥ 38°C',
      precaution: 'Review crop water stress and schedule field work for cooler hours.',
    })
  if (maxWind >= 35)
    alerts.push({
      severity: 'medium',
      trigger: 'Forecast wind ≥ 35 km/h',
      precaution: 'Secure light equipment and review exposed crops.',
    })
  return c.json({
    ...data,
    alerts: alerts.map((alert) => ({
      ...alert,
      kind: 'forecast',
      source: 'Open-Meteo',
      createdAt: new Date().toISOString(),
      limitation: 'A forecast is not a confirmed event or guarantee of crop loss.',
    })),
    attribution: 'Weather data by Open-Meteo',
    retrievedAt: new Date().toISOString(),
  })
})

app.get(`${prefix}/markets`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const items = asList<Record<string, any>>(await kv.get('market:verified-prices'))
  return c.json({
    items,
    status: items.length ? 'available' : 'unavailable',
    message: items.length
      ? undefined
      : 'No verified Nigerian market price source has been imported. Live prices are not fabricated.',
    forecastingSupported: false,
  })
})

app.post(`${prefix}/markets/import`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  if (auth.app_metadata?.role !== 'admin')
    return c.json({ error: 'Administrator role required' }, 403)
  const body = await c.req.json()
  const rows = asList<Record<string, any>>(body.rows)
  const errors: Array<{ row: number; message: string }> = []
  const valid = rows.flatMap((row, index) => {
    if (
      !row.commodity ||
      !row.market ||
      Number(row.price) <= 0 ||
      !row.unit ||
      !row.observationDate ||
      !row.source
    ) {
      errors.push({
        row: index + 1,
        message: 'Commodity, market, positive price, unit, date and source are required',
      })
      return []
    }
    return [
      {
        id: crypto.randomUUID(),
        commodity: String(row.commodity),
        market: String(row.market),
        state: String(row.state ?? ''),
        price: Number(row.price),
        currency: 'NGN',
        unit: String(row.unit),
        originalUnit: String(row.unit),
        observationDate: row.observationDate,
        source: String(row.source),
        verificationStatus: 'admin-verified',
        retrievedAt: new Date().toISOString(),
      },
    ]
  })
  if (valid.length) await kv.set('market:verified-prices', valid)
  return c.json({ accepted: valid.length, rejected: errors.length, errors })
})

app.patch(`${prefix}/notifications/:id`, async (c) => {
  const auth = await requireUser(c)
  if (auth instanceof Response) return auth
  const items = asList<Record<string, any>>(await kv.get(owned(auth.id, 'notifications')))
  const updated = items.map((item) =>
    item.id === c.req.param('id') ? { ...item, read: true } : item,
  )
  await kv.set(owned(auth.id, 'notifications'), updated)
  return c.json({ ok: true })
})

Deno.serve(app.fetch)
