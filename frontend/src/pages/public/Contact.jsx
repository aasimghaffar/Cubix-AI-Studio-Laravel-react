import { useState } from 'react'
import { Mail, Send, Phone, MapPin, MessageCircle, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import Alert from '../../components/Alert'

export default function Contact() {
  const { t } = useLang()
  const { branding } = useAuth()
  const business = branding.business ?? {}
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState(null) // null | 'busy' | 'sent' | error string

  const submit = async () => {
    setStatus('busy')
    try {
      await api('/contact', { method: 'POST', body: form })
      setStatus('sent')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (e) {
      setStatus(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    }
  }

  const infoCards = [
    business.email && { icon: Mail, label: t('contact.email_us', 'Email us'), value: business.email, href: `mailto:${business.email}` },
    business.phone && { icon: Phone, label: t('contact.call_us', 'Call us'), value: business.phone, href: `tel:${business.phone.replace(/\s/g, '')}` },
    business.address && { icon: MapPin, label: t('contact.visit_us', 'Visit us'), value: business.address },
  ].filter(Boolean)

  return (
    <div className="relative overflow-hidden">
      {/* Warm team photo pinned to the viewport — covers the whole page at natural zoom */}
      <div className="fixed inset-0 pointer-events-none">
        <img src="/art/contact-team.jpg" alt="" aria-hidden className="w-full h-full object-cover opacity-35 select-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/70 to-ink-950/80" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
          {/* ── Left: talk to us ── */}
          <div className="animate-fade-up lg:sticky lg:top-24">
            <span className="inline-flex p-3 rounded-2xl bg-brand/15 text-brand mb-5 animate-pulse-glow"><MessageCircle size={24} /></span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
              {t('contact.title', "Let's talk")}<span className="animate-gradient-text">.</span>
            </h1>
            <p className="text-slate-300 mt-4 mb-8 leading-relaxed">
              {t('contact.subtitle2', 'Our team is here to help — questions, feedback, custom plans, or partnership ideas. We read and answer every message.')}
            </p>

            {/* Business info (Admin → Settings → Business info) */}
            <div className="space-y-3">
              {infoCards.map(({ icon: Icon, label, value, href }, i) => (
                <div key={label} className="card glass glow-hover p-4 flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="p-2.5 rounded-xl bg-brand/15 text-brand shrink-0"><Icon size={17} /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
                    {href
                      ? <a href={href} className="text-sm text-white hover:text-brand transition break-words">{value}</a>
                      : <p className="text-sm text-white break-words">{value}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-4 mt-6 flex items-start gap-3">
              <Clock size={15} className="text-brand shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{t('contact.reply_time', 'We typically reply within one business day — usually much faster.')}</p>
            </div>
          </div>

          {/* ── Right: the form ── */}
          <div className="card gradient-ring p-8 space-y-4 animate-slide-up" style={{ animationDelay: '120ms' }}>
            <h2 className="font-display font-semibold text-white text-lg">{t('contact.form_title', 'Send us a message')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="input" placeholder={t('contact.name', 'Your name')} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" type="email" placeholder={t('contact.email', 'Email address')} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <input className="input" placeholder={t('contact.subject', 'Subject')} value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="input min-h-40" placeholder={t('contact.message', 'Your message…')} value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} />

            {status === 'sent' && <Alert type="success">{t('contact.sent', 'Thanks! Your message has been sent.')}</Alert>}
            {status && status !== 'busy' && status !== 'sent' && <Alert type="error" onClose={() => setStatus(null)}>{status}</Alert>}

            <button className="btn-brand w-full" onClick={submit} disabled={status === 'busy'}>
              <Send size={15} /> {status === 'busy' ? '…' : t('contact.send', 'Send message')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}