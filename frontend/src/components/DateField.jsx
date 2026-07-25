import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Portal from './Portal'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Mo','Tu','We','Th','Fr','Sa','Su']
const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * Themed date picker matching the site design (native date popups can't be styled).
 * Drop-in: <DateField value="YYYY-MM-DD" onChange={(v) => …} max={fmt(new Date())} />
 */
export default function DateField({ value, onChange, placeholder = 'Select a date', max, min, className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [view, setView] = useState(() => selected ?? new Date())

  const show = () => {
    const r = btnRef.current.getBoundingClientRect()
    const width = 296
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8)
    const below = r.bottom + 348 < window.innerHeight
    setPos({ left, top: below ? r.bottom + 8 : Math.max(8, r.top - 348) })
    setView(selected ?? new Date())
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!e.target.closest?.('.datefield-pop')) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    setTimeout(() => document.addEventListener('click', close), 0)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const year = view.getFullYear()
  const month = view.getMonth()
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first
  const days = new Date(year, month + 1, 0).getDate()
  const maxD = max ? new Date(max + 'T23:59:59') : null
  const minD = min ? new Date(min + 'T00:00:00') : null
  const today = fmt(new Date())

  const pick = (d) => { onChange(fmt(d)); setOpen(false) }

  return (
    <>
      <button type="button" ref={btnRef} onClick={show}
        className={`input flex items-center justify-between gap-3 text-left cursor-pointer transition ${
          open ? 'border-brand/70 ring-2 ring-brand/20' : ''
        } ${className}`}>
        <span className={selected ? 'font-medium' : 'text-slate-500'}>
          {selected ? `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}` : placeholder}
        </span>
        <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0 transition"
          style={{ background: 'linear-gradient(135deg, rgb(var(--brand) / .22), rgb(var(--accent) / .18))' }}>
          <Calendar size={14} className="text-brand" />
        </span>
      </button>

      {open && pos && (
        <Portal>
          <div className="datefield-pop fixed z-[60] w-[320px] rounded-2xl overflow-hidden animate-pop-in datefield-card"
            style={{ left: pos.left, top: pos.top }}>
            {/* gradient header band */}
            <div className="relative px-3 pt-3 pb-3.5"
              style={{ background: 'linear-gradient(135deg, rgb(var(--brand) / .22), rgb(var(--accent) / .16))' }}>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setView(new Date(year, month - 1, 1))}
                  aria-label="Previous month"
                  className="grid place-items-center w-8 h-8 rounded-xl text-slate-300 hover:text-white datefield-nav transition">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  <select value={month} onChange={(e) => setView(new Date(year, +e.target.value, 1))}
                    className="datefield-select font-display text-sm font-bold">
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select value={year} onChange={(e) => setView(new Date(+e.target.value, month, 1))}
                    className="datefield-select font-display text-sm font-bold !text-brand">
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button type="button" onClick={() => setView(new Date(year, month + 1, 1))}
                  aria-label="Next month"
                  className="grid place-items-center w-8 h-8 rounded-xl text-slate-300 hover:text-white datefield-nav transition">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="p-3.5">
            {/* weekday header */}
            <div className="grid grid-cols-7 mb-1.5">
              {DOW.map((d, i) => (
                <span key={d} className={`text-center text-[10px] font-semibold uppercase tracking-wider py-1 ${
                  i >= 5 ? 'text-brand/70' : 'text-slate-500'
                }`}>{d}</span>
              ))}
            </div>

            {/* days */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: offset }).map((_, i) => <span key={'e' + i} />)}
              {Array.from({ length: days }, (_, i) => {
                const d = new Date(year, month, i + 1)
                const iso = fmt(d)
                const disabled = (maxD && d > maxD) || (minD && d < minD)
                const isSel = value === iso
                const isToday = iso === today
                return (
                  <button key={iso} type="button" disabled={disabled} onClick={() => pick(d)}
                    className={`h-9 rounded-xl text-sm font-medium transition datefield-day ${
                      isSel ? 'font-bold scale-105'
                        : disabled ? 'opacity-30 cursor-not-allowed'
                        : 'hover:scale-105'
                    } ${isToday && !isSel ? 'datefield-today' : ''}`}
                    style={isSel ? {
                      background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))',
                      color: '#08111f',
                      boxShadow: '0 6px 16px -4px rgb(var(--brand) / .55)',
                    } : undefined}>
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 datefield-footer">
              <button type="button" className="text-xs px-2.5 py-1 rounded-lg text-slate-400 hover:text-white datefield-nav transition"
                onClick={() => { onChange(''); setOpen(false) }}>Clear</button>
              <button type="button" className="text-xs font-semibold px-3 py-1 rounded-lg text-brand datefield-nav transition"
                onClick={() => pick(new Date())}>Today</button>
            </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
