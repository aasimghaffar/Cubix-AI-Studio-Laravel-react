import { useEffect, useState } from 'react'
import { Globe, Plus, Trash2, Pencil, X, FileUp , Wand2 } from 'lucide-react'
import { api } from '../../lib/api'
import Portal from '../../components/Portal'

const SWITCHER_POSITIONS = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'both', label: 'Header + footer' },
  { value: 'float', label: 'Floating round button' },
  { value: 'off', label: 'Disabled (hide switcher)' },
]

export default function Languages() {
  const [languages, setLanguages] = useState([])
  const [position, setPosition] = useState('header')
  const [modal, setModal] = useState(null) // {type:'add'} | {type:'edit', lang}
  const [saved, setSaved] = useState(false)

  const load = () => api('/admin/languages').then(setLanguages)

  useEffect(() => {
    load()
    api('/branding').then((b) => setPosition(b.language_switcher ?? 'header'))
  }, [])

  const [translating, setTranslating] = useState(null)

  const autoTranslate = async (lang) => {
    setTranslating(lang.id)
    try {
      const res = await api(`/admin/languages/${lang.id}/auto-translate`, { method: 'POST' })
      alert(res.message)
      load()
    } catch (e) {
      alert('Auto-translate failed: ' + e.message + '\n(The server needs internet access for this.)')
    } finally {
      setTranslating(null)
    }
  }

  const toggle = async (lang) => {
    await api(`/admin/languages/${lang.id}`, { method: 'PUT', body: { enabled: !lang.enabled } })
      .catch((e) => alert(e.message))
    load()
  }

  const remove = async (lang) => {
    if (!confirm(`Delete "${lang.name}"?`)) return
    await api(`/admin/languages/${lang.id}`, { method: 'DELETE' })
    load()
  }

  const savePosition = async (value) => {
    setPosition(value)
    await api('/admin/settings', {
      method: 'PUT',
      body: { settings: [{ key: 'language_switcher', value, group: 'languages' }] },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Languages</h1>
      <p className="text-slate-400 text-sm mb-6">
        Choose which languages visitors can switch to, where the switcher appears, and add
        your own languages. English is the fallback and can't be disabled.
      </p>

      {/* Automatic whole-site translation */}
      <div className="card gradient-ring p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-1">Automatic translation — no files needed</h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Every language below has an <strong className="text-slate-300">Auto-translate</strong> button: one click
          machine-translates <strong className="text-slate-300">the entire site</strong> into that language and saves it —
          nothing to edit by hand. When you rename a tool or change its description, enabled languages are
          re-translated automatically too. New languages you add are filled in the same way.
          (Advanced: you can still download the full text as a file below, polish any wording, and upload it back —
          your edits are kept.)
        </p>
        <button className="btn-ghost !py-2 text-xs"
          onClick={async () => {
            const data = await api('/admin/languages/template')
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'translation-template.json'
            a.click()
            URL.revokeObjectURL(a.href)
          }}>
          Download all site text (optional)
        </button>
      </div>

      <div className="card p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-1">Language switcher placement</h2>
        <p className="text-xs text-slate-500 mb-4">Where the <Globe size={11} className="inline" /> language icon appears on the site {saved && <span className="text-brand">— saved ✓</span>}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SWITCHER_POSITIONS.map((opt) => (
            <button key={opt.value} onClick={() => savePosition(opt.value)}
              className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                position === opt.value ? 'border-brand bg-brand/10 text-brand' : 'border-ink-700 text-slate-300 hover:border-brand/40'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-semibold text-white">Available languages</h2>
        <div className="flex gap-2">
          <label className="btn-ghost !py-2 cursor-pointer">
            <FileUp size={15} /> Upload language file
            <input type="file" accept=".json,application/json" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  try {
                    const data = JSON.parse(reader.result)
                    // Accept either a plain {key: text} map, or a full
                    // {code, name, native_name, dir, translations} language file.
                    const isFull = data.translations && typeof data.translations === 'object'
                    setModal({
                      type: 'add',
                      preset: {
                        code: isFull ? (data.code ?? '') : '',
                        name: isFull ? (data.name ?? '') : '',
                        native_name: isFull ? (data.native_name ?? '') : '',
                        dir: isFull ? (data.dir ?? 'ltr') : 'ltr',
                        translations: isFull ? data.translations : data,
                      },
                    })
                  } catch {
                    alert('That file is not valid JSON. Export a language, edit it, and upload it again.')
                  }
                  e.target.value = ''
                }
                reader.readAsText(file)
              }} />
          </label>
          <button className="btn-brand !py-2" onClick={() => setModal({ type: 'add' })}><Plus size={15} /> Add language</button>
        </div>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => (
          <div key={lang.id} className="card p-4 flex items-center gap-4">
            <span className="font-display font-bold text-brand w-10 uppercase">{lang.code}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">{lang.name} <span className="text-slate-500">· {lang.native_name}</span></p>
              <p className="text-xs text-slate-500">
                {lang.dir.toUpperCase()} · {(() => {
                  const total = Object.keys(languages.find((l) => l.code === 'en')?.translations ?? {}).length
                  const n = Object.keys(lang.translations ?? {}).length
                  if (lang.code === 'en' || !total) return `${n} strings`
                  return n >= total ? `${n} strings · fully translated ✓` : `${n} of ${total} translated`
                })()} {lang.is_custom && '· custom'}
              </p>
            </div>
            {lang.code !== 'en' && (
              <button onClick={() => autoTranslate(lang)} disabled={translating !== null}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-brand/40 text-brand hover:bg-brand/10 transition disabled:opacity-50">
                <Wand2 size={13} />
                {translating === lang.id ? 'Translating…' : 'Auto-translate'}
              </button>
            )}
            <button title="Download as file (edit offline, upload again)"
              onClick={() => {
                const blob = new Blob([JSON.stringify({
                  code: lang.code, name: lang.name, native_name: lang.native_name,
                  dir: lang.dir, translations: lang.translations,
                }, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `language-${lang.code}.json`
                a.click()
                URL.revokeObjectURL(a.href)
              }}
              className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
              <FileUp size={14} className="rotate-180" />
            </button>
            <button title="Edit translations" onClick={() => setModal({ type: 'edit', lang })}
              className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
              <Pencil size={14} />
            </button>
            {lang.is_custom && (
              <button title="Delete" onClick={() => remove(lang)}
                className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={() => toggle(lang)} disabled={lang.code === 'en'}
              className={`w-24 text-center text-xs uppercase tracking-wider rounded-full px-3 py-1.5 border transition disabled:opacity-50 ${
                lang.enabled ? 'text-brand border-brand/40' : 'text-slate-500 border-ink-700'
              }`}>
              {lang.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <LanguageModal
          lang={modal.type === 'edit' ? modal.lang : null}
          preset={modal.preset}
          english={languages.find((l) => l.code === 'en')}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

function LanguageModal({ lang, preset, english, onClose, onSaved }) {
  const isEdit = !!lang
  const [form, setForm] = useState({
    code: lang?.code ?? preset?.code ?? '',
    name: lang?.name ?? preset?.name ?? '',
    native_name: lang?.native_name ?? preset?.native_name ?? '',
    dir: lang?.dir ?? preset?.dir ?? 'ltr',
  })
  // Start custom languages from the uploaded file or the English dictionary.
  const [json, setJson] = useState(JSON.stringify(lang?.translations ?? preset?.translations ?? english?.translations ?? {}, null, 2))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true); setError('')
    let translations
    try {
      translations = JSON.parse(json)
    } catch {
      setError('Translations must be valid JSON (check for a missing comma or quote).')
      setBusy(false)
      return
    }
    try {
      if (isEdit) {
        await api(`/admin/languages/${lang.id}`, { method: 'PUT', body: { ...form, translations } })
      } else {
        await api('/admin/languages', { method: 'POST', body: { ...form, translations } })
      }
      onSaved()
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative card p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800">
          <X size={18} />
        </button>
        <h2 className="font-display font-semibold text-white mb-1">{isEdit ? `Edit ${lang.name}` : 'Add a language'}</h2>
        <p className="text-sm text-slate-400 mb-5">
          {isEdit
            ? 'Edit the translated strings below. Missing keys fall back to English automatically.'
            : 'The translations start as a copy of English — translate each value on the right side of the colons.'}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <input className="input" placeholder="Code (e.g. de, tr, ur)" value={form.code} disabled={isEdit}
            onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} />
          <select className="input" value={form.dir} onChange={(e) => setForm({ ...form, dir: e.target.value })}>
            <option value="ltr">Left to right (LTR)</option>
            <option value="rtl">Right to left (RTL)</option>
          </select>
          <input className="input" placeholder="English name (e.g. German)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Native name (e.g. Deutsch)" value={form.native_name}
            onChange={(e) => setForm({ ...form, native_name: e.target.value })} />
        </div>

        <label className="block text-sm text-slate-300 mb-1.5">Translations (key → text)</label>
        <textarea className="input font-mono !text-xs min-h-64" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        <button className="btn-brand w-full mt-4" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add language'}
        </button>
      </div>
    </div>
    </Portal>
  )
}
