import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowLeft, Download, Copy, TriangleAlert, X, Eye, History, Trash2, ChevronDown, FileDown } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DynamicForm from '../components/DynamicForm'
import CreditMeter from '../components/CreditMeter'
import ToolAccessModal from '../components/ToolAccessModal'
import { useLang } from '../context/LanguageContext'
import Portal from '../components/Portal'

export default function ToolWorkspace() {
  const { slug } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [publicTool, setPublicTool] = useState(null)

  useEffect(() => {
    api('/tools/public').then((tools) => setPublicTool(tools.find((t) => t.slug === slug) ?? false))
  }, [slug])

  if (loading || publicTool === null) {
    return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>
  }

  // Direct-URL visitors without access get the popup over a blurred preview;
  // the X (or Escape / backdrop click) returns them to the tools page.
  if (!user) return <GatedPreview slug={slug} gate="login" onClose={() => navigate('/tools')} />
  if (!user.active_subscription && !publicTool?.free_enabled) {
    return <GatedPreview slug={slug} gate="plans" onClose={() => navigate('/tools')} />
  }

  return <Workspace slug={slug} />
}

function GatedPreview({ slug, gate, onClose }) {
  const [tool, setTool] = useState(null)

  useEffect(() => {
    api('/tools/public').then((tools) => setTool(tools.find((t) => t.slug === slug)))
  }, [slug])

  const Icon = Icons[tool?.icon] || Icons.Wand2

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 min-h-[70vh]">
      <div className="blur-sm pointer-events-none select-none opacity-50" aria-hidden>
        <div className="flex items-center gap-3 mb-8">
          <span className="icon-tile"><Icon size={22} /></span>
          <h1 className="font-display text-2xl font-bold text-white">{tool?.name ?? 'AI tool'}</h1>
        </div>
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          <div className="card p-6 space-y-4">
            <div className="h-24 rounded-xl bg-ink-800" />
            <div className="h-10 rounded-xl bg-ink-800" />
            <div className="h-10 rounded-xl bg-ink-800" />
            <div className="h-11 rounded-xl bg-brand/40" />
          </div>
          <div className="card p-10" />
        </div>
      </div>

      <ToolAccessModal gate={gate} toolPath={`/tools/${slug}`} onClose={onClose} />
    </div>
  )
}

