import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus, CornerDownRight, GripVertical } from 'lucide-react'
import { api } from '../../lib/api'
import Portal from '../../components/Portal'

const CORE_ROUTES = [
  { label: 'Home', target: '/' },
  { label: 'Tools', target: '/tools' },
  { label: 'Pricing', target: '/pricing' },
  { label: 'Contact', target: '/contact' },
]

export default function MenuManager() {
  const [menu, setMenu] = useState([])
  const [pages, setPages] = useState([])
  const [adding, setAdding] = useState(false)

  const load = () => api('/admin/menu').then(setMenu)

  useEffect(() => {
    load()
    api('/admin/pages').then(setPages).catch(() => {})
  }, [])

  const [dragId, setDragId] = useState(null)

  /** Drop item `dragId` in place of `overItem` (same parent level). */
  const dropOn = async (overItem, parentId) => {
    if (!dragId || dragId === overItem.id) { setDragId(null); return }
    const siblings = (parentId
      ? (menu.find((m) => m.id === parentId)?.children ?? [])
      : menu
    ).filter((s) => s.id !== dragId)
    const overIndex = siblings.findIndex((s) => s.id === overItem.id)
    const dragged = flatAll().find((s) => s.id === dragId)
    if (!dragged) { setDragId(null); return }
    siblings.splice(overIndex, 0, dragged)

    await api('/admin/menu/reorder', { method: 'POST', body: {
      items: siblings.map((s, i) => ({ id: s.id, sort_order: i + 1, parent_id: parentId ?? null })),
    }}).catch((e) => alert(e.message))
    setDragId(null)
    load()
  }

  const flatAll = () => menu.flatMap((m) => [m, ...(m.children ?? [])])

  const update = async (item, body) => { await api(`/admin/menu/${item.id}`, { method: 'PUT', body }).catch((e) => alert(e.message)); load() }
  const move = async (item, direction) => { await api(`/admin/menu/${item.id}/move`, { method: 'POST', body: { direction } }); load() }
  const remove = async (item) => {
    if (!confirm(`Remove "${item.label}" from the menu? (Pages themselves are not deleted.)`)) return
    await api(`/admin/menu/${item.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Menu</h1>
      <p className="text-slate-400 text-sm mb-8">
        Build the site navigation like in WordPress: add core pages, your own pages, or custom
        links; drag rows by the grip to reorder (or use the arrows); nest an item under another to create a dropdown submenu.
      </p>

      <div className="flex justify-end mb-4">
        <button className="btn-brand !py-2" onClick={() => setAdding(true)}><Plus size={15} /> Add menu item</button>
      </div>

      <div className="space-y-2">
        {menu.map((item) => (
          <div key={item.id}>
            <MenuRow item={item} menu={menu} onUpdate={update} onMove={move} onRemove={remove}
              dragProps={{
                draggable: true,
                onDragStart: () => setDragId(item.id),
                onDragOver: (e) => e.preventDefault(),
                onDrop: () => dropOn(item, null),
              }}
              dragging={dragId === item.id} />
            {(item.children ?? []).map((child) => (
              <div key={child.id} className="ml-8 mt-2 flex items-start gap-2">
                <CornerDownRight size={15} className="text-slate-600 mt-4 shrink-0" />
                <div className="flex-1">
                  <MenuRow item={child} menu={menu} onUpdate={update} onMove={move} onRemove={remove} isChild
                    dragProps={{
                      draggable: true,
                      onDragStart: () => setDragId(child.id),
                      onDragOver: (e) => e.preventDefault(),
                      onDrop: () => dropOn(child, item.id),
                    }}
                    dragging={dragId === child.id} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {adding && (
        <AddModal pages={pages} menu={menu}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); load() }} />
      )}
    </div>
  )
}

function MenuRow({ item, menu, onUpdate, onMove, onRemove, isChild = false, dragProps = {}, dragging = false }) {
  const parents = menu.filter((m) => m.id !== item.id)

  return (
    <div {...dragProps}
      className={`card p-3 flex flex-wrap items-center gap-2 transition ${dragging ? 'opacity-40 border-brand/60' : ''}`}>
      <GripVertical size={15} className="text-slate-500 shrink-0 cursor-grab active:cursor-grabbing" title="Drag to reorder" />
      <input className="input !w-40 !py-1.5 text-sm" defaultValue={item.label}
        onBlur={(e) => e.target.value !== item.label && onUpdate(item, { label: e.target.value })} />
      <span className="text-xs text-slate-500 flex-1 min-w-24 truncate">
        {item.type === 'page' ? `page: /p/${item.target}` : item.target}
      </span>

      {/* Nest under… (top-level items without children only) */}
      {!isChild && (item.children ?? []).length === 0 && (
        <select className="input !w-36 !py-1.5 text-xs" value=""
          onChange={(e) => e.target.value && onUpdate(item, { parent_id: parseInt(e.target.value, 10) })}>
          <option value="">Nest under…</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      )}
      {isChild && (
        <button className="text-xs text-slate-400 hover:text-brand" onClick={() => onUpdate(item, { parent_id: null })}>
          Un-nest
        </button>
      )}

      <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-brand" onClick={() => onMove(item, 'up')}><ArrowUp size={13} /></button>
      <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-brand" onClick={() => onMove(item, 'down')}><ArrowDown size={13} /></button>
      <button
        onClick={() => onUpdate(item, { enabled: !item.enabled })}
        className={`w-20 text-center text-[11px] uppercase tracking-wider rounded-full px-2 py-1.5 border ${item.enabled ? 'text-brand border-brand/40' : 'text-slate-500 border-ink-700'}`}>
        {item.enabled ? 'Shown' : 'Hidden'}
      </button>
      <button className="p-1.5 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400" onClick={() => onRemove(item)}><Trash2 size={13} /></button>
    </div>
  )
}

function AddModal({ pages, menu, onClose, onSaved }) {
  const [type, setType] = useState('page')
  const [form, setForm] = useState({ label: '', target: '', parent_id: '' })
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    let target = form.target
    let label = form.label

    if (type === 'core') {
      const core = CORE_ROUTES.find((c) => c.target === form.target)
      if (!core) { setError('Pick a core page.'); return }
      label = label || core.label
    }
    if (type === 'page') {
      const page = pages.find((p) => p.slug === form.target)
      if (!page) { setError('Pick a page.'); return }
      label = label || page.title
    }
    if (type === 'link' && !/^https?:\/\//i.test(target)) { setError('Custom links must start with http:// or https://'); return }
    if (!label) { setError('Give the item a label.'); return }

    try {
      await api('/admin/menu', { method: 'POST', body: {
        label, type, target, parent_id: form.parent_id || null,
      }})
      onSaved()
    } catch (e) { setError(e.message) }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="card p-7 w-full max-w-md animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-semibold text-white mb-5">Add menu item</h2>

        <div className="flex rounded-xl border border-ink-700 overflow-hidden mb-4">
          {[['page', 'Site page'], ['core', 'Core page'], ['link', 'Custom link']].map(([v, l]) => (
            <button key={v} onClick={() => { setType(v); setForm({ ...form, target: '' }) }}
              className={`flex-1 px-3 py-2 text-xs ${type === v ? 'bg-brand text-ink-950 font-semibold' : 'text-slate-300 hover:bg-ink-800'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {type === 'page' && (
            <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="">Choose a page…</option>
              {pages.map((p) => <option key={p.id} value={p.slug}>{p.title}</option>)}
            </select>
          )}
          {type === 'core' && (
            <select className="input" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
              <option value="">Choose a core page…</option>
              {CORE_ROUTES.map((c) => <option key={c.target} value={c.target}>{c.label}</option>)}
            </select>
          )}
          {type === 'link' && (
            <input className="input" placeholder="https://example.com" value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })} />
          )}
          <input className="input" placeholder="Label (shown in the menu)" value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <select className="input" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">Top level</option>
            {menu.map((m) => <option key={m.id} value={m.id}>Inside "{m.label}"</option>)}
          </select>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-brand w-full" onClick={save}>Add to menu</button>
        </div>
      </div>
    </div>
    </Portal>
  )
}
