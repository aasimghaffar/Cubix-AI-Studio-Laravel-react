import { useEffect, useState } from 'react'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fmtPrice } from '../lib/format'

export const FEATURE_LABELS = {
  image_generation_credits: 'AI image generations',
  content_writer_credits: 'Written articles',
  translation_credits: 'Translations',
  document_query_credits: 'Document queries',
  background_removal_credits: 'Background removals',
  audio_character_limit: 'Audio characters',
  chat_credits: 'Chat questions',
  rewriter_credits: 'Text rewrites',
  summarizer_credits: 'Summaries',
}

/** Translated feature label — falls back to the English label above. */
export const featureLabel = (t, key) => t(`feature.${key}`, FEATURE_LABELS[key] ?? key)

/** Same feature order on every card — canonical order first, unknown keys last. */
export const orderedFeatures = (features = {}) => {
  const canon = Object.keys(FEATURE_LABELS)
  return Object.entries(features).sort(
    ([a], [b]) => (canon.indexOf(a) + 1 || 99) - (canon.indexOf(b) + 1 || 99)
  )
}

export const fmtLimit = (value) =>
  Number(value) === -1 ? 'Unlimited' : Number(value).toLocaleString()

/** Hook shared by every pricing surface. */
export function usePackages() {
  const [packages, setPackages] = useState([])
  const [cycle, setCycle] = useState('monthly')
  useEffect(() => { api('/packages').then(setPackages).catch(() => {}) }, [])

  const cycles = new Set(packages.map((p) => p.billing_cycle))
  const hasBoth = cycles.has('monthly') && cycles.has('yearly')
  const visible = hasBoth ? packages.filter((p) => p.billing_cycle === cycle) : packages

  return { packages, visible, cycle, setCycle, hasBoth }
}

export function CycleTabs({ cycle, setCycle, className = '' }) {
  const { t } = useLang()
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative glass rounded-full p-1.5 inline-flex">
        {/* sliding gradient thumb */}
        <span aria-hidden
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-300 ease-out"
          style={{
            // logical property: maps to left in LTR and right in RTL, so the
            // thumb follows the reversed button order in Arabic automatically
            insetInlineStart: cycle === 'monthly' ? '6px' : 'calc(50%)',
            background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))',
          }} />
        {['monthly', 'yearly'].map((c) => (
          <button key={c} onClick={() => setCycle(c)}
            className={`relative z-10 w-32 sm:w-36 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
              cycle === c ? 'text-ink-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}>
            {c === 'monthly' ? t('pricing.month_tab', 'Monthly') : (
              <span className="inline-flex items-center gap-1.5">
                {t('pricing.year_tab', 'Yearly')}
                <span className={`text-[9px] uppercase tracking-wider font-bold rounded-full px-1.5 py-0.5 ${
                  cycle === 'yearly' ? 'bg-ink-950/20 text-ink-950' : 'bg-brand/15 text-brand'
                }`}>
                  {t('pricing.save', 'Save')}
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The full pricing card grid — identical on the Pricing page and the homepage.
 * onChoose(pkg) decides what the button does per page.
 */
export default function PricingGrid({ visible, onChoose, buttonLabel, busyId = null }) {
  const { branding, user } = useAuth()
  const { t } = useLang()

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {visible.map((pkg, i) => {
        const popular = !pkg.is_custom && i === 1 && visible.length >= 3
        const mine = pkg.is_custom
        return (
          <div key={pkg.id}
            className={`card card-laminate glow-hover spotlight tilt relative overflow-hidden flex flex-col h-full animate-slide-up ${popular || mine ? 'border-brand/60 gradient-ring border-anim border-anim-on' : 'border-anim'} p-8 pt-12`}
            style={{ animationDelay: `${i * 90}ms` }}>
            {pkg.discount_percent > 0 && <span className="ribbon-off z-20">{pkg.discount_percent}% off</span>}
            {(popular || mine) && (
              <span className="absolute z-10 top-0 inset-x-0 h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-950"
                style={{ background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))' }}>
                {mine ? <><Sparkles size={12} /> {t('pricing.custom', 'Your custom plan')}</> : <>★ {t('pricing.popular', 'Most popular')}</>}
              </span>
            )}

            <h3 className="font-display font-semibold text-white text-lg">{t(`package.${pkg.id}.name`, pkg.name)}</h3>
            <div className="mt-3 mb-6">
              {pkg.discount_percent > 0 && (
                <span className="block text-sm text-slate-500 line-through mb-0.5">
                  {fmtPrice(Math.round(pkg.price / (1 - pkg.discount_percent / 100)), branding)}
                </span>
              )}
              <span className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-display text-4xl font-bold text-white">{fmtPrice(pkg.price, branding)}</span>
                <span className="text-slate-400 text-sm">
                  / {pkg.billing_cycle === 'yearly' ? t('pricing.year', 'year') : t('pricing.month', 'month')}
                </span>
              </span>
            </div>

            <ul className="space-y-2.5 mb-7 flex-1">
              {orderedFeatures(pkg.features).map(([key, value]) => (
                <li key={key} className="flex items-start gap-2.5 text-sm">
                  <Check size={15} className="text-brand mt-0.5 shrink-0" />
                  <span>
                    <strong className={Number(value) === -1 ? 'animate-gradient-text' : 'text-white'}>{fmtLimit(value)}</strong>{' '}
                    <span className="text-slate-400">{featureLabel(t, key)}</span>
                  </span>
                </li>
              ))}
              {pkg.max_sessions && (
                <li className="flex items-start gap-2.5 text-sm">
                  <Check size={15} className="text-brand mt-0.5 shrink-0" />
                  <span><strong className="text-white">{pkg.max_sessions}</strong> <span className="text-slate-400">{t('pricing.sessions', pkg.max_sessions === 1 ? 'browser login' : 'simultaneous browser logins')}</span></span>
                </li>
              )}
            </ul>

            {user?.active_subscription?.package_id === pkg.id ? (
              <button disabled className="w-full mt-auto rounded-xl py-2.5 text-sm font-semibold border-2 border-brand/60 text-brand bg-brand/10 cursor-default inline-flex items-center justify-center gap-2">
                <Check size={15} /> {t('pricing.current', 'Current plan')}
              </button>
            ) : (
              <button onClick={() => onChoose(pkg)} disabled={busyId !== null} className="btn-brand w-full mt-auto disabled:opacity-70">
                {busyId === pkg.id
                  ? <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> {t('pay.redirecting_btn', 'Redirecting…')}</span>
                  : (buttonLabel ?? t('pricing.choose', 'Choose plan'))}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
