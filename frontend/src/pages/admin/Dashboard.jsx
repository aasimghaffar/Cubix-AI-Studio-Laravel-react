import { useEffect, useState } from 'react'
import { DollarSign, Users, UserCheck, Activity, DatabaseZap, TriangleAlert, X } from 'lucide-react'
import { setToken } from '../../lib/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { api } from '../../lib/api'
import Portal from '../../components/Portal'

const PALETTE = ['#0ea5a4', '#8b5cf6', '#f59e0b', '#ec4899', '#38bdf8', '#84cc16', '#f43f5e', '#a78bfa', '#2dd4bf']

const tooltipStyle = { background: '#0d1524', border: '1px solid #22304a', borderRadius: 12, color: '#e2e8f0' }

function DemoInstallModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setBusy(true); setError('')
    try {
      const res = await api('/admin/demo/install', { method: 'POST', body: { password } })
      alert(res.message)
      setToken(null)
      window.location.href = '/login'
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
      setBusy(false)
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/70 backdrop-blur-md" onClick={onClose}>
      <div className="relative card p-7 w-full max-w-md animate-pop-in border-amber-400/40" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
          <X size={18} />
        </button>
        <div className="flex items-start gap-3 mb-4">
          <span className="p-2.5 rounded-xl bg-amber-400/15 text-amber-400 shrink-0"><TriangleAlert size={20} /></span>
          <div>
            <h2 className="font-display font-semibold text-white">Apply demo data?</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              This <strong className="text-amber-300">permanently deletes all current data</strong> — customers,
              subscriptions, results, pages, settings — and reinstalls the professional demo content.
              You will be signed out and can sign back in with <strong className="text-white">admin@example.com / password</strong>.
            </p>
          </div>
        </div>
        <label className="text-xs text-slate-500 block mb-1.5">Type your account password to confirm</label>
        <input className="input" type="password" placeholder="Your admin password" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && password && run()} />
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={run} disabled={busy || !password}
            className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold bg-amber-400/90 text-ink-950 hover:bg-amber-400 disabled:opacity-50 transition">
            {busy ? 'Installing… (can take a minute)' : 'Yes, apply demo data'}
          </button>
          <button onClick={onClose} className="btn-ghost flex-1" disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

const prettyTool = (slug) =>
  slug.replace('ai-', '').split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => { api('/admin/dashboard').then(setStats) }, [])
  if (!stats) return <p className="text-slate-400">Loading…</p>

  const kpis = [
    { label: 'Monthly recurring revenue', value: `$${stats.total_revenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Active subscribers', value: stats.active_subscribers, icon: UserCheck },
    { label: 'Total customers', value: stats.total_customers, icon: Users },
    { label: 'Tool runs (30 days)', value: stats.tool_usage.reduce((s, t) => s + Number(t.runs), 0).toLocaleString(), icon: Activity },
  ]

  const toolData = stats.tool_usage.map((t, i) => ({
    name: prettyTool(t.tool_slug),
    runs: Number(t.runs),
    fill: PALETTE[i % PALETTE.length],
  }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Admin dashboard</h1>
        <button onClick={() => setDemoOpen(true)}
          className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border border-ink-700 text-slate-300 hover:border-brand/60 hover:text-white transition">
          <DatabaseZap size={14} /> Apply demo data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-glow p-5">
            <span className="icon-tile !p-2 mb-3"><Icon size={18} /></span>
            <p className="font-display text-xl sm:text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Daily tool activity — gradient area */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1">Activity — last 14 days</h2>
          <p className="text-xs text-slate-500 mb-4">Tool runs per day across all customers</p>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={stats.daily_activity}>
                <defs>
                  <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} width={30} />
                <Tooltip contentStyle={tooltipStyle}
                  labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                <Area type="monotone" dataKey="runs" stroke="rgb(var(--brand))" strokeWidth={2.5}
                  fill="url(#gradActivity)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most-used tools — donut */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1">Most used tools</h2>
          <p className="text-xs text-slate-500 mb-4">Runs in the last 30 days</p>
          {toolData.length === 0 ? (
            <p className="text-sm text-slate-500 py-16 text-center">No usage yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={toolData} dataKey="runs" nameKey="name"
                    innerRadius="55%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
                    {toolData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* New customers */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1">New customers</h2>
          <p className="text-xs text-slate-500 mb-4">Sign-ups per month (6 months)</p>
          <div className="h-52">
            <ResponsiveContainer>
              <AreaChart data={stats.monthly_growth}>
                <defs>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#gradSignups)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by month */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-1">New subscription revenue</h2>
          <p className="text-xs text-slate-500 mb-4">By month subscriptions started</p>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={stats.revenue_by_month}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="total" fill="rgb(var(--brand))" radius={[8, 8, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {demoOpen && <DemoInstallModal onClose={() => setDemoOpen(false)} />}
    </div>
  )
}
