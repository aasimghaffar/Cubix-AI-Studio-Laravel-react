import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquarePlus, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import PricingGrid, { usePackages, CycleTabs } from '../../components/PricingGrid'
import PricingCompare from '../../components/PricingCompare'
import Alert from '../../components/Alert'
import { useCheckout, PaymentMethodsStrip } from '../../components/GatewayChooser'
import Portal from '../../components/Portal'

export default function PublicPricing() {
  const { user, branding } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const { visible, cycle, setCycle, hasBoth } = usePackages()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)

  // Coming back from an abandoned/failed checkout
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('checkout')
    if (q === 'canceled') setError('Checkout was canceled — no charge was made. Pick a plan whenever you are ready.')
    if (q === 'failed') setError('We could not confirm that payment. If you were charged, contact us and we will sort it out immediately.')
    if (q) window.history.replaceState({}, '', '/pricing')
  }, [])

  const currentId = user?.active_subscription?.package_id

  const { start: startCheckout, chooser, busyId } = useCheckout((msg) => setError(msg))

  const choose = (pkg) => {
    if (!user) {
      navigate('/register', { state: { from: '/pricing' } })
      return
    }
    setError('')
    startCheckout(pkg)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Team photo pinned to the viewport — natural zoom, covers the page at every scroll position */}
      <div className="fixed inset-0 pointer-events-none">
        <img src="/art/pricing-team.png" alt="" aria-hidden className="w-full h-full object-cover opacity-40 select-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/70 to-ink-950/80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white text-center">{t('pricing.title', 'Pricing')}</h1>
      <p className="text-slate-400 text-center mt-3 mb-14">
        {t('pricing.subtitle', 'Every plan includes every tool. Credits reset each billing cycle. Cancel anytime.')}
      </p>

      {error && <Alert type="error" className="max-w-xl mx-auto mb-6" onClose={() => setError('')}>{error}</Alert>}

      {hasBoth && <CycleTabs cycle={cycle} setCycle={setCycle} className="mb-10" />}

      <PricingGrid visible={visible} onChoose={choose} busyId={busyId} />

      {/* Custom package request */}
      <div className="card glass mt-10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="font-display font-semibold text-white">{t('pricing.custom_title', 'Need something bigger — or different?')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('pricing.custom_sub', 'Tell us what your team needs and we will build a private custom plan just for you — your own credit amounts, browser logins, and price.')}</p>
        </div>
        <button className="btn-ghost shrink-0" onClick={() => user ? setRequesting(true) : navigate('/register', { state: { from: '/pricing' } })}>
          <MessageSquarePlus size={15} /> {t('pricing.custom_btn', 'Request a custom package')}
        </button>
      </div>

      <PricingCompare visible={visible} />

      {requesting && <RequestModal onClose={() => setRequesting(false)} />}
      {chooser}

      <PaymentMethodsStrip className="mt-12" />

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('pricing.questions', 'Questions about plans or custom limits?')}{' '}
        <Link to="/contact" className="text-brand hover:underline">{t('pricing.contact_us', 'Contact us')}</Link>.
      </p>
      </div>
    </div>
  )
}


function RequestModal({ onClose }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true); setError('')
    try {
      const res = await api('/packages/request-custom', { method: 'POST', body: { message } })
      setDone(res.message)
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative card p-7 w-full max-w-md animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
          <X size={18} />
        </button>
        <h2 className="font-display font-semibold text-white mb-2">Request a custom package</h2>
        {done ? (
          <p className="text-sm text-brand">{done}</p>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">
              Describe what you need — which tools you use most, roughly how many credits per month,
              how many people will sign in, and your budget if you have one.
            </p>
            <textarea className="input min-h-36" placeholder="e.g. We're a small agency: ~500 images and 1,000 articles a month, 4 team members sharing one account…"
              value={message} onChange={(e) => setMessage(e.target.value)} />
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            <button className="btn-brand w-full mt-4" onClick={send} disabled={busy || message.trim().length < 20}>
              {busy ? 'Sending…' : 'Send request'}
            </button>
          </>
        )}
      </div>
    </div>
    </Portal>
  )
}
