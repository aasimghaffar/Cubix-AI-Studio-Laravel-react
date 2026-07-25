import { useEffect, useState } from 'react'
import { Ban, CircleCheck, Coins, Search, UserPlus, BadgePlus, Pencil, MailCheck, Loader2, X } from 'lucide-react'
import { api } from '../../lib/api'
import Alert from '../../components/Alert'
import Portal from '../../components/Portal'

export default function Customers() {
  const [page, setPage] = useState(null)
  const [search, setSearch] = useState('')
  const [packages, setPackages] = useState([])
  const [modal, setModal] = useState(null) // {type: 'create'} | {type:'assign',user} | {type:'credits',user}
  const [error, setError] = useState('')

  const [informing, setInforming] = useState(null)
  const [flash, setFlash] = useState('')

  const load = (s = search) => api(`/admin/customers?search=${encodeURIComponent(s)}`).then(setPage)

  const informUser = async (u) => {
    setInforming(u.id)
    try {
      const { message } = await api(`/admin/customers/${u.id}/notify`, { method: 'POST' })
      setFlash(message)
      setTimeout(() => setFlash(''), 4000)
    } catch (e) {
      setFlash(e.message || 'Could not send the email.')
      setTimeout(() => setFlash(''), 5000)
    } finally {
      setInforming(null)
    }
  }

  useEffect(() => {
    load('')
    api('/admin/packages').then(setPackages)
  }, [])

  const close = () => { setModal(null); setError('') }

  const toggleBlock = async (u) => {
    if (!u.is_blocked && !confirm(`Block ${u.name}? They will be signed out and emailed (if enabled).`)) return
    await api(`/admin/customers/${u.id}/block`, { method: 'POST' })
    load()
  }

  const handle = async (fn) => {
    setError('')
    try { await fn(); close(); load() }
    catch (e) { setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Customers</h1>
        <button className="btn-brand" onClick={() => setModal({ type: 'create' })}>
          <UserPlus size={16} /> New customer
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        <input className="input !pl-10 pl-10" placeholder="Search name or email…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value) }} />
      </div>

      {flash && <Alert type="success" className="mb-4">{flash}</Alert>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-slate-400 border-b border-ink-700/60">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Package</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(page?.data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-ink-700/40 last:border-0">
                <td className="p-4">
                  <p className="text-white flex items-center gap-2">
                    {u.name}
                    {u.role === 'admin' && (
                      <span className="text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 text-ink-950 font-bold"
                        style={{ background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))' }}>Admin</span>
                    )}
                  </p>
                  <p className="text-slate-500 text-xs">{u.email}</p>
                </td>
                <td className="p-4 text-slate-300">
                  {u.active_subscription?.package?.name ?? <span className="text-slate-500">No plan</span>}
                </td>
                <td className="p-4">
                  {u.is_blocked ? (
                    <span className="text-red-400 text-sm">Blocked</span>
                  ) : (
                    <select
                      value={u.status ?? 'active'}
                      onChange={async (e) => {
                        await api(`/admin/customers/${u.id}/status`, { method: 'POST', body: { status: e.target.value } })
                        load()
                      }}
                      className={`bg-ink-800 border border-ink-700 rounded-lg px-2 py-1 text-xs ${u.status === 'pending' ? 'text-amber-400' : 'text-brand'}`}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                    </select>
                  )}
                </td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  <button title="Edit details" onClick={() => setModal({ type: 'edit', user: u })}
                    className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
                    <Pencil size={15} />
                  </button>
                  <button title="Email their current details" onClick={() => informUser(u)} disabled={informing === u.id}
                    className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand disabled:opacity-50">
                    {informing === u.id ? <Loader2 size={15} className="animate-spin" /> : <MailCheck size={15} />}
                  </button>
                  {u.role !== 'admin' && (
                    <>
                      <button title="Assign plan" onClick={() => setModal({ type: 'assign', user: u })}
                        className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
                        <BadgePlus size={15} />
                      </button>
                      <button title="Adjust credits" onClick={() => setModal({ type: 'credits', user: u })}
                        className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
                        <Coins size={15} />
                      </button>
                      <button title={u.is_blocked ? 'Unblock' : 'Block'} onClick={() => toggleBlock(u)}
                        className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400">
                        {u.is_blocked ? <CircleCheck size={15} /> : <Ban size={15} />}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && <CreateModal onClose={close} onSave={handle} error={error} />}
      {modal?.type === 'edit' && (
        <EditUserModal user={modal.user} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}
      {modal?.type === 'assign' && <AssignModal user={modal.user} packages={packages} onClose={close} onSave={handle} error={error} />}
      {modal?.type === 'credits' && <CreditsModal user={modal.user} onClose={close} onSave={handle} error={error} />}
    </div>
  )
}

function Shell({ title, subtitle, children, onClose }) {
  return (
    <Portal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card p-7 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-semibold text-white mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mb-5">{subtitle}</p>}
        {children}
      </div>
    </div>
    </Portal>
  )
}

function CreateModal({ onClose, onSave, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  return (
    <Shell title="New customer" subtitle="A welcome email is sent automatically (if enabled in Settings)." onClose={onClose}>
      <div className="space-y-4">
        <input className="input" placeholder="Full name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="text" placeholder="Password (min 8 characters)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-brand w-full"
          onClick={() => onSave(() => api('/admin/customers', { method: 'POST', body: form }))}>
          Create customer
        </button>
      </div>
    </Shell>
  )
}

function AssignModal({ user, packages, onClose, onSave, error }) {
  const [form, setForm] = useState({ package_id: packages[0]?.id ?? '', months: 1 })
  return (
    <Shell title="Assign a plan" subtitle={`${user.name} — replaces any current plan, no payment required.`} onClose={onClose}>
      <div className="space-y-4">
        <select className="input" value={form.package_id}
          onChange={(e) => setForm({ ...form, package_id: e.target.value })}>
          {packages.filter((p) => p.status === 'active').map((p) => (
            <option key={p.id} value={p.id}>{p.name} — ${p.price}/{p.billing_cycle === 'yearly' ? 'yr' : 'mo'}</option>
          ))}
        </select>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Duration (months)</label>
          <input className="input" type="number" min="1" max="36" value={form.months}
            onChange={(e) => setForm({ ...form, months: parseInt(e.target.value || 1, 10) })} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-brand w-full"
          onClick={() => onSave(() => api(`/admin/customers/${user.id}/assign-plan`, { method: 'POST', body: form }))}>
          Assign plan
        </button>
      </div>
    </Shell>
  )
}

function CreditsModal({ user, onClose, onSave, error }) {
  const [form, setForm] = useState({ feature_key: 'image_generation_credits', bonus: 10 })
  return (
    <Shell title="Adjust credits" subtitle={`${user.name} — bonus applies to the current cycle. Negative reduces.`} onClose={onClose}>
      <div className="space-y-4">
        <select className="input" value={form.feature_key}
          onChange={(e) => setForm({ ...form, feature_key: e.target.value })}>
          <option value="image_generation_credits">Image credits</option>
          <option value="content_writer_credits">Content writer credits</option>
          <option value="translation_credits">Translation credits</option>
          <option value="document_query_credits">Document query credits</option>
          <option value="background_removal_credits">Background removal credits</option>
          <option value="audio_character_limit">Audio characters</option>
        </select>
        <input className="input" type="number" value={form.bonus}
          onChange={(e) => setForm({ ...form, bonus: parseInt(e.target.value || 0, 10) })} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-brand w-full"
          onClick={() => onSave(() => api(`/admin/customers/${user.id}/credits`, { method: 'POST', body: form }))}>
          Apply
        </button>
      </div>
    </Shell>
  )
}


/**
 * Edit a user's sign-in details. Admin accounts must supply their CURRENT
 * password to set a new one, which in practice means an admin can only reset
 * their own password here — customer passwords an admin can reset directly.
 */
function EditUserModal({ user, onClose, onSaved }) {
  const isAdmin = user.role === 'admin'
  const [first = '', ...rest] = (user.name ?? '').split(' ')
  const [form, setForm] = useState({
    first_name: first,
    last_name: rest.join(' '),
    email: user.email ?? '',
    password: '',
    current_password: '',
    notify: true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (patch) => { setForm({ ...form, ...patch }); setError('') }

  const save = async () => {
    setBusy(true); setError('')
    try {
      await api(`/admin/customers/${user.id}`, { method: 'PUT', body: form })
      onSaved()
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : (e.message || 'Could not save.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/70 backdrop-blur-md"
        onClick={() => !busy && onClose()}>
        <div className="relative card gradient-ring p-7 w-full max-w-md animate-pop-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} disabled={busy} aria-label="Close"
            className="absolute z-20 top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
            <X size={18} />
          </button>

          <h2 className="font-display font-semibold text-white text-lg">Edit account</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {isAdmin ? 'Administrator account' : 'Customer account'} · {user.email}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">First name</label>
                <input className="input" value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Last name</label>
                <input className="input" value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Email address</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </div>

            {isAdmin && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Current password <span className="text-slate-600">(required to change an admin password)</span>
                </label>
                <input className="input" type="password" autoComplete="current-password"
                  value={form.current_password} onChange={(e) => set({ current_password: e.target.value })} />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                New password <span className="text-slate-600">(leave empty to keep the current one)</span>
              </label>
              <input className="input" type="password" autoComplete="new-password" placeholder="At least 8 characters"
                value={form.password} onChange={(e) => set({ password: e.target.value })} />
            </div>

            <label className="flex items-start gap-2.5 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.notify} className="accent-[rgb(var(--brand))] mt-0.5"
                onChange={(e) => set({ notify: e.target.checked })} />
              <span>
                Inform the user by email
                <span className="block text-[11px] text-slate-500">
                  Sends their updated details{form.password ? ', including the new password' : ''}.
                </span>
              </span>
            </label>
          </div>

          {error && <Alert type="error" className="mt-4">{error}</Alert>}

          <div className="flex gap-2 mt-6">
            <button onClick={onClose} disabled={busy}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-ink-700 text-slate-300 hover:border-brand/60 transition">
              Cancel
            </button>
            <button onClick={save} disabled={busy} className="btn-brand flex-1">
              {busy ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