function Workspace({ slug }) {
  const { t } = useLang()
  const [tool, setTool] = useState(null)
  const [meter, setMeter] = useState(null)
  const [busy, setBusy] = useState(false)
  const [outputs, setOutputs] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [lightbox, setLightbox] = useState(null) // url currently open in the popup
  const [error, setError] = useState('')
  const [isLimitError, setIsLimitError] = useState(false)
  const navigate = useNavigate()

  const load = () =>
    api('/tools').then((d) => {
      const t = d.tools.find((t) => t.slug === slug)
      if (!t || t.status !== 'active') { navigate('/tools'); return }
      setTool(t)
      setMeter(d.meters[t.feature_key])
    })

  useEffect(() => {
    setOutputs([]); setError(''); setHistoryLoaded(false); setLightbox(null)
    load()
    // Restore this user's previous results so nothing is lost between visits.
    api(`/tools/${slug}/history`)
      .then((rows) => setOutputs(rows.map((r) => ({ ...r.output, _input: r.input, _at: r.created_at }))))
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [slug])

  const run = async (values, setFieldErrors) => {
    setBusy(true); setError('')
    try {
      const form = new FormData()
      Object.entries(values).forEach(([k, v]) => v !== undefined && form.append(k, v))
      const { result } = await api(`/tools/${slug}/process`, { method: 'POST', body: form, isForm: true })
      setOutputs((o) => [{ ...result, _input: values, _at: new Date().toISOString() }, ...o])
      load()
    } catch (e) {
      if (e.status === 422 && e.data?.errors) {
        setFieldErrors(Object.fromEntries(Object.entries(e.data.errors).map(([k, v]) => [k, v[0]])))
      } else {
        setIsLimitError(e.status === 402)
        setError(e.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    if (!confirm('Delete ALL of your saved results for this tool? This cannot be undone.')) return
    await api(`/tools/${slug}/history`, { method: 'DELETE' }).catch(() => {})
    setOutputs([])
  }

  if (!tool) return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>

  const Icon = Icons[tool.icon] || Icons.Wand2

  const backdrop = TOOL_ART[slug] ?? '/art/tools-hero.png'

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Tool artwork as the whole workspace backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={backdrop} alt="" aria-hidden className="w-full h-full object-cover opacity-[0.14] select-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/88 to-ink-950" />
        <div className="aurora aurora-a w-[380px] h-[380px] -top-24 -left-24 animate-float-slow" />
        <div className="aurora aurora-b w-[320px] h-[320px] bottom-0 -right-24 animate-float" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
      <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand mb-8 group">
        <ArrowLeft size={16} className="transition group-hover:-translate-x-1" /> {t('ws.back', 'All tools')}
      </Link>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        <div className="card gradient-ring glass p-6 animate-slide-up lg:sticky lg:top-6">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="icon-tile !p-2.5 animate-pulse-glow"><Icon size={20} /></span>
            <div>
              <h1 className="font-display text-xl font-bold text-white leading-tight">{t(`tool.${slug}.name`, tool.name)}</h1>
              {tool.taxonomy && (
                <span className="text-[10px] uppercase tracking-widest text-brand">{t(`taxonomy.${tool.taxonomy.slug}`, tool.taxonomy.name)}</span>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-5">{t(`tool.${slug}.desc`, tool.description)}</p>
          {meter && (
            <div className="mb-6">
              <CreditMeter used={meter.used} limit={meter.limit} renews={meter.renews}
                freeLabel={meter.free ? (meter.renews === 'day' ? 'free uses today' : 'free uses this month') : undefined} />
              {meter.free && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {meter.renews === 'day'
                    ? t('ws.free_renews_day', 'Free credits renew every day at midnight.')
                    : t('ws.free_renews_month', 'Free credits renew on the 1st of every month.')}
                </p>
              )}
            </div>
          )}
          <DynamicForm schema={tool.input_schema} onSubmit={run} busy={busy} />
        </div>

        <div className="space-y-4">
          {busy && (
            <div className="card p-5 space-y-3">
              <p className="text-sm text-slate-400">Generating…</p>
              <div className="shimmer h-4 w-3/4" />
              <div className="shimmer h-4 w-1/2" />
              <div className="shimmer h-32" />
            </div>
          )}
          {!busy && historyLoaded && outputs.length === 0 && (
            <div className="card overflow-hidden text-center animate-fade-up">
              {TOOL_ART[slug] && (
                <div className="relative h-44 sm:h-56">
                  <img src={TOOL_ART[slug]} alt="" aria-hidden className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
                </div>
              )}
              <div className={TOOL_ART[slug] ? 'p-8 pt-4' : 'p-14'}>
                {!TOOL_ART[slug] && <span className="icon-tile mb-4 opacity-60"><Icon size={24} /></span>}
                <p className="text-slate-400 text-sm">Your results will appear here.</p>
                <p className="text-slate-600 text-xs mt-1">Fill in the form and hit the button to create your first one.</p>
              </div>
            </div>
          )}

          {outputs.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{outputs.length} saved result{outputs.length > 1 ? 's' : ''}</p>
              <button onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition">
                <Trash2 size={13} /> Clear all history
              </button>
            </div>
          )}

          {outputs.length > 0 && outputs[0].type === 'image' ? (
            <ImageGallery outputs={outputs} onOpen={setLightbox} />
          ) : (
            <DayGroups outputs={outputs} slug={slug} />
          )}
        </div>
      </div>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {error && <ErrorModal message={error} onClose={() => setError('')} showUpgrade={isLimitError} />}
      </div>
    </div>
  )
}

function ErrorModal({ message, onClose, showUpgrade = false }) {
  const navigate = useNavigate()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative card p-7 w-full max-w-sm text-center animate-pop-in border-red-400/30" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
          <X size={18} />
        </button>
        <span className="inline-flex p-3 rounded-2xl bg-red-500/15 text-red-400 mb-4"><TriangleAlert size={24} /></span>
        <h2 className="font-display font-semibold text-white mb-2">{showUpgrade ? 'Limit reached' : 'Generation failed'}</h2>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        {showUpgrade ? (
          <div className="space-y-3">
            <button onClick={() => navigate('/pricing')} className="btn-brand w-full">See plans</button>
            <button onClick={onClose} className="btn-ghost w-full">Not now</button>
          </div>
        ) : (
          <button onClick={onClose} className="btn-brand w-full">Got it</button>
        )}
      </div>
    </div>
    </Portal>
  )
}

/** Thumbnail grid: 4 per row, hover shows eye + download, click opens the lightbox. */
function ImageGallery({ outputs, onOpen }) {
  const urls = outputs.flatMap((o) => o.urls ?? (o.url ? [o.url] : []))

  return (
    <div className="card p-4 animate-fade-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {urls.map((url, i) => (
          <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-ink-800 cursor-pointer"
            onClick={() => onOpen(url)}>
            <img src={url} alt={`Generated ${i + 1}`} loading="lazy"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-50" />
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-full bg-ink-950/70 text-white backdrop-blur border border-white/15"
                  title="View large">
                  <Eye size={17} />
                </span>
                <a href={url} download onClick={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-full bg-ink-950/70 text-white backdrop-blur border border-white/15 hover:text-brand"
                  title="Download">
                  <Download size={17} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3 inline-flex items-center gap-1.5">
        <History size={12} /> Your previous generations stay here — hover an image to view or download it.
      </p>
    </div>
  )
}

/** Full-size popup with close + download. */
function Lightbox({ url, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-8 bg-ink-950/85 backdrop-blur-md animate-pop-in"
      onClick={onClose}>
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <a href={url} download
            className="p-2.5 rounded-full bg-ink-800 border border-ink-700 text-slate-200 hover:text-brand transition"
            title="Download">
            <Download size={18} />
          </a>
          <button onClick={onClose} aria-label="Close"
            className="p-2.5 rounded-full bg-ink-800 border border-ink-700 text-slate-200 hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <img src={url} alt="Generated result — full size"
          className="w-full max-h-[80vh] object-contain rounded-2xl border border-ink-700/60" />
      </div>
    </div>
    </Portal>
  )
}

/** Groups results by calendar day — today open, older days collapsible. */
function DayGroups({ outputs, slug }) {
  const [open, setOpen] = useState({})
  if (outputs.length === 0) return null

  const groups = []
  for (const out of outputs) {
    const day = out._at ? new Date(out._at).toDateString() : 'Earlier'
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(out)
    else groups.push({ day, items: [out] })
  }

  const today = new Date().toDateString()
  const fmtDay = (d) => d === today ? 'Today' : new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="space-y-4">
      {groups.map((g, gi) => {
        const isOpen = open[g.day] ?? gi === 0
        return (
          <div key={g.day}>
            <button onClick={() => setOpen({ ...open, [g.day]: !isOpen })}
              className="w-full flex items-center justify-between text-left px-1 py-1.5 mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 inline-flex items-center gap-2">
                <History size={12} /> {fmtDay(g.day)} · {g.items.length}
              </span>
              <ChevronDown size={14} className={`text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="space-y-4">
                {g.items.map((out, i) => (
                  <Output key={`${g.day}-${i}`} out={out} slug={slug} isLatest={gi === 0 && i === 0} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Downloads text as .txt, .md, or a Word-compatible .doc file. */
function downloadText(text, format, base = 'result') {
  let blob, name
  if (format === 'doc') {
    const html = `<html><head><meta charset="utf-8"></head><body>${text.split('\n').map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('')}</body></html>`
    blob = new Blob([html], { type: 'application/msword' })
    name = `${base}.doc`
  } else if (format === 'md') {
    blob = new Blob([text], { type: 'text/markdown' })
    name = `${base}.md`
  } else {
    blob = new Blob([text], { type: 'text/plain' })
    name = `${base}.txt`
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Tool-specific artwork shown in the empty state before the first result. */
const TOOL_ART = {
  'ai-image-generator': '/art/ai-workspace.png',
  'ai-background-removal': '/art/bg-removal-demo.png',
  'ai-chat-assistant': '/art/chat-assistant-art.png',
  'ai-text-to-audio': '/art/text-to-audio-art.png',
  'ai-text-rewriter': '/art/rewriter-art.png',
  'ai-summarizer': '/art/summarizer-art.png',
}

const CLAMP_CHARS = 420 // roughly five lines

function Output({ out, slug, isLatest = false }) {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [dlOpen, setDlOpen] = useState(false)
  // Results come from the AI and from stored history — never trust the shape.
  const answer = typeof out.answer === 'string' ? out.answer : JSON.stringify(out.answer ?? '', null, 2)

  // All hooks are declared above this early return — never after it.
  if (out.type === 'audio') {
    return (
      <div className="card p-5 animate-fade-up">
        <audio controls src={out.url} className="w-full" />
        <a href={out.url} download className="inline-flex items-center gap-2 text-sm text-brand mt-3">
          <Download size={15} /> Download MP3
        </a>
      </div>
    )
  }

  const long = answer.length > CLAMP_CHARS
  const shown = expanded || !long ? answer : answer.slice(0, CLAMP_CHARS)
  const isDocTool = slug === 'ai-document-assistant'
  const prompt = out._input?.prompt || out._input?.message || out._input?.topic

  return (
    <div className={`card p-5 animate-fade-up ${isLatest ? '' : 'opacity-90'}`}>
      {out._at && !isLatest && (
        <p className="text-[11px] text-slate-500 mb-2 inline-flex items-center gap-1">
          <History size={11} /> {new Date(out._at).toLocaleString()}
        </p>
      )}

      {/* What the customer asked (document / chat style tools) */}
      {isDocTool && prompt && (
        <div className="mb-4 rounded-xl bg-ink-800/70 border border-ink-700/60 px-4 py-2.5">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-0.5">You asked</p>
          <p className="text-sm text-slate-300">{String(prompt)}</p>
        </div>
      )}

      <div className="relative">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{shown}{!expanded && long && '…'}</p>
        {!expanded && long && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-900 to-transparent pointer-events-none" />
        )}
      </div>
      {long && (
        <button onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-xs text-brand mt-2">
          <ChevronDown size={13} className={expanded ? 'rotate-180 transition' : 'transition'} />
          {expanded ? 'See less' : 'See more'}
        </button>
      )}

      <div className="flex items-center gap-5 mt-4">
        <button
          onClick={() => { navigator.clipboard?.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="inline-flex items-center gap-2 text-sm text-brand"
        >
          <Copy size={14} /> {copied ? t('ws.copied', 'Copied!') : t('ws.copy', 'Copy text')}
        </button>

        {isDocTool && (
          <div className="relative">
            <button onClick={() => setDlOpen((o) => !o)}
              className="inline-flex items-center gap-2 text-sm text-brand">
              <FileDown size={14} /> {t('ws.download', 'Download')}
            </button>
            {dlOpen && (
              <div className="absolute bottom-full mb-2 left-0 card p-1.5 w-40 shadow-xl animate-pop-in z-20">
                {[['txt', 'Text file (.txt)'], ['doc', 'Word (.doc)'], ['md', 'Markdown (.md)']].map(([fmt, label]) => (
                  <button key={fmt}
                    onClick={() => { downloadText(answer, fmt, 'document-answer'); setDlOpen(false) }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-ink-800">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
