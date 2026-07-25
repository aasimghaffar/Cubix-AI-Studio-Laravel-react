import { Link } from 'react-router-dom'
import { Home, Sparkles, Compass } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/** Lost in latent space — glitch 404. */
export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="relative min-h-[80vh] grid place-items-center overflow-hidden px-6">
      <div className="relative z-10 text-center max-w-lg">
        <div className="relative inline-block mb-6 animate-float">
          <span className="text-7xl select-none" role="img" aria-label="robot">🛸</span>
          <span className="absolute -inset-6 rounded-full opacity-30 blur-2xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--brand)), transparent 70%)' }} />
        </div>

        <h1 data-text="404" className="glitch font-display text-7xl sm:text-8xl font-bold text-white tracking-tight">
          404
        </h1>
        <p className="font-display text-xl text-white mt-4">{t('nf.title', 'Lost in latent space')}</p>
        <p className="text-slate-400 mt-2.5 leading-relaxed">
          {t('nf.text', "This page was never generated — or it drifted beyond the model's context window. Let's take you somewhere real.")}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link to="/" className="btn-brand magnetic"><Home size={15} /> {t('nf.home', 'Back home')}</Link>
          <Link to="/tools" className="btn-ghost magnetic"><Compass size={15} /> {t('nf.tools', 'Explore the tools')}</Link>
        </div>

        <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-600 mt-10">
          <Sparkles size={11} /> {t('nf.badge', 'error · page.notfound')}
        </p>
      </div>
    </div>
  )
}
