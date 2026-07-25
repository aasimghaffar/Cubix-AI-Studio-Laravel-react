import { useState } from 'react'
import { X, Lock, ChevronRight, Loader2, CreditCard } from 'lucide-react'
import Portal from './Portal'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fmtPrice } from '../lib/format'

/**
 * Starts checkout for a package. Both gateways enabled → professional method
 * picker; single gateway → straight there. Exposes busyId so plan buttons can
 * show a "Redirecting…" spinner.
 */
export function useCheckout(onError) {
  const { branding } = useAuth()
  const [pkg, setPkg] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [picked, setPicked] = useState(null)
  const [noPay, setNoPay] = useState(false)
  const payments = branding.payments ?? { stripe: true, paypal: false }

  const go = async (p, gateway) => {
    setBusyId(p.id)
    setPicked(gateway)
    try {
      const endpoint = gateway === 'paypal' ? '/billing/paypal/checkout' : '/billing/checkout'
      const { checkout_url } = await api(endpoint, { method: 'POST', body: { package_id: p.id } })
      window.location.href = checkout_url
    } catch (e) {
      setBusyId(null)
      setPicked(null)
      setPkg(null)
      onError?.(e.status === 503 ? e.message : (e.message || 'Checkout failed — please try again.'))
    }
  }

  const start = (p) => {
    if (!payments.stripe && !payments.paypal) setNoPay(true)
    else if (payments.stripe && payments.paypal) setPkg(p)
    else if (payments.paypal) go(p, 'paypal')
    else go(p, 'stripe')
  }

  const chooser = (
    <>
      {pkg && (
        <GatewayModal pkg={pkg} picked={picked} busy={busyId !== null}
          onPick={(gw) => go(pkg, gw)}
          onClose={() => busyId === null && setPkg(null)} />
      )}
      {noPay && <NoPaymentsModal onClose={() => setNoPay(false)} />}
    </>
  )

  return { start, chooser, busyId }
}

/** Professional payment-method picker. */
function GatewayModal({ pkg, picked, busy, onPick, onClose }) {
  const { t } = useLang()
  const { branding } = useAuth()

  const METHODS = [
    {
      id: 'stripe',
      logo: '/art/logos/stripe.png',
      name: t('pay.card', 'Credit / debit card'),
      sub: t('pay.card_sub', 'Visa, Mastercard, Amex & more — secure checkout by Stripe'),
    },
    {
      id: 'paypal',
      logo: '/art/logos/paypal.png',
      name: 'PayPal',
      sub: t('pay.paypal_sub', 'Pay with your PayPal balance or a linked card'),
    },
  ]

  return (
    <Portal>
      <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/70 backdrop-blur-md" onClick={onClose}>
        <div className="relative card gradient-ring card-laminate p-7 w-full max-w-md animate-pop-in" onClick={(e) => e.stopPropagation()}>
          {!busy && (
            <button onClick={onClose} aria-label="Close"
              className="absolute z-20 top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
              <X size={18} />
            </button>
          )}

          <h2 className="font-display font-semibold text-white text-lg">{t('pay.title', 'Choose your payment method')}</h2>
          <p className="text-sm text-slate-400 mt-1 mb-5 pb-4 border-b border-ink-700/60">
            {pkg.name} — <strong className="text-white">{fmtPrice(pkg.price, branding)}</strong>
            <span className="text-slate-500"> / {pkg.billing_cycle === 'yearly' ? t('pricing.year', 'year') : t('pricing.month', 'month')}</span>
          </p>

          <div className="space-y-3">
            {METHODS.map((m) => {
              const isPicked = picked === m.id
              return (
                <button key={m.id} onClick={() => onPick(m.id)} disabled={busy}
                  className={`w-full flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition group ${
                    isPicked ? 'border-brand bg-brand/10'
                      : 'border-ink-700 bg-ink-800/40 hover:border-brand/60 hover:bg-ink-800/70'
                  } disabled:opacity-60`}>
                  <span className="w-24 h-14 rounded-xl bg-white grid place-items-center shrink-0 p-2.5 overflow-hidden">
                    <img src={m.logo} alt={m.name} draggable="false"
                      className="max-h-full max-w-full w-auto h-auto object-contain" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-white font-semibold">{m.name}</span>
                    <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">{m.sub}</span>
                  </span>
                  {isPicked && busy
                    ? <Loader2 size={17} className="text-brand animate-spin shrink-0" />
                    : <ChevronRight size={17} className="text-slate-600 group-hover:text-brand group-hover:translate-x-0.5 transition shrink-0" />}
                </button>
              )
            })}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-5">
            <Lock size={11} className="text-brand" />
            {busy ? t('pay.redirecting', 'Taking you to secure checkout…') : t('pay.secure', 'Encrypted checkout · Cancel anytime from your account')}
          </p>
        </div>
      </div>
    </Portal>
  )
}

function NoPaymentsModal({ onClose }) {
  const { t } = useLang()
  return (
    <Portal>
      <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={onClose}>
        <div className="relative card gradient-ring p-8 w-full max-w-sm text-center animate-pop-in" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} aria-label="Close"
            className="absolute z-20 top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
            <X size={18} />
          </button>
          <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-amber-400/15 text-amber-400 mb-4"><CreditCard size={26} /></span>
          <h2 className="font-display font-semibold text-white text-lg">{t('pay.none_title', 'Payments are not set up yet')}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {t('pay.none_text', 'No payment method is integrated on this site yet. Please contact us and we will activate your plan for you directly.')}
          </p>
          <button onClick={onClose} className="btn-brand w-full mt-6">{t('pay.none_ok', 'Got it')}</button>
        </div>
      </div>
    </Portal>
  )
}

/** "We accept" strip — shows the gateways the admin has enabled. */
export function PaymentMethodsStrip({ className = '' }) {
  const { branding } = useAuth()
  const { t } = useLang()
  const payments = branding.payments ?? {}
  const logos = [
    payments.stripe && { src: '/art/logos/stripe.png', alt: 'Stripe' },
    payments.paypal && { src: '/art/logos/paypal.png', alt: 'PayPal' },
  ].filter(Boolean)
  if (!logos.length) return null

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="text-[11px] uppercase tracking-widest text-slate-500">{t('pay.supported', 'Payment methods supported')}</span>
      {logos.map((l) => (
        <span key={l.alt} className="h-9 w-16 rounded-lg bg-white grid place-items-center p-1.5" title={l.alt}>
          <img src={l.src} alt={l.alt} draggable="false"
            className="max-h-full max-w-full w-auto h-auto object-contain" />
        </span>
      ))}
      <Lock size={12} className="text-brand" />
    </div>
  )
}
