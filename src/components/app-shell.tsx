'use client'

import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  FileText,
  HelpCircle,
  Landmark,
  Leaf,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sprout,
  Tractor,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiRequest, supabase } from '@/lib/supabase'
import Brand from './brand'

const sections = [
  ['dashboard', 'Dashboard', BarChart3],
  ['farm', 'My Farm', Tractor],
  ['smart-farming', 'Smart Farming', Leaf],
  ['weather', 'Weather & Alerts', CloudSun],
  ['markets', 'Market Intelligence', Landmark],
  ['financial', 'Financial Identity', Wallet],
  ['credit', 'Credit Assessment', FileText],
  ['notifications', 'Notifications', Bell],
  ['settings', 'Account Settings', Settings],
  ['help', 'Help & Support', HelpCircle],
] as const

type Bootstrap = {
  user: { email: string; role: string }
  profile: Record<string, any> | null
  activities: Array<Record<string, any>>
  financial: Array<Record<string, any>>
  notifications: Array<Record<string, any>>
  recommendations: Array<Record<string, any>>
  assessment: Record<string, any>
}

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})
const date = (value: string) =>
  value
    ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value))
    : 'Not set'

export default function AppShell({ section }: { section: string }) {
  const router = useRouter()
  const [data, setData] = useState<Bootstrap | null>(null)
  const [weather, setWeather] = useState<Record<string, any> | null>(null)
  const [markets, setMarkets] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  async function load() {
    try {
      const { data: auth } = await supabase.auth.getSession()
      if (!auth.session) return router.replace('/sign-in')
      const bootstrap = await apiRequest<Bootstrap>('/bootstrap')
      setData(bootstrap)
      if (section === 'weather' || section === 'dashboard') {
        apiRequest<Record<string, any>>('/weather')
          .then(setWeather)
          .catch((error) => setMessage(error.message))
      }
      if (section === 'markets' || section === 'dashboard') {
        apiRequest<Record<string, any>>('/markets')
          .then(setMarkets)
          .catch((error) => setMessage(error.message))
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load your workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [section])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f5ef] text-[#1a503a]">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin" />
          <p className="mt-3 text-sm">Loading your farm workspace…</p>
        </div>
      </div>
    )
  if (!data)
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-2xl border bg-white p-8 text-center">
          <AlertTriangle className="mx-auto text-[#b37f26]" />
          <h1 className="mt-4 text-xl font-semibold">Workspace unavailable</h1>
          <p className="mt-2 text-sm text-[#69796f]">{message}</p>
          <Link
            href="/sign-in"
            className="mt-5 inline-block rounded-xl bg-[#0d3b2b] px-5 py-3 font-semibold text-white"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    )

  const title = sections.find(([key]) => key === section)?.[1] ?? 'Dashboard'
  return (
    <div className="min-h-screen bg-[#f3f5ef] text-[#183a2e]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0b3326] p-5 text-white transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <Brand inverse />
          <button className="lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>
        <nav className="mt-9 space-y-1" aria-label="Application">
          {sections.map(([key, label, Icon]) => (
            <Link
              key={key}
              href={`/app/${key}`}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm ${key === section ? 'bg-white text-[#10392b] shadow-sm' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {key === section && <ChevronRight className="ml-auto" size={16} />}
            </Link>
          ))}
          {data.user.role === 'admin' && (
            <Link
              href="/app/admin"
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm ${section === 'admin' ? 'bg-white text-[#10392b]' : 'text-[#d8b768]'}`}
            >
              <UserRound size={18} /> Administration
            </Link>
          )}
        </nav>
        <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="truncate text-xs font-medium">{data.user.email}</p>
          <p className="mt-1 text-[11px] capitalize text-white/45">{data.user.role}</p>
          <button
            onClick={signOut}
            className="mt-3 flex items-center gap-2 text-xs text-white/65 hover:text-white"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-[#153c2d]/8 bg-[#f8faf5]/92 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border bg-white p-2 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-xs text-[#718077]">Agro Web workspace</p>
              <h1 className="font-semibold">{title}</h1>
            </div>
          </div>
          <Link
            href="/app/notifications"
            className="relative rounded-xl border border-[#183a2e]/10 bg-white p-2.5"
          >
            <Bell size={18} />
            {data.notifications.some((n) => !n.read) && (
              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#b37f26]" />
            )}
          </Link>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#d9a654]/20 bg-[#fff6e6] p-3 text-sm text-[#7d5819]">
              <AlertTriangle className="mt-0.5 shrink-0" size={17} />
              {message}
              <button className="ml-auto" onClick={() => setMessage('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {section === 'dashboard' && <Dashboard data={data} weather={weather} markets={markets} />}
          {section === 'farm' && <Farm data={data} onSaved={load} setMessage={setMessage} />}
          {section === 'smart-farming' && <Recommendations items={data.recommendations} />}
          {section === 'weather' && <Weather weather={weather} profile={data.profile} />}
          {section === 'markets' && <Markets markets={markets} />}
          {section === 'financial' && (
            <Financial data={data} onSaved={load} setMessage={setMessage} />
          )}
          {section === 'credit' && <Credit assessment={data.assessment} />}
          {section === 'notifications' && <Notifications items={data.notifications} />}
          {section === 'settings' && <SettingsView email={data.user.email} />}
          {section === 'help' && <Help />}
          {section === 'admin' && <Admin role={data.user.role} setMessage={setMessage} />}
        </main>
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-[#173d2e]/8 bg-white p-5 shadow-[0_8px_30px_rgba(17,53,39,.04)] ${className}`}
    >
      {children}
    </section>
  )
}

function Dashboard({ data, weather, markets }: { data: Bootstrap; weather: any; markets: any }) {
  const profile = data.profile
  const completion = profile
    ? Math.round(
      (['fullName', 'state', 'lga', 'farmSize', 'crops', 'soilType', 'irrigation'].filter(
        (k) => profile[k] && (!Array.isArray(profile[k]) || profile[k].length),
      ).length /
        7) *
      100,
    )
    : 0
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Good to see you</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {profile?.fullName || 'Complete your farmer profile'}
          </h2>
          <p className="mt-2 text-sm text-[#6d7b73]">
            {profile?.state
              ? `${profile.lga || 'LGA not set'}, ${profile.state}`
              : 'Location not yet added'}
          </p>
        </div>
        <Link
          href="/app/farm"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0d3b2b] px-4 py-3 text-sm font-semibold text-white"
        >
          Update farm record <ChevronRight size={16} />
        </Link>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <Card className="bg-[#154a36] text-white lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/55">Current weather</p>
              <p className="mt-2 text-4xl font-semibold">
                {weather?.current
                  ? `${Math.round(weather.current.temperature_2m)}°C`
                  : 'Unavailable'}
              </p>
            </div>
            <CloudSun size={42} className="text-[#d9bb70]" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-sm">
            <div>
              <p className="text-white/45">Humidity</p>
              <p className="mt-1 font-semibold">{weather?.current?.relative_humidity_2m ?? '—'}%</p>
            </div>
            <div>
              <p className="text-white/45">Rainfall</p>
              <p className="mt-1 font-semibold">{weather?.current?.precipitation ?? '—'} mm</p>
            </div>
            <div>
              <p className="text-white/45">Updated</p>
              <p className="mt-1 font-semibold">
                {weather?.retrievedAt
                  ? new Date(weather.retrievedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '—'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-white/40">
            {weather?.attribution || 'Add precise coordinates for live weather'}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8b6a27]">
            Profile completeness
          </p>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-4xl font-semibold">{completion}%</span>
            <span className="pb-1 text-sm text-[#718077]">complete</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eee9]">
            <div className="h-full rounded-full bg-[#39805d]" style={{ width: `${completion}%` }} />
          </div>
          <Link
            href="/app/farm"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#246346]"
          >
            Review missing fields <ChevronRight size={15} />
          </Link>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Active recommendations</h3>
            <Link href="/app/smart-farming" className="text-xs font-semibold text-[#2a6c4d]">
              View all
            </Link>
          </div>
          {data.recommendations.length ? (
            <div className="mt-4 space-y-3">
              {data.recommendations.slice(0, 3).map((r) => (
                <div key={r.id} className="flex gap-3 rounded-xl bg-[#f5f7f2] p-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#e2ecdf] text-[#286448]">
                    <Sprout size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.action}</p>
                    <p className="mt-1 text-xs leading-5 text-[#718077]">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Complete your farm profile to receive transparent recommendations." />
          )}
        </Card>
        <Card>
          <h3 className="font-semibold">Latest market coverage</h3>
          {markets?.items?.length ? (
            <div className="mt-4 space-y-3">
              {markets.items.slice(0, 4).map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between border-b border-[#173d2e]/8 pb-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.commodity}</p>
                    <p className="text-xs text-[#718077]">
                      {item.market} · {date(item.observationDate)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {money.format(item.price)}
                    <span className="block text-right text-[10px] font-normal text-[#718077]">
                      /{item.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty text={markets?.message || 'Checking verified market coverage…'} />
          )}
        </Card>
      </div>
    </div>
  )
}

function Farm({
  data,
  onSaved,
  setMessage,
}: {
  data: Bootstrap
  onSaved: () => void
  setMessage: (s: string) => void
}) {
  const [tab, setTab] = useState<'profile' | 'activity'>('profile')
  const [busy, setBusy] = useState(false)
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    const form = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          farmSize: Number(form.farmSize),
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          crops: String(form.crops || '')
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          financialConsent: form.financialConsent === 'on',
        }),
      })
      setMessage('Farm profile saved successfully.')
      await onSaved()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save')
    } finally {
      setBusy(false)
    }
  }
  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      await apiRequest('/activities', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      })
        ; (event.target as HTMLFormElement).reset()
      setMessage('Activity added to your timeline.')
      await onSaved()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save')
    } finally {
      setBusy(false)
    }
  }
  const p = data.profile ?? {}
  return (
    <div>
      <div className="flex gap-2">
        {(['profile', 'activity'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-[#0d3b2b] text-white' : 'border bg-white'}`}
          >
            {key === 'profile' ? 'Farm profile' : 'Activity timeline'}
          </button>
        ))}
      </div>
      {tab === 'profile' ? (
        <Card className="mt-5">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold">Farm profile</h2>
            <p className="mt-1 text-sm text-[#718077]">
              Add what you know. Coordinates are optional but improve weather accuracy.
            </p>
            <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Your name">
                <input className="field" name="fullName" defaultValue={p.fullName} required />
              </Field>
              <Field label="Farm name">
                <input className="field" name="farmName" defaultValue={p.farmName} />
              </Field>
              <Field label="State">
                <input
                  className="field"
                  name="state"
                  defaultValue={p.state}
                  required
                  placeholder="e.g. Kaduna"
                />
              </Field>
              <Field label="Local government area">
                <input className="field" name="lga" defaultValue={p.lga} required />
              </Field>
              <Field label="Farm size">
                <input
                  className="field"
                  name="farmSize"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={p.farmSize}
                />
              </Field>
              <Field label="Unit">
                <select
                  className="field"
                  name="farmSizeUnit"
                  defaultValue={p.farmSizeUnit || 'hectares'}
                >
                  <option value="hectares">Hectares</option>
                  <option value="acres">Acres</option>
                </select>
              </Field>
              <Field label="Crops (comma separated)" wide>
                <input
                  className="field"
                  name="crops"
                  defaultValue={(p.crops || []).join(', ')}
                  placeholder="Maize, cassava"
                />
              </Field>
              <Field label="Soil type">
                <select className="field" name="soilType" defaultValue={p.soilType || ''}>
                  <option value="">Not known</option>
                  <option>Clay</option>
                  <option>Loam</option>
                  <option>Sandy</option>
                  <option>Silt</option>
                </select>
              </Field>
              <Field label="Irrigation">
                <select className="field" name="irrigation" defaultValue={p.irrigation || 'none'}>
                  <option value="none">Rain-fed / none</option>
                  <option value="partial">Partial irrigation</option>
                  <option value="available">Irrigation available</option>
                </select>
              </Field>
              <Field label="Latitude">
                <input
                  className="field"
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={p.latitude}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="field"
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={p.longitude}
                />
              </Field>
              <label className="flex gap-3 text-xs leading-5 sm:col-span-2">
                <input
                  name="financialConsent"
                  type="checkbox"
                  defaultChecked={p.financialConsent}
                  className="mt-1 accent-[#1c5c41]"
                />
                <span>
                  I explicitly consent to my supplied financial records being processed to calculate
                  a financial readiness assessment. I understand this is not a loan decision.
                </span>
              </label>
              <button
                disabled={busy}
                className="rounded-xl bg-[#0d3b2b] px-5 py-3 font-semibold text-white sm:col-span-2"
              >
                {busy ? 'Saving…' : 'Save farm profile'}
              </button>
            </form>
          </div>
        </Card>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <Card>
            <h2 className="font-semibold">Record activity</h2>
            <form onSubmit={addActivity} className="mt-5 space-y-4">
              <Field label="Activity">
                <select className="field" name="type" required>
                  <option>Planting</option>
                  <option>Irrigation</option>
                  <option>Fertilizer application</option>
                  <option>Pest observation</option>
                  <option>Harvest</option>
                </select>
              </Field>
              <Field label="Date">
                <input className="field" type="date" name="date" required />
              </Field>
              <Field label="Crop">
                <input className="field" name="crop" />
              </Field>
              <Field label="Notes">
                <textarea className="field min-h-24" name="notes" />
              </Field>
              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3b2b] py-3 font-semibold text-white"
              >
                <Plus size={17} /> Add activity
              </button>
            </form>
          </Card>
          <Card>
            <h2 className="font-semibold">Farm timeline</h2>
            {data.activities.length ? (
              <div className="mt-5 space-y-4">
                {data.activities.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-[#173d2e]/8 pb-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8efe5] text-[#2a694b]">
                      <Tractor size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {item.type} {item.crop && `· ${item.crop}`}
                      </p>
                      <p className="mt-1 text-xs text-[#718077]">{date(item.date)}</p>
                      {item.notes && <p className="mt-2 text-sm text-[#53685d]">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="No activities yet. Add your first field record." />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

function Recommendations({ items }: { items: any[] }) {
  return (
    <div>
      <p className="max-w-2xl text-sm leading-6 text-[#66776f]">
        These actions use transparent agronomic rules. They are not diagnoses or locally validated
        crop predictions.
      </p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {items.length ? (
          items.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#e8efe5] px-3 py-1 text-xs font-semibold text-[#286247]">
                  {r.category}
                </span>
                <span className="text-xs text-[#947028]">{r.evidence}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold">{r.action}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f7267]">{r.reason}</p>
              <div className="mt-5 rounded-xl bg-[#f7f5ec] p-4 text-xs leading-5 text-[#67766e]">
                <p>
                  <strong>Source:</strong> {r.source}
                </p>
                <p className="mt-2">
                  <strong>Important limit:</strong> {r.limitation}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <Empty text="Complete your farm profile to generate recommendations from available context." />
          </Card>
        )}
      </div>
    </div>
  )
}

function Weather({ weather, profile }: { weather: any; profile: any }) {
  if (!profile?.latitude || !profile?.longitude)
    return (
      <Card>
        <Empty
          icon={<CloudSun />}
          text="Add farm coordinates in My Farm for a more location-specific live forecast."
          action="/app/farm"
        />
      </Card>
    )
  if (!weather)
    return (
      <Card>
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="animate-spin" /> Retrieving live forecast from Open-Meteo…
        </div>
      </Card>
    )
  const days = weather.daily?.time ?? []
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="bg-[#154a36] text-white">
          <p className="text-xs uppercase tracking-wider text-white/50">Current conditions</p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-5xl font-semibold">{Math.round(weather.current.temperature_2m)}°</p>
            <CloudSun className="text-[#d8b769]" size={50} />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/45">Feels like</p>
              <p>{weather.current.apparent_temperature}°C</p>
            </div>
            <div>
              <p className="text-white/45">Humidity</p>
              <p>{weather.current.relative_humidity_2m}%</p>
            </div>
            <div>
              <p className="text-white/45">Precipitation</p>
              <p>{weather.current.precipitation} mm</p>
            </div>
            <div>
              <p className="text-white/45">Wind</p>
              <p>{weather.current.wind_speed_10m} km/h</p>
            </div>
          </div>
          <p className="mt-7 text-[11px] text-white/40">
            {weather.attribution} · updated {new Date(weather.retrievedAt).toLocaleString()}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">7-day outlook</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {days.map((d: string, i: number) => (
              <div key={d} className="rounded-xl bg-[#f4f6f1] p-3 text-center">
                <p className="text-xs text-[#718077]">
                  {new Date(`${d}T12:00:00`).toLocaleDateString('en-NG', { weekday: 'short' })}
                </p>
                <CloudSun className="mx-auto my-3 text-[#b17e25]" size={22} />
                <p className="text-sm font-semibold">
                  {Math.round(weather.daily.temperature_2m_max[i])}° /{' '}
                  {Math.round(weather.daily.temperature_2m_min[i])}°
                </p>
                <p className="mt-1 text-[10px] text-[#718077]">
                  {weather.daily.precipitation_sum[i]} mm rain
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-5">
        <h2 className="mb-4 text-lg font-semibold">Agricultural risk alerts</h2>
        {weather.alerts.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {weather.alerts.map((a: any) => (
              <Card key={a.trigger}>
                <div className="flex gap-3">
                  <AlertTriangle
                    className={a.severity === 'high' ? 'text-red-600' : 'text-[#b27d24]'}
                  />
                  <div>
                    <p className="font-semibold">{a.trigger}</p>
                    <p className="mt-2 text-sm leading-6 text-[#607167]">{a.precaution}</p>
                    <p className="mt-3 text-xs text-[#89928d]">
                      {a.kind} · {a.source}. {a.limitation}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="flex items-center gap-3 text-sm text-[#51675b]">
              <CheckCircle2 className="text-[#2d7754]" /> No configured heavy-rain, high-heat or
              strong-wind thresholds are triggered in this forecast.
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Markets({ markets }: { markets: any }) {
  const [query, setQuery] = useState('')
  const items = (markets?.items ?? []).filter((item: any) =>
    `${item.commodity} ${item.market} ${item.state}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="max-w-2xl text-sm leading-6 text-[#66776f]">
            Prices appear only after an authorised administrator imports a verified source with
            observation dates and units.
          </p>
        </div>
        <input
          className="field max-w-sm"
          placeholder="Search commodity or market"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {items.length ? (
        <Card className="mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#edf2ea] text-xs uppercase tracking-wide text-[#617168]">
              <tr>
                {['Commodity', 'Market', 'Price', 'Unit', 'Observed', 'Source'].map((h) => (
                  <th className="px-5 py-4" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t border-[#173d2e]/8">
                  <td className="px-5 py-4 font-semibold">{item.commodity}</td>
                  <td className="px-5 py-4">
                    {item.market}
                    <span className="block text-xs text-[#7b8981]">{item.state}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{money.format(item.price)}</td>
                  <td className="px-5 py-4">per {item.unit}</td>
                  <td className="px-5 py-4">{date(item.observationDate)}</td>
                  <td className="px-5 py-4 text-xs">
                    {item.source}
                    <span className="block text-[#2b7451]">{item.verificationStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="mt-5">
          <Empty
            icon={<Landmark />}
            text={markets?.message || 'No matching verified observations.'}
          />
        </Card>
      )}
      <div className="mt-4 rounded-xl bg-[#fff5e4] p-4 text-xs leading-5 text-[#76551d]">
        <strong>Forecasting unavailable:</strong> A sufficiently large, consistent historical series
        and baseline evaluation have not been established.
      </div>
    </div>
  )
}

function Financial({
  data,
  onSaved,
  setMessage,
}: {
  data: Bootstrap
  onSaved: () => void
  setMessage: (s: string) => void
}) {
  const [busy, setBusy] = useState(false)
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      await apiRequest('/financial', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      })
        ; (event.target as HTMLFormElement).reset()
      setMessage('Financial record added.')
      await onSaved()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save')
    } finally {
      setBusy(false)
    }
  }
  const chart = useMemo(
    () =>
      [...data.financial].reverse().map((r) => ({
        date: new Date(r.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        amount: r.type === 'sale' ? r.amount : -r.amount,
      })),
    [data.financial],
  )
  const i = data.assessment.indicators
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Recorded revenue" value={money.format(i.totalRecordedRevenue)} />
        <Metric label="Recorded expenses" value={money.format(i.totalRecordedExpenses)} />
        <Metric label="Operating surplus" value={money.format(i.operatingSurplus)} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.65fr_1.35fr]">
        <Card>
          <h2 className="font-semibold">Add a record</h2>
          <form onSubmit={add} className="mt-5 space-y-4">
            <Field label="Record type">
              <select className="field" name="type">
                <option value="sale">Sale / revenue</option>
                <option value="expense">Expense</option>
              </select>
            </Field>
            <Field label="Amount (NGN)">
              <input
                className="field"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </Field>
            <Field label="Date">
              <input className="field" name="date" type="date" required />
            </Field>
            <Field label="Category">
              <input className="field" name="category" placeholder="e.g. maize sale, transport" />
            </Field>
            <Field label="Evidence status">
              <select className="field" name="evidenceStatus">
                <option value="farmer-reported">Farmer reported</option>
                <option value="document-supported">Document supported (not verified)</option>
              </select>
            </Field>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-[#0d3b2b] py-3 font-semibold text-white"
            >
              {busy ? 'Saving…' : 'Add financial record'}
            </button>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Cash record history</h2>
              <p className="mt-1 text-xs text-[#718077]">
                Positive values are sales; negative values are expenses.
              </p>
            </div>
          </div>
          {chart.length ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="moneyArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2c7653" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2c7653" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e9e4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => money.format(Number(value))} />
                  <Area type="monotone" dataKey="amount" stroke="#2c7653" fill="url(#moneyArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty text="Add sales and expenses to build your financial record." />
          )}
        </Card>
      </div>
    </div>
  )
}

function Credit({ assessment }: { assessment: any }) {
  const i = assessment.indicators
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <Card>
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Financial readiness</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {i.recordCompleteness}% record completeness
            </h2>
          </div>
          <span className="rounded-full bg-[#fff0d5] px-3 py-1 text-xs font-semibold text-[#8a611d]">
            Not a credit score
          </span>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#e7ece7]">
          <div
            className="h-full rounded-full bg-[#357d59]"
            style={{ width: `${i.recordCompleteness}%` }}
          />
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f4f6f1] p-4">
            <p className="text-xs text-[#718077]">Operating surplus</p>
            <p className="mt-2 text-xl font-semibold">{money.format(i.operatingSurplus)}</p>
          </div>
          <div className="rounded-xl bg-[#f4f6f1] p-4">
            <p className="text-xs text-[#718077]">Document-supported records</p>
            <p className="mt-2 text-xl font-semibold">{i.supportedRecords}</p>
          </div>
        </div>
        <h3 className="mt-7 font-semibold">Main factors</h3>
        <ul className="mt-3 space-y-2">
          {assessment.factors.map((factor: string) => (
            <li key={factor} className="flex gap-2 text-sm text-[#5d7065]">
              <CheckCircle2 size={17} className="shrink-0 text-[#397a58]" />
              {factor}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Model validation status</h2>
        <div className="mt-4 rounded-xl border border-[#ddb663]/25 bg-[#fff7e8] p-4">
          <p className="text-sm font-semibold text-[#7b5718]">Predictive model disabled</p>
          <p className="mt-2 text-xs leading-5 text-[#806a45]">
            {assessment.validationStatus}. No synthetic repayment labels are used.
          </p>
        </div>
        <h3 className="mt-6 text-sm font-semibold">Important limitations</h3>
        <p className="mt-2 text-sm leading-6 text-[#65776d]">{assessment.limitations}</p>
        <h3 className="mt-6 text-sm font-semibold">Improve record quality</h3>
        <p className="mt-2 text-sm leading-6 text-[#65776d]">
          Record sales and expenses consistently across seasons, correct errors promptly, and attach
          lawful supporting evidence where useful. A human lender makes any financing decision.
        </p>
      </Card>
    </div>
  )
}

function Notifications({ items }: { items: any[] }) {
  return (
    <Card>
      <h2 className="font-semibold">Your notifications</h2>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl bg-[#f4f6f1] p-4">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="mt-1 text-xs text-[#718077]">{n.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Bell />}
          text="You have no notifications. Weather alerts appear when configured thresholds are triggered."
        />
      )}
    </Card>
  )
}
function SettingsView({ email }: { email: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Account</h2>
        <p className="mt-4 text-xs text-[#718077]">Verified email</p>
        <p className="mt-1 text-sm font-semibold">{email}</p>
        <p className="mt-5 text-xs leading-5 text-[#718077]">
          Password recovery and email delivery depend on your Supabase Auth email configuration.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Privacy controls</h2>
        <div className="mt-4 space-y-3 text-sm">
          <button className="block font-semibold text-[#28694b]">Request data export</button>
          <button className="block font-semibold text-[#28694b]">Request record correction</button>
          <button className="block font-semibold text-red-700">Request account deletion</button>
        </div>
        <p className="mt-5 text-xs leading-5 text-[#718077]">
          Production operations must connect these requests to a reviewed retention and deletion
          workflow.
        </p>
      </Card>
    </div>
  )
}
function Help() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <BookOpen className="text-[#2c7452]" />
        <h2 className="mt-5 text-lg font-semibold">Using your farm record</h2>
        <p className="mt-2 text-sm leading-6 text-[#64766c]">
          Begin with location, size and crops. Add field activities as they happen and review
          missing context before acting on recommendations.
        </p>
      </Card>
      <Card>
        <HelpCircle className="text-[#b17d24]" />
        <h2 className="mt-5 text-lg font-semibold">Need expert judgment?</h2>
        <p className="mt-2 text-sm leading-6 text-[#64766c]">
          Exact fertilizer rates, pesticide choices and disease diagnoses require sufficient local
          evidence and qualified adviser review.
        </p>
      </Card>
    </div>
  )
}

function Admin({ role, setMessage }: { role: string; setMessage: (s: string) => void }) {
  const [json, setJson] = useState('')
  if (role !== 'admin')
    return (
      <Card>
        <Empty text="Administrator permission is required. Roles are enforced by server-side app metadata." />
      </Card>
    )
  async function submit() {
    try {
      const rows = JSON.parse(json)
      const result = await apiRequest<any>('/markets/import', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      })
      setMessage(`Import complete: ${result.accepted} accepted, ${result.rejected} rejected.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed')
    }
  }
  return (
    <Card>
      <h2 className="text-xl font-semibold">Verified market data import</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66776f]">
        Paste a JSON array after reviewing the source terms. Required fields: commodity, market,
        positive price, unit, observationDate and source.
      </p>
      <textarea
        className="field mt-5 min-h-64 font-mono text-xs"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={
          '[{"commodity":"Maize","market":"...","price":0,"unit":"kg","observationDate":"YYYY-MM-DD","source":"..."}]'
        }
      />
      <button
        onClick={submit}
        className="mt-4 rounded-xl bg-[#0d3b2b] px-5 py-3 font-semibold text-white"
      >
        Validate and import
      </button>
    </Card>
  )
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <label className={`block text-sm font-medium ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  )
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-[#718077]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  )
}
function Empty({ text, icon, action }: { text: string; icon?: ReactNode; action?: string }) {
  return (
    <div className="py-8 text-center">
      {icon && (
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#e9efe7] text-[#347453]">
          {icon}
        </div>
      )}
      <p className="mx-auto max-w-md text-sm leading-6 text-[#718077]">{text}</p>
      {action && (
        <Link
          href={action}
          className="mt-4 inline-flex rounded-xl bg-[#0d3b2b] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Update profile
        </Link>
      )}
    </div>
  )
}
