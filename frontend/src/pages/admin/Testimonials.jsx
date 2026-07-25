import { useEffect, useState } from 'react'
import { Plus, Trash2, Star, Eye, EyeOff } from 'lucide-react'
import { api } from '../../lib/api'
import Portal from '../../components/Portal'

/** "Loved by creators" section — fully managed here. */
export default function Testimonials() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api('/admin/testimonials').then(setItems)
  useEffect(() => { load() }, [])

  const save = async () => {
    setError('')
    try {
      if (editing.id) {
        await api(`/admin/testimonials/${editing.id}`, { method: 'PUT', body: editing })
      } else {
        await api('/admin/testimonials', { method: 'POST', body: editing })
      }
      setEditing(null)
      load()
    } catch (e) { setError(e.message) }
  }

  const toggle = async (item) => {
    await api(`/admin/testimonials/${item.id}`, { method: 'PUT', body: { enabled: !item.enabled } })
    load()
  }

  const remove = async (item) => {
    if (!confirm(`Remove the testimonial from "${item.name}"?`)) return
    await api(`/admin/testimonials/${item.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Testimonials</h1>
      <p className="text-slate-400 text-sm mb-8">
        These rotate in the "Loved by creators" section on the homepage. Add real customer
        feedback here — hidden ones stay saved but don't show on the site.
      </p>

      <div className="flex justify-end mb-4">
        <button className="btn-brand !py-2" onClick={() => setEditing({ name: '', role: '', quote: '', rating: 5 })}>
          <Plus size={15} /> Add testimonial
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`card p-5 ${item.enabled ? '' : 'opacity-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 cursor-pointer" onClick={() => setEditing(item)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  {item.role && <p className="text-xs text-slate-500">— {item.role}</p>}
                  <span className="inline-flex">
                    {[...Array(item.rating)].map((_, i) => <Star key={i} size={11} className="text-brand fill-current" />)}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">"{item.quote}"</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-brand" onClick={() => toggle(item)}>
                  {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400" onClick={() => remove(item)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-500">Nothing yet — run <code className="text-slate-400">php artisan db:seed --class=DemoDataSeeder</code> for sample testimonials, or add your own.</p>
        )}
      </div>

      {editing && (
        <Portal>
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={() => setEditing(null)}>
          <div className="card p-7 w-full max-w-md animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-white mb-5">{editing.id ? 'Edit testimonial' : 'New testimonial'}</h2>
            <div className="space-y-3">
              <input className="input" placeholder="Customer name" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <input className="input" placeholder="Role / company (optional)" value={editing.role ?? ''}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
              <textarea className="input min-h-28" placeholder="What they said…" value={editing.quote}
                onChange={(e) => setEditing({ ...editing, quote: e.target.value })} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Rating:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setEditing({ ...editing, rating: n })}>
                    <Star size={18} className={n <= (editing.rating ?? 5) ? 'text-brand fill-current' : 'text-slate-600'} />
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button className="btn-brand flex-1" onClick={save}>Save</button>
                <button className="btn-ghost flex-1" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
