import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowRight, Sparkles, PartyPopper, Check } from 'lucide-react'
import { api } from '../../lib/api'
import { useToolGate } from '../../components/useToolGate'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'

const TOOL_TAGS = {
  'ai-image-generator': ['badge.popular', 'Most popular'],
  'ai-content-writer': ['badge.new', 'New'],
  'ai-translator': ['badge.new', 'New'],
}

export default function Tools() {
  const { t } = useLang()
  const { refresh } = useAuth()
  const [tools, setTools] = useState([])
  const { openTool, modal } = useToolGate()
  const [params, setParams] = useSearchParams()
  const [celebrate, setCelebrate] = useState(null)

  // Arriving back from a successful checkout → refresh the account & celebrate
  useEffect(() => {
    if (params.get('checkout') === 'success') {
      setCelebrate(params.get('plan') || '')
      refresh().catch(() => {})
      setParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Only live tools on the public site — no "coming soon" placeholders.
    api('/tools/public').then((t) => setTools(t.filter((x) => x.status === 'active'))).catch(() => {})
  }, [])

  const [activeCat, setActiveCat] = useState('all')
  const cats = [...new Map(tools.filter((x) => x.taxonomy).map((x) => [x.taxonomy.slug, x.taxonomy])).values()]
  const filtered = activeCat === 'all' ? tools : tools.filter((x) => x.taxonomy?.slug === activeCat)

  return (
    <div className="relative overflow-hidden">
      {/* Full-width backdrop covering the whole page background */}
      <div className="absolute inset-0 bg-noise">
        <img src="/art/tools-hero.png" alt="" aria-hidden
          className="w-full h-full object-cover opacity-[0.22] select-none pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/80 to-ink-950" />
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-16">
      <div className="relative text-center mb-14 animate-fade-up">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand border border-brand/30 rounded-full px-4 py-1.5 mb-5">
          <Sparkles size={13} /> {tools.length ? `${tools.length} ${t('tools.count_suffix', 'tools · one subscription')}` : t('tools.count_fallback', 'One subscription · every tool')}
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-white">
          <span className="text-gradient">{t('tools.title', 'Pick a tool, start creating')}</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">
          {t('tools.subtitle2', 'Every subscription unlocks the complete toolkit — one set of credits that works across images, writing, translation, documents, audio and more. Select any tool below to open its workspace and start creating in seconds.')}
        </p>
      </div>

      {cats.length > 0 && (
        <div className="relative flex flex-wrap justify-center gap-2 mb-10 animate-fade-up">
          {[{ slug: 'all', name: t('tools.all_cats', 'All tools') }, ...cats].map((c) => (
            <button key={c.slug} onClick={() => setActiveCat(c.slug)}
              className={`px-5 py-2 rounded-full text-sm transition ${
                activeCat === c.slug
                  ? 'bg-brand text-ink-950 font-semibold shadow-lg shadow-brand/25'
                  : 'text-slate-300 border border-ink-700 hover:border-brand/50'
              }`}>
              {c.slug === 'all' ? c.name : t(`taxonomy.${c.slug}`, c.name)}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tool, i) => {
          const Icon = Icons[tool.icon] || Icons.Wand2
          return (
            <button
              key={tool.slug}
              onClick={() => openTool(tool)}
              className="card-glow glow-hover border-anim card-laminate p-6 text-center group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex justify-center gap-1.5 mb-4 min-h-[26px]">
                <span className="flex gap-1.5">
                  {tool.free_enabled && (
                    <span className="text-[10px] uppercase tracking-widest text-ink-950 font-bold bg-brand rounded-full px-2.5 py-1">
                      {t('free.badge', 'Free')}
                    </span>
                  )}
                  {TOOL_TAGS[tool.slug] && (
                    <span className="text-[10px] uppercase tracking-widest text-brand border border-brand/30 rounded-full px-2.5 py-1">
                      {t(TOOL_TAGS[tool.slug][0], TOOL_TAGS[tool.slug][1])}
                    </span>
                  )}
                </span>
              </div>
              <span className="icon-tile mb-4 transition duration-300 group-hover:scale-110 group-hover:-translate-y-1"><Icon size={22} /></span>
              <h2 className="font-display font-semibold text-white text-lg">{t(`tool.${tool.slug}.name`, tool.name)}</h2>
              {tool.taxonomy && (
                <span className="text-[10px] uppercase tracking-widest text-slate-500">{t(`taxonomy.${tool.taxonomy.slug}`, tool.taxonomy.name)}</span>
              )}
              <p className="text-sm text-slate-400 mt-1.5 mb-5">{t(`tool.${tool.slug}.desc`, tool.description)}</p>
              <span className="inline-flex items-center gap-1.5 text-sm text-brand font-medium">
                {t('toolkit.open', 'Open tool')} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
              </span>
            </button>
          )
        })}
      </div>

      {modal}
      {celebrate !== null && <SubscribedModal plan={celebrate} onClose={() => setCelebrate(null)} />}
      </div>
    </div>
  )
}


/** Fancy "you're in!" celebration after checkout. */
function SubscribedModal({ plan, onClose }) {
  const { t } = useLang()
  return (
    <Portal>
      <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/70 backdrop-blur-md" onClick={onClose}>
        <div className="relative card gradient-ring p-8 w-full max-w-md text-center animate-pop-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          {/* glow field */}
          <div className="aurora aurora-a w-[260px] h-[260px] -top-24 -left-20 animate-float-slow" />
          <div className="aurora aurora-b w-[220px] h-[220px] -bottom-20 -right-16 animate-float" />

          <div className="relative">
            <span className="relative inline-grid place-items-center w-20 h-20 rounded-full mb-5"
              style={{ background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))' }}>
              <span className="absolute inset-0 rounded-full animate-ping opacity-25"
                style={{ background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))' }} />
              <Check size={38} strokeWidth={3} className="text-ink-950 relative" />
            </span>

            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-brand font-bold mb-2">
              <PartyPopper size={13} /> {t('sub.badge', 'Payment successful')}
            </p>
            <h2 className="font-display text-2xl font-bold text-white">
              {t('sub.title', "You're all set!")}
            </h2>
            <p className="text-slate-300 mt-2.5 leading-relaxed">
              {plan
                ? <>{t('sub.text_plan', 'Your subscription to')} <strong className="animate-gradient-text">{decodeURIComponent(plan)}</strong> {t('sub.text_plan2', 'is active. Your credits are loaded — every tool below is unlocked.')}</>
                : t('sub.text', 'Your subscription is active. Your credits are loaded — every tool below is unlocked.')}
            </p>

            <button onClick={onClose} className="btn-brand w-full mt-7 animate-pulse-glow">
              <Sparkles size={15} /> {t('sub.cta', 'Start creating')}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
