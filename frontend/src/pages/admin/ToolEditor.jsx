import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '../../lib/api'
import Alert from '../../components/Alert'

/** Full editor for one AI tool — every field properly labeled. */
export default function ToolEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tool, setTool] = useState(null)
  const [cats, setCats] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/tools').then((list) => {
      const found = list.find((x) => String(x.id) === String(id))
      if (!found) { navigate('/admin/tools'); return }
      setTool(found)
      setForm({
        name: found.name,
        description: found.description ?? '',
        taxonomy_id: found.taxonomy_id ?? '',
        status: found.status,
        free_enabled: !!found.free_enabled,
        free_limit: found.free_limit ?? '',
        free_unit: found.free_unit ?? 'month',
      })
    })
    api('/admin/taxonomies').then(setCats).catch(() => {})
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!form || !tool) return <p className="text-slate-400">Loading…</p>
  const Icon = Icons[tool.icon] || Icons.Wand2
  const set = (patch) => { setForm({ ...form, ...patch }); setSaved(false) }

  const save = async () => {
    setBusy(true); setError('')
    try {
      await api(`/admin/tools/${tool.id}`, { method: 'PUT', body: {
        ...form,
        taxonomy_id: form.taxonomy_id === '' ? null : parseInt(form.taxonomy_id, 10),
        free_limit: form.free_limit === '' ? null : parseInt(form.free_limit, 10),
      }})
      setSaved(true)
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/admin/tools" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand mb-6 group">
        <ArrowLeft size={15} className="transition group-hover:-translate-x-1" /> All tools
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <span className="p-3 rounded-2xl bg-brand/15 text-brand"><Icon size={24} /></span>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">{tool.name}</h1>
          <p className="text-xs text-slate-500">/{tool.slug}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── Basics ── */}
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-semibold text-white">Tool details</h2>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Tool name (shown everywhere on the site)</label>
            <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Short description (shown on tool cards and the tool page)</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Category (used for the filter tabs on the Tools page)</label>
            <select className="input" value={form.taxonomy_id} onChange={(e) => set({ taxonomy_id: e.target.value })}>
              <option value="">No category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Status</label>
            <select className="input" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="active">Active — customers can use it</option>
              <option value="inactive">Inactive — hidden from the site</option>
              <option value="coming_soon">Coming soon — visible but locked</option>
            </select>
          </div>
        </div>

        {/* ── Free credits ── */}
        <div className="card p-6 space-y-5">
          <h2 className="font-display font-semibold text-white">Free credits (no plan needed)</h2>
          <p className="text-xs text-slate-500 leading-relaxed -mt-2">
            Let signed-in users WITHOUT a subscription try this tool for free. Their free uses
            renew automatically — daily or monthly, your choice — and the tool page shows them
            how many they have left and when they renew.
          </p>
          <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.free_enabled}
              onChange={(e) => set({ free_enabled: e.target.checked })}
              className="accent-[rgb(var(--brand))]" />
            Enable free usage for signed-in users
          </label>
          {form.free_enabled && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Free uses per period (leave empty for unlimited)</label>
                <input type="number" min="1" className="input" placeholder="e.g. 5"
                  value={form.free_limit} onChange={(e) => set({ free_limit: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Credits renew every…</label>
                <select className="input" value={form.free_unit} onChange={(e) => set({ free_unit: e.target.value })}>
                  <option value="day">Day — resets at midnight</option>
                  <option value="month">Month — resets on the 1st</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {error && <Alert type="error" className="mt-5">{error}</Alert>}
      {saved && <Alert type="success" className="mt-5">Saved — the site is updated.</Alert>}

      <button onClick={save} disabled={busy} className="btn-brand mt-6 !px-8">
        <Save size={15} /> {busy ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
