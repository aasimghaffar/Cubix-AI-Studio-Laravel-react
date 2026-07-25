import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'

const SHORTCODES = [
  { code: '[pricing]', title: 'Pricing plans', desc: 'The full pricing grid with monthly/yearly tabs and discount badges — the same one as the Pricing page.' },
  { code: '[tools]', title: 'AI tools grid', desc: 'All active AI tools as clickable cards, grouped exactly like the Tools page.' },
  { code: '[stats]', title: 'Statistics strip', desc: 'The "tools included / languages supported" numbers strip from the homepage.' },
  { code: '[cta]', title: 'Call-to-action', desc: 'A "create your free account" banner with a sign-up button.' },
]

/** Reference list — paste any of these into a page in the Pages editor. */
export default function Shortcodes() {
  const [copied, setCopied] = useState('')

  const copy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Shortcodes</h1>
      <p className="text-slate-400 text-sm mb-8">
        Paste any of these codes into a page (Pages → edit → type it on its own line) and the
        matching section is rendered there automatically — just like WordPress shortcodes.
        Example: create an "Our plans" page containing only <code className="text-brand">[pricing]</code>.
      </p>

      <div className="space-y-3">
        {SHORTCODES.map(({ code, title, desc }) => (
          <div key={code} className="card p-5 flex items-start gap-4">
            <span className="icon-tile !p-2.5 shrink-0"><Code2 size={17} /></span>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-brand font-semibold">{code}</code>
                <span className="text-white text-sm font-medium">{title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{desc}</p>
            </div>
            <button onClick={() => copy(code)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs text-slate-300 border border-ink-700 rounded-lg px-3 py-2 hover:border-brand/60">
              {copied === code ? <><Check size={13} className="text-brand" /> Copied</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
