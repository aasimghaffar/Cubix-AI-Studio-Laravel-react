import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowRight, Check, Zap, ShieldCheck, Layers, MousePointerClick, WandSparkles, Download, UserPlus2, History } from 'lucide-react'
import { api } from '../../lib/api'
import PricingGrid, { usePackages, CycleTabs } from '../../components/PricingGrid'
import Reveal from '../../components/Reveal'
import { useAuth } from '../../context/AuthContext'
import { useToolGate } from '../../components/useToolGate'
import { useLang } from '../../context/LanguageContext'
import { fmtPrice } from '../../lib/format'
import ShowcaseSlider from '../../components/ShowcaseSlider'
import Testimonials from '../../components/Testimonials'

export default function Home() {
  const { user, branding } = useAuth()
  const { t, languages = [] } = useLang()
  const langCount = Math.max(languages.length, 1)
  const [tools, setTools] = useState([])
  const [packages, setPackages] = useState([])
  const { openTool, modal } = useToolGate()

  useEffect(() => {
    api('/tools/public').then((t) => setTools(t.filter((x) => x.status === 'active'))).catch(() => {})
    api('/packages').then(setPackages).catch(() => {})
  }, [])

  const hasPlan = !!user?.active_subscription
  const navigate = useNavigate()
  const { visible: homeVisible, cycle: homeCycle, setCycle: setHomeCycle, hasBoth: homeHasBoth } = usePackages()

  return (
    <div>
      {/* ── Hero: full-width background straight under the menu ── */}
      <section className="relative overflow-hidden">
        {/* 100% width backdrop */}
        <div className="absolute inset-0 bg-noise">
          <img src="/art/ai-banner.png" alt="" aria-hidden
            className="w-full h-full object-cover opacity-50 select-none pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/35 via-ink-950/65 to-ink-950" />
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>
        <div className="aurora aurora-a w-[420px] h-[420px] -top-32 -left-24" />
        <div className="aurora aurora-b w-[380px] h-[380px] top-10 -right-24" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left hero-reveal">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand border border-brand/30 rounded-full px-4 py-1.5 mb-6 glass">
              <Zap size={13} /> {t('hero.badge', 'All your AI tools, one workspace')}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              {t('hero.title', 'Create images, words & voice with')} <span className="animate-gradient-text flip-in inline-block">{branding.brand_name}</span>
            </h1>
            <TypeLine />
            <p className="text-slate-400 text-base sm:text-lg mt-5 max-w-xl mx-auto lg:mx-0">
              {t('hero.subtitle2', 'A complete creative suite powered by leading AI models: generate striking visuals, write publication-ready content, translate naturally between languages, question your documents, remove image backgrounds in one click, and turn text into lifelike voiceovers — all from a single dashboard, under one simple subscription.')}
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-9">
              {user ? (
                <>
                  <Link to="/tools" className="btn-brand !px-7 !py-3 magnetic">
                    {hasPlan ? t('hero.open_tools', 'Open your tools') : t('hero.explore', 'Explore the tools')} <ArrowRight size={16} />
                  </Link>
                  {!hasPlan && <Link to="/pricing" className="btn-ghost !px-7 !py-3">{t('hero.see_plans', 'See plans')}</Link>}
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-brand !px-7 !py-3 magnetic">{t('hero.start', 'Start creating')} <ArrowRight size={16} /></Link>
                  <Link to="/tools" className="btn-ghost !px-7 !py-3">{t('hero.explore', 'Explore the tools')}</Link>
                </>
              )}
            </div>
          </div>

          <div className="animate-fade-up tilt" style={{ animationDelay: '300ms' }}>
            <div className="glass-window p-3">
              <div className="gw-dots flex items-center gap-1.5 px-2 pb-2.5">
                <span style={{ background: '#ff5f57' }} /><span style={{ background: '#febc2e' }} /><span style={{ background: '#28c840' }} />
                <span className="ml-3 text-[11px] text-slate-500 font-body tracking-wide">{t('hero.window', 'Live output')}</span>
              </div>
              <ShowcaseSlider />
            </div>
          </div>
        </div>
      </section>

      <Reveal>
      {/* ── Stats band ── */}
      <section className="border-y border-ink-700/60 bg-ink-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [Icons.Wand2, `${tools.length || 9}+`, t('stats2.tools', 'Specialised AI tools included'), t('stats2.tools_sub', 'Images, writing, translation, documents, audio & more')],
            [Icons.Globe2, `${langCount}+`, t('stats2.languages', 'Interface languages supported'), t('stats2.languages_sub', 'Serve customers worldwide, right-to-left included')],
            [Icons.BadgeCheck, '1', t('stats2.subscription', 'Simple all-inclusive subscription'), t('stats2.subscription_sub', 'Every tool unlocked — no add-ons, no surprises')],
            [Icons.Infinity, '∞', t('stats2.ideas', 'Ideas you can bring to life'), t('stats2.ideas_sub', 'Fresh credits every cycle to keep you creating')],
          ].map(([Icon, value, label, sub]) => (
            <div key={label} className="card gradient-ring p-5 text-center glow-hover">
              <Icon size={18} className="mx-auto text-brand mb-2" />
              <p className="font-display text-3xl font-bold animate-gradient-text">{value}</p>
              <p className="text-xs text-white font-medium mt-1.5">{label}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed hidden sm:block">{sub}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Tool showcase (clickable, gated) ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/art/toolkit-art.png" alt="" aria-hidden className="w-full h-full object-cover opacity-35 select-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="font-display text-2xl md:text-4xl font-bold text-white text-center mb-3">{t('toolkit.title', 'The toolkit')}</h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">{t('toolkit.subtitle2', 'Nine purpose-built AI workspaces, each tuned for a specific job. Open any of them to start creating — your credits and history follow you across every tool.')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => {
            const Icon = Icons[tool.icon] || Icons.Wand2
            return (
              <button key={tool.slug} onClick={() => openTool(tool)}
                className="card-glow glow-hover border-anim card-laminate p-6 text-center group">
                <span className="icon-tile mb-4"><Icon size={22} /></span>
                <h3 className="font-display font-semibold text-white">{t(`tool.${tool.slug}.name`, tool.name)}</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">{t(`tool.${tool.slug}.desc`, tool.description)}</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-brand">
                  {t('toolkit.try', 'Try it')} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </span>
              </button>
            )
          })}
        </div>
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Powered-by logo marquee ── */}
      <LogoMarquee />

      {/* ── How it works ── */}
      <div className="section-divider max-w-4xl mx-auto" />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/art/workflow-art.png" alt="" aria-hidden
            className="w-full h-full object-cover opacity-45 select-none pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/55 to-ink-950" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="aurora aurora-b w-[360px] h-[360px] -top-20 -right-32" />
        <h2 className="font-display text-2xl md:text-4xl font-bold text-white text-center mb-3">{t('how.title', 'How it works')}</h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-14">
          {t('how.subtitle', 'From idea to finished result in four simple steps — no design skills, no technical setup, no learning curve.')}
        </p>

        <div className="relative grid md:grid-cols-4 gap-5">
          {/* connector line behind the cards */}
          <div className="hidden md:block absolute top-9 left-[12%] right-[12%] h-0.5 step-connector rounded-full opacity-40" />
          {[
            { icon: UserPlus2, n: '01', title: t('how.s1.title', 'Create your account'), text: t('how.s1.text', 'Sign up free in under a minute — with your email or one click through Google. No credit card required to look around.') },
            { icon: MousePointerClick, n: '02', title: t('how.s2.title', 'Pick the right tool'), text: t('how.s2.text', 'Nine specialised workspaces: images, articles, translation, documents, background removal, voiceovers, chat, rewriting and summaries.') },
            { icon: WandSparkles, n: '03', title: t('how.s3.title', 'Describe what you want'), text: t('how.s3.text', 'Type a prompt, upload a file, or paste text. Fine-tune with styles, tones, languages, and voices until it feels right.') },
            { icon: Download, n: '04', title: t('how.s4.title', 'Use it anywhere'), text: t('how.s4.text', 'Download images and audio, export documents to Word or Markdown, or copy the text. Everything you create belongs to you.') },
          ].map(({ icon: Icon, n, title, text }, i) => (
            <div key={n} className="card glow-hover p-6 relative animate-fade-up text-center" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="icon-tile !p-2.5"><Icon size={18} /></span>
                <span className="font-display text-3xl font-bold text-ink-700 select-none">{n}</span>
              </div>
              <h3 className="font-display font-semibold text-white">{title}</h3>
              <p className="text-[13px] text-slate-400 mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* quick facts under the steps */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            [ShieldCheck, t('how.f1', 'Your results are saved automatically — close the tab, come back, everything is still there.')],
            [History, t('how.f2', 'Full history for every tool, grouped by day, with one-click clear when you want a fresh start.')],
            [Zap, t('how.f3', 'Transparent credit meters on every tool — always know exactly how much you have left.')],
          ].map(([Icon, text], i) => (
            <div key={i} className="glass rounded-2xl p-4 flex items-start gap-3">
              <Icon size={16} className="text-brand shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Tools in action: real artwork gallery ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 mt-10">
        <h2 className="font-display text-2xl md:text-4xl font-bold text-white text-center mb-3">{t('gallery.title', 'See the tools in action')}</h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-10">
          {t('gallery.subtitle', 'A glimpse of what each workspace does — from pixel-perfect cutouts to documents that answer back.')}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['/art/bg-removal-demo.png', t('gallery.bg', 'Background removal'), t('gallery.bg_sub', 'Clean cutouts in one click'), '/tools/ai-background-removal'],
            ['/art/chat-assistant-art.png', t('gallery.chat', 'AI chat assistant'), t('gallery.chat_sub', 'Answers, ideas & research 24/7'), '/tools/ai-chat-assistant'],
            ['/art/summarizer-art.png', t('gallery.sum', 'Document intelligence'), t('gallery.sum_sub', 'Key points from any document'), '/tools/ai-summarizer'],
            ['/art/rewriter-art.png', t('gallery.rw', 'Grammar & rewriting'), t('gallery.rw_sub', 'From rough draft to polished'), '/tools/ai-text-rewriter'],
          ].map(([img, title, sub, to], i) => (
            <Link key={to} to={to} className="card glow-hover overflow-hidden group animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="relative h-40 overflow-hidden">
                <img src={img} alt={title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
              </div>
              <div className="p-4">
                <p className="font-display font-semibold text-white text-sm">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Testimonials ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/art/light-abstract.png" alt="" aria-hidden className="w-full h-full object-cover opacity-[0.10] select-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-transparent to-ink-950" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-white text-center mb-10">{t('testimonials.title', 'Loved by creators')}</h2>
          <Testimonials />
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Why us ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Layers, title: t('why.one.title', 'One subscription'), text: t('why.one.text', 'Stop juggling five AI accounts. One plan covers images, words, and audio.') },
            { icon: Zap, title: t('why.speed.title', 'Built for speed'), text: t('why.speed.text', 'Type a prompt, get a result. Credit meters keep your usage transparent.') },
            { icon: ShieldCheck, title: t('why.limits.title', 'Fair limits'), text: t('why.limits.text', 'Credits reset every billing cycle, and you can upgrade or downgrade anytime.') },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <Icon className="text-brand mb-3" size={22} />
              <h3 className="font-display font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal>
      {/* ── Pricing preview (hidden for subscribed users) ── */}
      {!hasPlan && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-white text-center mb-3">{t('home_pricing.title', 'Simple pricing')}</h2>
          <p className="text-slate-400 text-center max-w-xl mx-auto mb-10">
            {t('home_pricing.subtitle', 'Every plan unlocks every tool. Pick the credit level that fits — upgrade, downgrade, or cancel whenever you like.')}
          </p>
          {homeHasBoth && <CycleTabs cycle={homeCycle} setCycle={setHomeCycle} className="mb-10" />}
          <PricingGrid visible={homeVisible} onChoose={() => navigate(user ? '/pricing' : '/register')} buttonLabel={user ? undefined : t('hero.start', 'Get started')} />
        </section>
      )}
      </Reveal>

      <Reveal>
      {/* ── CTA (guests only) ── */}
      {!user && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10 text-center">
          <div className="card p-8 sm:p-12 relative overflow-hidden">
            <img src="/art/toolkit-art.png" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-25 select-none pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/30" />
            <div className="absolute inset-0 opacity-40"
              style={{ background: 'radial-gradient(400px 200px at 50% 0%, rgb(var(--brand) / .25), transparent 70%)' }} />
            <div className="relative">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">{t('cta.title', 'Ready to create?')}</h2>
              <p className="text-slate-400 mt-3 mb-8">{t('cta.subtitle', 'Set up your account in under a minute — browse the studio free, upgrade when you are ready.')}</p>
              <Link to="/register" className="btn-brand !px-8 !py-3">{t('cta.button', 'Create free account')} <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {modal}
      </Reveal>
    </div>
  )
}


/** Rotating typed line under the hero title — prompt becoming results. */
function TypeLine() {
  const { t } = useLang()
  const phrases = [
    t('hero.type1', 'a neon cyberpunk city, ultra detailed…'),
    t('hero.type2', 'a 1,500-word article about smart homes…'),
    t('hero.type3', 'translate my pitch into Japanese…'),
    t('hero.type4', 'summarize this 40-page report…'),
    t('hero.type5', 'a calm voice-over for my video…'),
  ]
  const [i, setI] = useState(0)
  const [txt, setTxt] = useState('')
  const [del, setDel] = useState(false)

  useEffect(() => {
    const full = phrases[i % phrases.length]
    const timeout = setTimeout(() => {
      if (!del) {
        const next = full.slice(0, txt.length + 1)
        setTxt(next)
        if (next === full) setTimeout(() => setDel(true), 1400)
      } else {
        const next = full.slice(0, Math.max(0, txt.length - 2))
        setTxt(next)
        if (!next) { setDel(false); setI((n) => n + 1) }
      }
    }, del ? 24 : 46)
    return () => clearTimeout(timeout)
  }, [txt, del, i]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <p className="mt-4 font-body text-sm sm:text-base text-slate-300">
      <span className="text-brand font-semibold">{t('hero.prompt', 'Prompt:')}</span>{' '}
      <span className="type-caret">{txt}</span>
    </p>
  )
}


const AI_LOGOS = [
  { src: '/art/logos/openai.png', alt: 'OpenAI' },
  { src: '/art/logos/gemini.png', alt: 'Google Gemini' },
  { src: '/art/logos/claude.png', alt: 'Anthropic Claude' },
  { src: '/art/logos/stability.png', alt: 'Stability AI' },
  { src: '/art/logos/deepseek.png', alt: 'DeepSeek' },
  { src: '/art/logos/mistral.png', alt: 'Mistral AI' },
  { src: '/art/logos/groq.png', alt: 'Groq' },
  { src: '/art/logos/elevenlabs.png', alt: 'ElevenLabs' },
]

/** Full-width, endlessly scrolling strip of the AI engines powering the site. */
function LogoMarquee() {
  const { t } = useLang()
  return (
    <section className="relative py-10">
      <p className="text-center text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-6">
        {t('logos.title', 'Powered by the world’s leading AI models')}
      </p>
      <div className="marquee">
        <div className="marquee-track">
          {[...AI_LOGOS, ...AI_LOGOS].map((logo, i) => (
            <span key={i} className="marquee-chip" title={logo.alt}>
              <img src={logo.src} alt={logo.alt} loading="lazy" draggable="false" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
