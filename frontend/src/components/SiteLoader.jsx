import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Optional branded splash screen, configured in Admin → Appearance → Loader.
 *
 * Shows once per browser session, fades itself out, and never blocks: it hides
 * on load or after a 2.5s safety timeout, whichever comes first — a slow asset
 * can't leave a visitor staring at a spinner.
 */
export default function SiteLoader() {
  const { branding } = useAuth()
  const enabled = branding?.loader_enabled === '1' || branding?.loader_enabled === true
  const style = branding?.loader_style || 'neural'

  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(() => {
    if (typeof window === 'undefined') return true
    try { return sessionStorage.getItem('loaderShown') === '1' } catch { return false }
  })

  useEffect(() => {
    if (!enabled || gone) return
    const finish = () => {
      setLeaving(true)
      try { sessionStorage.setItem('loaderShown', '1') } catch { /* private mode */ }
      setTimeout(() => setGone(true), 600)
    }
    const t = setTimeout(finish, document.readyState === 'complete' ? 800 : 1600)
    const safety = setTimeout(finish, 2500)
    return () => { clearTimeout(t); clearTimeout(safety) }
  }, [enabled, gone])

  if (!enabled || gone) return null

  return (
    <div className={`site-loader ${leaving ? 'site-loader-out' : ''}`} role="status" aria-live="polite">
      <LoaderArt style={style} brandName={branding?.brand_name || 'Loading'} />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** The five selectable animations. Exported so the admin can preview them. */
export function LoaderArt({ style = 'neural', brandName = 'Cubix AI Studio' }) {
  const label = (
    <p className="sl-name">
      {brandName.split('').map((ch, i) => (
        <span key={i} style={{ animationDelay: `${i * 55}ms` }}>{ch === ' ' ? '\u00A0' : ch}</span>
      ))}
    </p>
  )

  if (style === 'node') {
    return (
      <div className="sl-card">
        <div className="sl-node">
          <span className="sl-aura" />
          <span className="sl-orbit"><i /></span>
          <span className="sl-nucleus" />
        </div>
        <div className="sl-wave">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} />)}
        </div>
        {label}
      </div>
    )
  }

  if (style === 'orbit') {
    return (
      <div className="sl-stack">
        <div className="sl-rings">
          <span className="sl-ring sl-ring-1" />
          <span className="sl-ring sl-ring-2" />
          <span className="sl-ring sl-ring-3" />
          <span className="sl-core" />
        </div>
        {label}
        <span className="sl-bar"><span /></span>
      </div>
    )
  }

  if (style === 'pulse') {
    return (
      <div className="sl-stack">
        <div className="sl-pulse">
          <span /><span /><span />
          <em />
        </div>
        {label}
      </div>
    )
  }

  if (style === 'prism') {
    return (
      <div className="sl-stack">
        <div className="sl-prism">
          <span className="sl-face sl-face-a" />
          <span className="sl-face sl-face-b" />
          <span className="sl-face sl-face-c" />
        </div>
        {label}
        <span className="sl-bar"><span /></span>
      </div>
    )
  }

  // default: 'neural' — nodes firing along connecting lines
  return (
    <div className="sl-stack">
      <div className="sl-neural">
        <svg viewBox="0 0 120 72" aria-hidden>
          <g className="sl-links">
            <line x1="14" y1="36" x2="60" y2="14" /><line x1="14" y1="36" x2="60" y2="36" />
            <line x1="14" y1="36" x2="60" y2="58" /><line x1="60" y1="14" x2="106" y2="36" />
            <line x1="60" y1="36" x2="106" y2="36" /><line x1="60" y1="58" x2="106" y2="36" />
          </g>
          <g className="sl-nodes">
            <circle cx="14" cy="36" r="5" style={{ animationDelay: '0ms' }} />
            <circle cx="60" cy="14" r="4.5" style={{ animationDelay: '180ms' }} />
            <circle cx="60" cy="36" r="4.5" style={{ animationDelay: '300ms' }} />
            <circle cx="60" cy="58" r="4.5" style={{ animationDelay: '420ms' }} />
            <circle cx="106" cy="36" r="5" style={{ animationDelay: '600ms' }} />
          </g>
        </svg>
      </div>
      {label}
      <span className="sl-bar"><span /></span>
    </div>
  )
}
