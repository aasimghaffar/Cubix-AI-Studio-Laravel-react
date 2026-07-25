import { useEffect, useState } from 'react'
import { Tags, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '../../lib/api'

/** Tool categories — group the AI tools on the public Tools page. */
export default function Taxonomies() {
  const [cats, setCats] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const load = () => api('/admin/taxonomies').then(setCats)
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!name.trim()) return
    setError('')
    try {
      await api('/admin/taxonomies', { method: 'POST', body: { name: name.trim() } })
      setName('')
      load()
    } catch (e) { setError(e.message) }
  }

  const rename = async (cat, newName) => {
    if (!newName || newName === cat.name) return
    await api(`/admin/taxonomies/${cat.id}`, { method: 'PUT', body: { name: newName } })
    load()
  }

  const move = async (index, dir) => {
    const next = [...cats]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    await Promise.all(next.map((c, i) => api(`/admin/taxonomies/${c.id}`, { method: 'PUT', body: { sort_order: i + 1 } })))
    load()
  }

  const remove = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? Tools in it will show under "General".`)) return
    await api(`/admin/taxonomies/${cat.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Tool categories</h1>
      <p className="text-slate-400 text-sm mb-8">
        Group your AI tools into categories — the public Tools page shows them as filter tabs and
        grouped sections. Assign each tool to a category in <strong className="text-slate-300">AI Settings → AI tools</strong>.
      </p>

      <div className="flex gap-3 mb-6">
        <input className="input flex-1" placeholder="New category name (e.g. Creative Studio)"
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn-brand" onClick={add}><Plus size={15} /> Add</button>
      </div>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="space-y-2">
        {cats.map((cat, i) => (
          <div key={cat.id} className="card p-3.5 flex items-center gap-3">
            <Tags size={15} className="text-brand shrink-0" />
            <input className="input !py-1.5 flex-1" defaultValue={cat.name}
              onBlur={(e) => rename(cat, e.target.value.trim())} />
            <span className="text-xs text-slate-500 shrink-0">{cat.tools_count} tool{cat.tools_count === 1 ? '' : 's'}</span>
            <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-brand" onClick={() => move(i, 'up')}><ArrowUp size={13} /></button>
            <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-brand" onClick={() => move(i, 'down')}><ArrowDown size={13} /></button>
            <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400" onClick={() => remove(cat)}><Trash2 size={13} /></button>
          </div>
        ))}
        {cats.length === 0 && (
          <p className="text-sm text-slate-500">No categories yet — run <code className="text-slate-400">php artisan db:seed --class=DemoDataSeeder</code> for a ready-made set, or add your own above.</p>
        )}
      </div>
    </div>
  )
}
