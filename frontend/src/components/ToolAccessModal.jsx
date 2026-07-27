import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CreditCard, Lock, X, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fmtPrice } from '../lib/format'
import Portal from './Portal'
import { useCheckout, PaymentMethodsStrip } from './GatewayChooser'
import { orderedFeatures, FEATURE_LABELS, fmtLimit, featureLabel } from './PricingGrid'

/**
 * Popup shown when a visitor clicks a tool they can't use yet.
 * gate: 'login' (not signed in) | 'plans' (signed in, no plan)
 * Closes via the X icon, the backdrop, or the Escape key.
 */
export default function ToolAccessModal({ gate, toolPath, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <Portal>
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative card p-8 w-full shadow-2xl border-brand/30 animate-pop-in
                   max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: gate === 'plans' ? '58rem' : '24rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute z-20 top-4 right-4 p-1.5 rounded-lg text-slate-300 bg-ink-950/30 hover:text-white hover:bg-ink-800 transition"
        >
          <X size={18} />
        </button>

        {gate === 'login' ? <LoginPrompt toolPath={toolPath} /> : <PlansPrompt onClose={onClose} />}
      </div>
    </div>
    </Portal>
  )
}

function LoginPrompt({ toolPath }) {
  const { t } = useLang()
  return (
    <div className="text-center">
      <span className="icon-tile mb-4"><Lock size={24} /></span>
      <h2 className="font-display font-semibold text-white text-lg">{t('gate.login.title', 'Sign in to use this tool')}</h2>
      <p className="text-sm text-slate-400 mt-2 mb-6">
        {t('gate.login.text', 'Create a free account or sign in — you will be brought right back here.')}
      </p>
      <div className="space-y-3">
        <Link to="/login" state={{ from: toolPath }} className="btn-brand w-full">{t('nav.signin', 'Sign in')}</Link>
        <Link to="/register" state={{ from: toolPath }} className="btn-ghost w-full">{t('gate.login.register', 'Create account')}</Link>
      </div>
    </div>
  )
}

const SHORT_LABELS = {
  image_generation_credits: 'images',
  content_writer_credits: 'articles',
  translation_credits: 'translations',
  document_query_credits: 'doc queries',
  background_removal_credits: 'bg removals',
  audio_character_limit: 'audio chars',
  chat_credits: 'chat questions',
  rewriter_credits: 'rewrites',
  summarizer_credits: 'summaries',
}

function PlansPrompt({ onClose }) {
  const { branding } = useAuth()
  const { t } = useLang()
  const [packages, setPackages] = useState([])
  const [cycle, setCycle] = useState('monthly')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { api('/packages').then(setPackages).catch(() => {}) }, [])

  const { start: startCheckout, chooser, busyId } = useCheckout((msg) => setError(msg))

  const subscribe = (pkg) => {
    setError('')
    startCheckout(pkg)
  }

  const cycles = new Set(packages.map((p) => p.billing_cycle))
  const hasBoth = cycles.has('monthly') && cycles.has('yearly')
  const visible = hasBoth ? packages.filter((p) => p.billing_cycle === cycle) : packages

  return (
    <div>
      {/* Gradient header */}
      <div className="relative -m-7 mb-6 px-7 pt-8 pb-6 rounded-t-2xl overflow-hidden text-center">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgb(var(--brand) / 0.25), rgb(var(--accent) / 0.2))' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="relative">
          <span className="icon-tile mb-3 animate-pulse-glow"><CreditCard size={22} /></span>
          <h2 className="font-display font-bold text-white text-xl">{t('gate.plans.title', 'Choose a plan to unlock the tools')}</h2>
          <p className="text-sm text-slate-300 mt-1.5 max-w-md mx-auto">{t('gate.plans.text', 'Every plan includes every tool — pick the credit level that fits.')}</p>
        </div>
      </div>

      {hasBoth && (
        <div className="flex justify-center mb-5">
          <div className="relative glass rounded-full p-1 inline-flex">
            <span aria-hidden
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out"
              style={{
                left: cycle === 'monthly' ? '4px' : '50%',
                background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))',
              }} />
            {['monthly', 'yearly'].map((c) => (
              <button key={c} onClick={() => setCycle(c)}
                className={`relative z-10 w-24 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  cycle === c ? 'text-ink-950 font-semibold' : 'text-slate-300'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {visible.map((pkg, i) => {
          const popular = !pkg.is_custom && i === 1 && visible.length >= 3
          const mine = pkg.is_custom
          return (
            <div key={pkg.id}
              className={`card card-laminate spotlight relative overflow-hidden flex flex-col p-6 pt-10 glow-hover animate-slide-up ${
                popular || mine ? 'border-brand/60 gradient-ring' : ''
              }`}
              style={{ animationDelay: `${i * 70}ms` }}>
              {pkg.discount_percent > 0 && <span className="ribbon-off z-20">{pkg.discount_percent}% off</span>}
              {(popular || mine) && (
                <span className="absolute z-10 top-0 inset-x-0 h-7 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-950"
                  style={{ background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))' }}>
                  {mine ? t('pricing.custom', 'Your custom plan') : `★ ${t('pricing.popular', 'Most popular')}`}
                </span>
              )}

              <h3 className="font-display font-semibold text-white">{t(`package.${pkg.id}.name`, pkg.name)}</h3>
              <p className="mt-2 mb-4">
                {pkg.discount_percent > 0 && (
                  <span className="text-xs text-slate-500 line-through block">{fmtPrice(Math.round(pkg.price / (1 - pkg.discount_percent / 100)), branding)}</span>
                )}
                <span className="font-display text-3xl font-bold text-white">{fmtPrice(pkg.price, branding)}</span>
                <span className="text-slate-400 text-sm"> / {pkg.billing_cycle === 'yearly' ? t('pricing.year', 'year') : t('pricing.month', 'month')}</span>
              </p>

              <ul className="space-y-2 mb-5 flex-1">
                {orderedFeatures(pkg.features).map(([key, value]) => (
                  <li key={key} className="flex items-start gap-2 text-[13px]">
                    <Check size={13} className="text-brand mt-0.5 shrink-0" />
                    <span>
                      <strong className={Number(value) === -1 ? 'animate-gradient-text' : 'text-white'}>{fmtLimit(value)}</strong>{' '}
                      <span className="text-slate-400">{featureLabel(t, key)}</span>
                    </span>
                  </li>
                ))}
                {pkg.max_sessions && (
                  <li className="flex items-start gap-2 text-[13px]">
                    <Check size={13} className="text-brand mt-0.5 shrink-0" />
                    <span><strong className="text-white">{pkg.max_sessions}</strong> <span className="text-slate-400">{t('pricing.sessions', pkg.max_sessions === 1 ? 'browser login' : 'simultaneous browser logins')}</span></span>
                  </li>
                )}
              </ul>

              <button onClick={() => subscribe(pkg)} disabled={busyId !== null}
                className="btn-brand w-full mt-auto disabled:opacity-70">
                {busyId === pkg.id
                  ? <span className="inline-flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('pay.redirecting_btn', 'Redirecting…')}</span>
                  : t('pricing.choose', 'Choose plan')}
              </button>
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}
      <p className="text-center text-xs text-slate-500 mt-4">
        {t('gate.plans.note', 'Cancel anytime. Credits refresh every billing cycle.')}
      </p>
      <PaymentMethodsStrip className="mt-3" />

      <p className="text-center text-xs mt-4">
        <Link to="/pricing" onClick={onClose} className="text-brand hover:underline">
          {t('gate.plans.compare', 'Compare all plans in detail →')}
        </Link>
      </p>
      {chooser}
    </div>
  )
}
