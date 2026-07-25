import { useEffect, useState } from 'react'
import { Quote, Star } from 'lucide-react'
import { api } from '../lib/api'
import { useLang } from '../context/LanguageContext'

/** Rotating testimonials — managed by the admin in Admin → Testimonials. */
export default function Testimonials() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => { api('/testimonials').then(setItems).catch(() => {}) }, [])

  useEffect(() => {
    if (items.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [items])

  if (items.length === 0) return null
  const item = items[Math.min(index, items.length - 1)]

  return (
    <div className="card gradient-ring p-8 sm:p-10 text-center relative overflow-hidden">
      <Quote className="absolute top-6 left-6 text-brand/20" size={48} />
      <div className="flex justify-center gap-1 mb-4">
        {[...Array(item.rating ?? 5)].map((_, i) => <Star key={i} size={16} className="text-brand fill-current" />)}
      </div>
      <p className="text-slate-200 text-base sm:text-lg leading-relaxed max-w-xl mx-auto min-h-[4.5rem]">
        "{t(`testimonial.${item.id}.quote`, item.quote)}"
      </p>
      <p className="text-sm text-white font-medium mt-5">{t(`testimonial.${item.id}.name`, item.name)}</p>
      {item.role && <p className="text-xs text-slate-500">{t(`testimonial.${item.id}.role`, item.role)}</p>}
      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Testimonial ${i + 1}`}
            className={`dot ${i === index ? 'dot-active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
