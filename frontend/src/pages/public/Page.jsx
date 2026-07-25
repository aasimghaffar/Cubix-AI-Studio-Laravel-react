import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { SHORTCODE_MAP } from '../../components/Shortcodes'
import { useLang } from '../../context/LanguageContext'

/** Split page HTML on [shortcode] tokens and render components in between. */
function renderWithShortcodes(html) {
  const names = Object.keys(SHORTCODE_MAP).join('|')
  const parts = html.split(new RegExp(`\\[(${names})\\]`, 'g'))
  return parts.map((part, i) => {
    const Block = SHORTCODE_MAP[part]
    if (Block && i % 2 === 1) return <Block key={i} />
    if (!part.trim()) return null
    return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />
  })
}

/** Renders admin-authored pages (Terms, Privacy, custom pages). */
export default function Page() {
  const { t } = useLang()
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setPage(null); setMissing(false)
    api(`/pages/${slug}`).then(setPage).catch(() => setMissing(true))
    window.scrollTo(0, 0)
  }, [slug])

  if (missing) {
    return <div className="min-h-[50vh] grid place-items-center text-slate-400">This page doesn't exist.</div>
  }
  if (!page) {
    return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>
  }

  const BACKGROUNDS = { 'terms': '/art/terms-banner.png', 'privacy-policy': '/art/privacy-banner.png' }
  const background = BACKGROUNDS[slug]

  return (
    <div className="relative">
      {/* Full-page background image (terms & privacy) — no grid pattern here */}
      {background && (
        <div className="absolute inset-0 pointer-events-none">
          <img src={background} alt="" aria-hidden className="w-full h-full object-cover opacity-40 select-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/80 to-ink-950" />
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 animate-fade-up">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">{t(`page.${slug}.title`, page.title)}</h1>
        <div className="page-content text-slate-300 leading-relaxed space-y-4">
          {renderWithShortcodes(t(`page.${slug}.content`, page.content ?? ''))}
        </div>
      </div>
    </div>
  )
}
