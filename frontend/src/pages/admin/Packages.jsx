import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Check } from 'lucide-react'
import { api } from '../../lib/api'
import Portal from '../../components/Portal'

const EMPTY = {
  name: '', price: 0, billing_cycle: 'monthly', status: 'active',
  stripe_plan_id: '', paypal_plan_id: '',
  features: {},
}

const LIMIT_LABELS = {
  image_generation_credits: 'Image credits',
  content_writer_credits: 'Content writer credits',
  translation_credits: 'Translation credits',
  document_query_credits: 'Document query credits',
  background_removal_credits: 'Background removal credits',
  audio_character_limit: 'Audio character limit',
  chat_credits: 'Chat assistant credits',
  rewriter_credits: 'Rewriter credits',
  summarizer_credits: 'Summarizer credits',
}

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => api('/admin/packages').then(setPackages)
  const [customers, setCustomers] = useState([])
  useEffect(() => {
    load()
    api('/admin/customers').then((d) => setCustomers(Array.isArray(d) ? d : d.data ?? [])).catch(() => {})
  }, [])

  const save = async () => {
    setError('')
    try {
      const path = editing.id ? `/admin/packages/${editing.id}` : '/admin/packages'
      await api(path, { method: editing.id ? 'PUT' : 'POST', body: editing })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    }
  }

  const remove = async (pkg) => {
    if (!confirm(`Delete "${pkg.name}"?`)) return
    await api(`/admin/packages/${pkg.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Packages</h1>
        <button className="btn-brand" onClick={() => setEditing({ ...EMPTY })}><Plus size={16} /> New package</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {packages.map((pkg, pi) => (
          <div key={pkg.id} className="card card-laminate spotlight p-0 overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: `${pi * 60}ms` }}>
            {/* header band */}
            <div className="relative px-6 pt-5 pb-4"
              style={{ background: 'linear-gradient(135deg, rgb(var(--brand) / .16), rgb(var(--accent) / .1))' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-white truncate">{pkg.name}</h2>
                  <p className="mt-1">
                    <span className="font-display text-xl sm:text-2xl font-bold text-white">${pkg.price}</span>
                    <span className="text-xs text-slate-400"> / {pkg.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border ${
                    pkg.status === 'active' ? 'text-brand border-brand/40 bg-brand/10' : 'text-slate-500 border-ink-700'
                  }`}>{pkg.status}</span>
                  {pkg.is_custom && (
                    <span className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 text-ink-950 font-bold"
                      style={{ background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))' }}>Custom</span>
                  )}
                  {pkg.discount_percent > 0 && (
                    <span className="text-[10px] font-bold text-amber-300 border border-amber-400/40 rounded-full px-2 py-0.5">{pkg.discount_percent}% off</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-3">
                <span>👥 {pkg.subscriptions_count} subscriber{pkg.subscriptions_count === 1 ? '' : 's'}</span>
                <span>🖥 {pkg.max_sessions ?? '∞'} browser{pkg.max_sessions === 1 ? '' : 's'}</span>
              </p>
            </div>

            <ul className="text-sm space-y-1.5 px-6 py-4 flex-1">
              {Object.entries(pkg.features).map(([k, v]) => (
                <li key={k} className="flex justify-between items-center gap-3">
                  <span className="flex items-center gap-2 text-slate-400 text-[13px]"><Check size={13} className="text-brand shrink-0" /> {LIMIT_LABELS[k] ?? k}</span>
                  <span className={Number(v) === -1 ? 'font-semibold animate-gradient-text text-[13px]' : 'text-slate-200 text-[13px] tabular-nums'}>
                    {Number(v) === -1 ? '∞ Unlimited' : Number(v).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setEditing(pkg)} className="btn-brand flex-1"><Pencil size={14} /> Edit</button>
              <button onClick={() => remove(pkg)} className="p-2.5 rounded-xl border border-ink-700 text-slate-400 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Portal>
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="card p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-white text-lg mb-5">
              {editing.id ? 'Edit package' : 'New package'}
            </h2>
            <div className="space-y-4">
              <input className="input" placeholder="Package name" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input className="input" type="number" min="0" step="0.01" placeholder="Price" value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                <select className="input" value={editing.billing_cycle}
                  onChange={(e) => setEditing({ ...editing, billing_cycle: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <input className="input" placeholder="Stripe price ID (price_…)" value={editing.stripe_plan_id ?? ''}
                onChange={(e) => setEditing({ ...editing, stripe_plan_id: e.target.value })} />

              <div className="flex items-center justify-between gap-4">
                <label className="text-sm text-slate-400">Discount badge (% OFF shown on pricing — leave empty for none)</label>
                <input className="input !w-24" type="number" min="0" max="90" placeholder="—"
                  value={editing.discount_percent ?? ''}
                  onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value === '' ? null : parseInt(e.target.value, 10) })} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-sm text-slate-400">Browser logins allowed at the same time (empty = unlimited)</label>
                <input className="input !w-24" type="number" min="1" max="100" placeholder="∞"
                  value={editing.max_sessions ?? ''}
                  onChange={(e) => setEditing({ ...editing, max_sessions: e.target.value === '' ? null : parseInt(e.target.value, 10) })} />
              </div>

              <div className="rounded-xl border border-ink-700 p-4 space-y-3">
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editing.is_custom ?? false}
                    onChange={(e) => setEditing({ ...editing, is_custom: e.target.checked, user_id: e.target.checked ? editing.user_id : null })}
                    className="accent-[rgb(var(--brand))]" />
                  Custom package — private to one customer
                </label>
                {editing.is_custom && (
                  <select className="input" value={editing.user_id ?? ''}
                    onChange={(e) => setEditing({ ...editing, user_id: e.target.value ? parseInt(e.target.value, 10) : null })}>
                    <option value="">Choose the customer…</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                  </select>
                )}
                {editing.is_custom && (
                  <p className="text-xs text-slate-500">Only this customer will see and be able to buy this package. It never appears on the public pricing page for anyone else.</p>
                )}
              </div>

              <p className="text-sm font-medium text-slate-300 pt-2">Tool limits per billing cycle</p>
              {Object.keys(LIMIT_LABELS).map((key) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-400 flex-1">{LIMIT_LABELS[key]}</label>
                  {editing.features[key] === -1 ? (
                    <span className="text-sm font-semibold animate-gradient-text">∞ Unlimited</span>
                  ) : (
                    <input className="input !w-28" type="number" min="0" value={editing.features[key] ?? 0}
                      onChange={(e) => setEditing({
                        ...editing,
                        features: { ...editing.features, [key]: parseInt(e.target.value || 0, 10) },
                      })} />
                  )}
                  <button type="button" title="Toggle unlimited credits"
                    onClick={() => setEditing({
                      ...editing,
                      features: { ...editing.features, [key]: editing.features[key] === -1 ? 0 : -1 },
                    })}
                    className={`px-2.5 py-2 rounded-lg border text-xs font-bold transition ${
                      editing.features[key] === -1 ? 'border-brand text-brand bg-brand/10' : 'border-ink-700 text-slate-400 hover:border-brand/50'
                    }`}>
                    ∞
                  </button>
                </div>
              ))}

              <select className="input" value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button className="btn-brand flex-1" onClick={save}>Save package</button>
                <button className="px-5 py-2.5 rounded-xl border border-ink-700 text-slate-300 text-sm"
                  onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
