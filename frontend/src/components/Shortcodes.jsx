import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fmtPrice } from '../lib/format'

/** [pricing] — compact pricing grid with cycle tabs + discounts. */
export function PricingBlock() {
  const { branding } = useAuth()
  const [packages, setPackages] = useState([])
  const [cycle, setCycle] = useState('monthly')
  useEffect(() => { api('/packages').then(setPackages).catch(() => {}) }, [])

  const cycles = new Set(packages.map((p) => p.billing_cycle))
  const hasBoth = cycles.has('monthly') && cycles.has('yearly')
  const visible = hasBoth ? packages.filter((p) => p.billing_cycle === cycle) : packages
  if (packages.length === 0) return null

  return (
    <div className="my-10 not-prose">
      {hasBoth && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl border border-ink-700 overflow-hidden">
            {['monthly', 'yearly'].map((c) => (
              <button key={c} onClick={() => setCycle(c)}
                className={`px-5 py-2 text-sm capitalize ${cycle === c ? 'bg-brand text-ink-950 font-semibold' : 'text-slate-300 hover:bg-ink-800'}`}>{c}</button>
            ))}
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((pkg) => (
          <div key={pkg.id} className="card glow-hover p-6 relative overflow-hidden">
            {pkg.discount_percent > 0 && <span className="ribbon-off">{pkg.discount_percent}% off</span>}
            <p className="font-display font-semibold text-white mb-2">{pkg.name}</p>
            <p className="mb-4">
              {pkg.discount_percent > 0 && (
                <span className="text-sm text-slate-500 line-through mr-2">{fmtPrice(Math.round(pkg.price / (1 - pkg.discount_percent / 100)), branding)}</span>
              )}
              <span className="font-display text-3xl font-bold text-white">{fmtPrice(pkg.price, branding)}</span>
              <span className="text-slate-400 text-sm"> / {pkg.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
            </p>
            <Link to="/pricing" className="btn-brand w-full !py-2 text-sm">Choose plan</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

/** [tools] — clickable tool cards. */
export function ToolsBlock() {
  const { t } = useLang()
  const [tools, setTools] = useState([])
  useEffect(() => { api('/tools').then((d) => setTools(d.tools)).catch(() => {}) }, [])
  if (tools.length === 0) return null

  return (
    <div className="my-10 not-prose grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => {
        const Icon = Icons[tool.icon] || Icons.Wand2
        return (
          <Link key={tool.slug} to={`/tools/${tool.slug}`} className="card glow-hover p-5 block">
            <span className="icon-tile !p-2.5 mb-3"><Icon size={18} /></span>
            <p className="font-display font-semibold text-white text-sm">{t(`tool.${tool.slug}.name`, tool.name)}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t(`tool.${tool.slug}.desc`, tool.description)}</p>
          </Link>
        )
      })}
    </div>
  )
}

/** [stats] — the numbers strip. */
export function StatsBlock() {
  const { t } = useLang()
  const [count, setCount] = useState(9)
  useEffect(() => { api('/tools').then((d) => setCount(d.tools.length)).catch(() => {}) }, [])

  const stats = [
    { value: `${count}+`, label: t('stats.tools', 'Specialised AI tools included') },
    { value: '12+', label: t('stats.langs', 'Interface languages supported') },
    { value: '1', label: t('stats.sub', 'Simple all-inclusive subscription') },
    { value: '∞', label: t('stats.ideas', 'Ideas you can bring to life') },
  ]
  return (
    <div className="my-10 not-prose grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card gradient-ring p-6 text-center">
          <p className="font-display text-3xl font-bold animate-gradient-text">{s.value}</p>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/** [cta] — sign-up banner. */
export function CtaBlock() {
  const { t } = useLang()
  const { branding } = useAuth()

  // Deep ink panel + white text: guaranteed contrast whatever the admin sets
  // as brand/accent, and identical in dark AND light mode. Colour comes from
  // the glow, the border and the button — never from the text background.
  return (
    <div className="my-10 not-prose relative overflow-hidden p-10 sm:p-12 text-center rounded-3xl"
      style={{
        background: 'radial-gradient(120% 140% at 15% 0%, #16213a 0%, #0b1220 55%, #080e1a 100%)',
        border: '1px solid rgb(var(--brand) / .38)',
        boxShadow: '0 30px 70px -28px rgb(var(--brand) / .45), inset 0 1px 0 rgb(255 255 255 / .07)',
      }}>
      {/* colour glows, kept well away from the text */}
      <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none" aria-hidden
        style={{ background: 'radial-gradient(circle, rgb(var(--brand) / .38), transparent 70%)', filter: 'blur(18px)' }} />
      <div className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full pointer-events-none" aria-hidden
        style={{ background: 'radial-gradient(circle, rgb(var(--accent) / .3), transparent 70%)', filter: 'blur(18px)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-[.07]" aria-hidden
        style={{
          backgroundImage: 'linear-gradient(rgb(255 255 255 / .5) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .5) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
        }} />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] rounded-full px-3.5 py-1 mb-5"
          style={{ color: 'rgb(var(--brand))', border: '1px solid rgb(var(--brand) / .35)', background: 'rgb(var(--brand) / .1)' }}>
          <Icons.Sparkles size={11} /> {t('cta.badge', 'Get started')}
        </span>

        <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#ffffff' }}>
          {t('cta.title', 'Start creating with')}{' '}
          <span className="animate-gradient-text">{branding.brand_name}</span>
        </h3>

        <p className="text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed" style={{ color: '#cbd5e1' }}>
          {t('cta.subtitle', 'Set up your account in under a minute.')}
        </p>

        <Link to="/register"
          className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 magnetic"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))',
            color: '#08111f',
            boxShadow: '0 14px 34px -10px rgb(var(--brand) / .6)',
          }}>
          {t('cta.button', 'Create free account')} →
        </Link>
      </div>
    </div>
  )
}


export const SHORTCODE_MAP = {
  pricing: PricingBlock,
  tools: ToolsBlock,
  stats: StatsBlock,
  cta: CtaBlock,
}
