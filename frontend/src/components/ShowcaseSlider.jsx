import { useEffect, useState } from 'react'
import { ImagePlus, PenLine, Languages, AudioLines, Sparkles } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

/**
 * Auto-rotating showcase of what the tools produce.
 * Visuals are CSS/gradient art so the product works offline & white-label
 * (no stock photos to license or replace).
 */
const SLIDES = [
  {
    icon: ImagePlus,
    title: 'AI Image Generator',
    captionKey: 'slide.1.caption', caption: '"A neon-lit street market at night, rain reflections, cinematic"',
    art: (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-ink-700/60 relative">
        <img src="/art/ai-workspace.png" alt="Creating images with AI" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
      </div>
    ),
  },
  {
    icon: PenLine,
    title: 'AI Content Writer',
    captionKey: 'slide.2.caption', caption: 'A 400-word product story, written in your tone, in seconds',
    art: (
      <div className="w-full h-full rounded-2xl bg-ink-900 border border-ink-700/60 p-6 flex flex-col gap-3">
        <div className="h-4 w-2/3 rounded bg-gradient-to-r from-[rgb(var(--brand))] to-[rgb(var(--accent))] opacity-80" />
        {[90, 100, 96, 80, 100, 72].map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-ink-700" style={{ width: `${w}%` }} />
        ))}
        <div className="mt-auto h-8 w-28 rounded-lg" style={{ background: 'rgb(var(--brand) / .25)' }} />
      </div>
    ),
  },
  {
    icon: Languages,
    title: 'AI Translator',
    captionKey: 'slide.3.caption', caption: 'English → Urdu, Arabic, Spanish & 9 more — naturally phrased',
    art: (
      <div className="w-full h-full rounded-2xl bg-ink-900 border border-ink-700/60 p-6 grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <div className="h-3 w-16 rounded bg-brand/50" />
          {[100, 85, 92, 70].map((w, i) => <div key={i} className="h-2.5 rounded bg-ink-700" style={{ width: `${w}%` }} />)}
        </div>
        <div className="space-y-2.5 text-right" dir="rtl">
          <div className="h-3 w-16 rounded bg-[rgb(var(--accent)/.5)]" />
          {[95, 88, 100, 66].map((w, i) => <div key={i} className="h-2.5 rounded bg-ink-700" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    ),
  },
  {
    icon: AudioLines,
    title: 'AI Text-to-Audio',
    captionKey: 'slide.4.caption', caption: 'Natural voiceovers with adjustable speed and voice',
    art: (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-ink-700/60 relative">
        <img src="/art/text-to-audio-art.png" alt="Text becomes natural speech" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: 'One studio, every tool',
    captionKey: 'slide.5.caption', caption: 'Images, words, voice & documents under one subscription',
    art: (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-ink-700/60 relative">
        <img src="/art/ai-banner.png" alt="AI creative tools"
          className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
      </div>
    ),
  },
]

export default function ShowcaseSlider() {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4500)
    return () => clearInterval(id)
  }, [paused, index])

  const slide = SLIDES[index]
  const Icon = slide.icon

  return (
    <div className="card p-4 sm:p-6 relative group"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-ink-700/60 overflow-hidden">
        <div key={index} className="h-full bg-gradient-to-r from-[rgb(var(--brand))] to-[rgb(var(--accent))]"
          style={{ animation: paused ? 'none' : 'slideProgress 4.5s linear forwards' }} />
      </div>
      <style>{'@keyframes slideProgress { from { width: 0 } to { width: 100% } }'}</style>

      <button aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full grid place-items-center bg-ink-950/70 border border-ink-700 text-slate-300 opacity-0 group-hover:opacity-100 transition hover:text-white">
        ‹
      </button>
      <button aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full grid place-items-center bg-ink-950/70 border border-ink-700 text-slate-300 opacity-0 group-hover:opacity-100 transition hover:text-white">
        ›
      </button>

      <div className="h-56 sm:h-72 animate-fade-up" key={`art-${index}`}>{slide.art}</div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-tile !p-2.5 shrink-0"><Icon size={18} /></span>
          <div className="min-w-0">
            <p className="font-display font-semibold text-white">{slide.title}</p>
            <p className="text-xs text-slate-400 truncate">{t(slide.captionKey, slide.caption)}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}
              className={`dot ${i === index ? 'dot-active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
