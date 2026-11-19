import { and, desc, eq } from 'drizzle-orm'
import { getAuth } from '@/lib/auth'
import { getDatabase } from '@/lib/db'
import { farmActivities, farmProfiles, financialRecords, marketPrices } from '@/lib/db/schema'
import { readiness, recommendations } from '@/lib/domain'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ path: string[] }> }
type Session = { user: { id: string; email: string; role?: string } }

function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

async function getSession(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as typeof session.user & { role?: string }).role,
    },
  } satisfies Session
}

async function bodyOf(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new Error('Request body must be valid JSON')
  }
}

function ownedProfile(session: Session) {
  return getDatabase().query.farmProfiles.findFirst({
    where: eq(farmProfiles.userId, session.user.id),
  })
}

async function route(request: Request, context: RouteContext) {
  const { path } = await context.params
  const endpoint = path.join('/')
  const method = request.method.toUpperCase()

  if (endpoint === 'health' && method === 'GET') {
    return json({ status: 'ok', service: 'AgroVision AI API', weatherProvider: 'Open-Meteo', creditModel: 'disabled' })
  }

  const session = await getSession(request)
  if (!session) return json({ error: 'Authentication required' }, 401)
  const db = getDatabase()
  const userId = session.user.id

  if (endpoint === 'bootstrap' && method === 'GET') {
    const [profileRow, activityRows, financialRows] = await Promise.all([
      ownedProfile(session),
      db.select().from(farmActivities).where(eq(farmActivities.ownerId, userId)).orderBy(desc(farmActivities.createdAt)),
      db.select().from(financialRecords).where(eq(financialRecords.ownerId, userId)).orderBy(desc(financialRecords.createdAt)),
    ])
    const profile = profileRow?.profile ?? null
    const activities = activityRows.map((row) => row.activity)
    const financial = financialRows.map((row) => row.record)
    return json({
      user: { id: userId, email: session.user.email, role: session.user.role ?? 'farmer' },
      profile,
      activities,
      financial,
      notifications: [],
      savedMarkets: [],
      recommendations: recommendations(profile ?? {}),
      assessment: readiness(financial as Parameters<typeof readiness>[0], Boolean(profile?.financialConsent)),
    })
  }

  if (endpoint === 'profile' && method === 'PUT') {
    const body = await bodyOf(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Profile must be an object' }, 400)
    const allowed = [
      'fullName', 'farmName', 'state', 'lga', 'latitude', 'longitude', 'farmSize', 'farmSizeUnit',
      'crops', 'soilType', 'irrigation', 'farmingMethod', 'plantingDate', 'expectedHarvestDate', 'financialConsent',
    ]
    const profile: Record<string, unknown> = { ...(await ownedProfile(session))?.profile }
    for (const field of allowed) if (Object.hasOwn(body, field)) profile[field] = body[field]
    if (profile.farmSize !== undefined && Number(profile.farmSize) < 0) return json({ error: 'Farm size cannot be negative' }, 400)
    if (profile.latitude != null && (!Number.isFinite(Number(profile.latitude)) || Number(profile.latitude) < -90 || Number(profile.latitude) > 90)) {
      return json({ error: 'Latitude must be between -90 and 90' }, 400)
    }
    if (profile.longitude != null && (!Number.isFinite(Number(profile.longitude)) || Number(profile.longitude) < -180 || Number(profile.longitude) > 180)) {
      return json({ error: 'Longitude must be between -180 and 180' }, 400)
    }
    await db.insert(farmProfiles).values({ userId, profile }).onConflictDoUpdate({
      target: farmProfiles.userId,
      set: { profile, updatedAt: new Date() },
    })
    return json({ profile, recommendations: recommendations(profile) })
  }

  if (endpoint === 'activities' && method === 'GET') {
    const items = await db.select({ activity: farmActivities.activity }).from(farmActivities)
      .where(eq(farmActivities.ownerId, userId)).orderBy(desc(farmActivities.createdAt))
    return json({ items: items.map((item) => item.activity) })
  }

  if (endpoint === 'activities' && method === 'POST') {
    const body = await bodyOf(request)
    if (!body?.type || !body?.date) return json({ error: 'Activity type and date are required' }, 400)
    const item = {
      id: crypto.randomUUID(),
      type: String(body.type).slice(0, 50),
      date: String(body.date),
      crop: String(body.crop ?? '').slice(0, 80),
      quantity: Number(body.quantity || 0),
      unit: String(body.unit ?? '').slice(0, 20),
      notes: String(body.notes ?? '').slice(0, 500),
      createdAt: new Date().toISOString(),
    }
    await db.insert(farmActivities).values({ id: item.id, ownerId: userId, activity: item })
    return json({ item }, 201)
  }

  if (endpoint === 'financial' && method === 'POST') {
    const body = await bodyOf(request)
    const amount = Number(body?.amount)
    if (!['sale', 'expense'].includes(body?.type) || !Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Enter a valid sale or expense amount' }, 400)
    }
    const item = {
      id: crypto.randomUUID(),
      type: body.type,
      amount,
      currency: 'NGN',
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      category: String(body.category ?? '').slice(0, 100),
      evidenceStatus: body.evidenceStatus === 'document-supported' ? 'document-supported' : 'farmer-reported',
      createdAt: new Date().toISOString(),
    }
    await db.insert(financialRecords).values({
      id: item.id,
      ownerId: userId,
      type: item.type,
      amount: String(item.amount),
      record: item,
    })
    const rows = await db.select({ record: financialRecords.record }).from(financialRecords)
      .where(eq(financialRecords.ownerId, userId))
    const profile = (await ownedProfile(session))?.profile
    return json({ item, assessment: readiness(rows.map((row) => row.record) as Parameters<typeof readiness>[0], Boolean(profile?.financialConsent)) }, 201)
  }

  if (endpoint === 'weather' && method === 'GET') {
    const profile = (await ownedProfile(session))?.profile
    const url = new URL(request.url)
    const latitude = Number(url.searchParams.get('lat') ?? profile?.latitude)
    const longitude = Number(url.searchParams.get('lng') ?? profile?.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return json({ error: 'Add valid farm coordinates to view local weather' }, 400)
    }
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
    weatherUrl.search = new URLSearchParams({
      latitude: String(latitude), longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,precipitation_probability,precipitation,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'Africa/Lagos', forecast_days: '7',
    }).toString()
    const response = await fetch(weatherUrl, { signal: AbortSignal.timeout(9000), cache: 'no-store' })
    if (!response.ok) return json({ error: 'Weather provider is temporarily unavailable' }, 502)
    const data = await response.json()
    const alerts: Array<Record<string, string>> = []
    if (Math.max(...(data.daily?.precipitation_sum ?? [0])) >= 40) alerts.push({ severity: 'high', trigger: 'Forecast rainfall ≥ 40 mm/day', precaution: 'Inspect drainage and avoid scheduling harvest during the affected period.' })
    if (Math.max(...(data.daily?.temperature_2m_max ?? [0])) >= 38) alerts.push({ severity: 'medium', trigger: 'Forecast temperature ≥ 38°C', precaution: 'Review crop water stress and schedule field work for cooler hours.' })
    if (Math.max(...(data.daily?.wind_speed_10m_max ?? [0])) >= 35) alerts.push({ severity: 'medium', trigger: 'Forecast wind ≥ 35 km/h', precaution: 'Secure light equipment and review exposed crops.' })
    return json({
      ...data,
      alerts: alerts.map((alert) => ({ ...alert, kind: 'forecast', source: 'Open-Meteo', createdAt: new Date().toISOString(), limitation: 'A forecast is not a confirmed event or guarantee of crop loss.' })),
      attribution: 'Weather data by Open-Meteo', retrievedAt: new Date().toISOString(),
    })
  }

  if (endpoint === 'markets' && method === 'GET') {
    const rows = await db.select().from(marketPrices).orderBy(desc(marketPrices.retrievedAt))
    const items = rows.map(({ retrievedAt, ...row }) => ({ ...row, retrievedAt: retrievedAt.toISOString() }))
    return json({
      items,
      status: items.length ? 'available' : 'unavailable',
      message: items.length ? undefined : 'No verified Nigerian market price source has been imported. Live prices are not fabricated.',
      forecastingSupported: false,
    })
  }

  if (endpoint === 'markets/import' && method === 'POST') {
    if (session.user.role !== 'admin') return json({ error: 'Administrator role required' }, 403)
    const body = await bodyOf(request)
    const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 5000) : []
    const errors: Array<{ row: number; message: string }> = []
    const valid = rows.flatMap((row: Record<string, unknown>, index: number) => {
      if (!row.commodity || !row.market || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0 || !row.unit || !row.observationDate || !row.source) {
        errors.push({ row: index + 1, message: 'Commodity, market, positive price, unit, date and source are required' })
        return []
      }
      return [{
        id: crypto.randomUUID(), commodity: String(row.commodity).slice(0, 120),
        market: String(row.market).slice(0, 120), state: String(row.state ?? '').slice(0, 80),
        price: String(Number(row.price)), unit: String(row.unit).slice(0, 40),
        observationDate: String(row.observationDate).slice(0, 30), source: String(row.source).slice(0, 500),
        verificationStatus: 'admin-verified', retrievedAt: new Date(),
      }]
    })
    await db.transaction(async (tx) => {
      await tx.delete(marketPrices)
      if (valid.length) await tx.insert(marketPrices).values(valid)
    })
    return json({ accepted: valid.length, rejected: errors.length, errors })
  }

  const notificationMatch = endpoint.match(/^notifications\/([^/]+)$/)
  if (notificationMatch && method === 'PATCH') return json({ ok: true })
  return json({ error: 'Not found' }, 404)
}

async function handler(request: Request, context: RouteContext) {
  try {
    return await route(request, context)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Request body must be valid JSON' ? 400 : 500
    if (status === 500) console.error('AgroVision API request failed:', error)
    return json({ error: status === 500 ? 'Request failed' : message }, status)
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler