import { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import RichEditor from '../../components/admin/RichEditor'
import Portal from '../../components/Portal'

export default function Pages() {
  const [pages, setPages] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [layout, setLayout] = useState('narrow')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => api('/admin/pages').then((p) => {
    setPages(p)
    if (!selected && p.length) select(p[0])
  })

  useEffect(() => { load() }, [])

  const select = (page) => {
    setSelected(page)
    setTitle(page.title)
    setContent(page.content ?? '')
    setLayout(page.layout ?? 'narrow')
    setSaved(false)
  }

  const save = async () => {
    setBusy(true); setSaved(false)
    const updated = await api(`/admin/pages/${selected.id}`, { method: 'PUT', body: { title, content, layout } })
    setBusy(false); setSaved(true)
    setPages((p) => p.map((x) => x.id === updated.id ? updated : x))
    setTimeout(() => setSaved(false), 2500)
  }

  const create = async () => {
    const name = prompt('Page title:')
    if (!name) return
    try {
      const page = await api('/admin/pages', { method: 'POST', body: { title: name, content: `<h2>${name}</h2><p>Write your content here…</p>` } })
      await load()
      select(page)
    } catch (e) { alert(e.message) }
  }

  const togglePublish = async (page) => {
    const updated = await api(`/admin/pages/${page.id}`, { method: 'PUT', body: { published: !page.published } })
    setPages((p) => p.map((x) => x.id === updated.id ? updated : x))
    if (selected?.id === updated.id) setSelected(updated)
  }

  const remove = async (page) => {
    if (!confirm(`Delete "${page.title}"? It will also be removed from the menu.`)) return
    try {
      await api(`/admin/pages/${page.id}`, { method: 'DELETE' })
      setSelected(null)
      load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Pages</h1>
      <p className="text-slate-400 text-sm mb-8">
        Terms, Privacy Policy, and any custom pages. Style the text with the toolbar — headings,
        bullet points, font sizes, links, and open/close sections. Add pages to the navigation
        from the <strong className="text-slate-300">Menu</strong> tab.
      </p>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Page list */}
        <div className="card p-3">
          {pages.map((page) => (
            <div key={page.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer ${selected?.id === page.id ? 'bg-brand/10 text-brand' : 'text-slate-300 hover:bg-ink-800'}`}
              onClick={() => select(page)}>
              <FileText size={15} className="shrink-0" />
              <span className="flex-1 text-sm truncate">{page.title}</span>
              {!page.published && <EyeOff size={13} className="text-slate-500" title="Hidden" />}
            </div>
          ))}
          <button onClick={create} className="w-full mt-2 btn-ghost !py-2 text-sm"><Plus size={15} /> New page</button>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input className="input flex-1 !w-auto min-w-40 font-display font-semibold"
                value={title} onChange={(e) => setTitle(e.target.value)} />
              <select value={layout} onChange={(e) => { setLayout(e.target.value); setSaved(false) }}
                title="Page width"
                className="bg-ink-800 border border-ink-700 rounded-xl px-3 py-2.5 text-sm text-slate-200">
                <option value="narrow">Narrow — reading width (Terms, Privacy)</option>
                <option value="wide">Wide — landing width (FAQ, features)</option>
                <option value="full">Full width — edge to edge</option>
              </select>
              <a href={`/p/${selected.slug}`} target="_blank" rel="noreferrer"
                className="btn-ghost !py-2 text-xs" title="View on site">
                <ExternalLink size={14} /> /p/{selected.slug}
              </a>
              <button onClick={() => togglePublish(selected)} className="btn-ghost !py-2 text-xs">
                {selected.published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
              </button>
              {!selected.is_system && (
                <button onClick={() => remove(selected)} className="btn-ghost !py-2 text-xs hover:!text-red-400">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <RichEditor key={selected.id} value={content} onChange={setContent} />

            <button className="btn-brand" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save page'}
            </button>
          </div>
        ) : (
          <div className="card p-14 text-center text-slate-500 text-sm">Select a page to edit.</div>
        )}
      </div>
    </div>
  )
}
