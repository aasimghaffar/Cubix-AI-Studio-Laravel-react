import { Link } from 'react-router-dom'
import { Sparkles, ImagePlus, PenLine, AudioLines, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FxBackground from './FxBackground'
import { useEffect } from 'react'
import { initFx } from '../lib/fx'
import { useLang } from '../context/LanguageContext'

/** Split-screen wrapper: form on one side, showcase panel on the other. */
export default function AuthShell({ children }) {
  const { branding } = useAuth()
  useEffect(() => { initFx() }, [])
  const { t } = useLang()

  const points = [
    { icon: ImagePlus, text: t('tool.ai-image-generator.desc', 'Turn words into stunning visuals.') },
    { icon: PenLine, text: t('tool.ai-content-writer.desc', 'Blogs, ads, emails — written in seconds.') },
    { icon: FileText, text: t('tool.ai-document-assistant.desc', 'Upload a document and ask it anything.') },
    { icon: AudioLines, text: t('tool.ai-text-to-audio.desc', 'Lifelike voiceovers from text.') },
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <FxBackground />
      {/* ── Form side ── */}
      <div className="relative z-10 flex flex-col p-6 sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-10 self-start">
          {branding.brand_logo
            ? <img src={branding.brand_logo} alt={branding.brand_name} className="h-8 w-auto max-w-[140px] object-contain" />
            : <Sparkles className="text-brand" size={22} />}
          <span className="font-display font-bold text-white">{branding.brand_name}</span>
        </Link>
        <div className="flex-1 grid place-items-center">
          <div className="relative z-10 w-full max-w-sm animate-fade-up glass-window p-8 spotlight">{children}</div>
        </div>
      </div>

      {/* ── Showcase side ── */}
      <div className="hidden lg:block relative z-10 overflow-hidden border-l border-ink-700/60">
        <img src="/art/ai-workspace.png" alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/95 via-ink-950/70 to-ink-950/40" />
        <div className="aurora aurora-a w-[420px] h-[420px] -bottom-32 -right-24" />

        <div className="relative h-full flex flex-col justify-center p-14 max-w-xl">
          <h2 className="font-display text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            {t('hero.title', 'Create images, words & voice with')}{' '}
            <span className="animate-gradient-text">{branding.brand_name}</span>
          </h2>
          <p className="text-slate-300 mb-10">
            {t('hero.subtitle', 'One dashboard, one subscription — every AI tool you need.')}
          </p>
          <ul className="space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-200">
                <span className="icon-tile !p-2 shrink-0"><Icon size={16} /></span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** "Continue with Google" — shown only when the admin enabled it. */
export function GoogleButton() {
  const { branding } = useAuth()
  if (!branding.google_login) return null

  return (
    <>
      <a href="/api/auth/google/redirect"
        className="flex items-center justify-center gap-3 w-full rounded-xl border border-ink-700 hover:border-brand/60 bg-ink-800/50 px-4 py-2.5 text-sm text-slate-200 transition">
        <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Continue with Google
      </a>
      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-ink-700" />
        <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
        <span className="flex-1 h-px bg-ink-700" />
      </div>
    </>
  )
}
