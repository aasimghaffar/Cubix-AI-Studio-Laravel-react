import { useEffect, useState } from 'react'
import { CheckCircle2, ImageUp, Loader2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import SettingsForm from '../../components/admin/SettingsForm'


const THEME_SECTIONS = [
  { title: 'Theme & colors', note: 'Give visitors a dark/light switch, and optionally set your own background and text colors for each mode. Leave a color empty to use the built-in design.', keys: [
    { key: 'theme_toggle_enabled', label: 'Show the dark / light mode switch to visitors', type: 'toggle' },
    { key: 'theme_dark_bg', label: 'Dark mode — background color', type: 'color' },
    { key: 'theme_dark_text', label: 'Dark mode — text color', type: 'color' },
    { key: 'theme_light_bg', label: 'Light mode — background color', type: 'color' },
    { key: 'theme_light_text', label: 'Light mode — text color', type: 'color' },
  ]},
]

const HEADER_STYLES = [
  {
    value: 'classic', label: 'Classic', hint: 'Logo left, menu center, buttons right',
    preview: (
      <div className="flex items-center justify-between px-3 h-full">
        <span className="w-8 h-2.5 rounded bg-brand/80" />
        <span className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="w-6 h-1.5 rounded bg-ink-700" />)}</span>
        <span className="w-10 h-3 rounded bg-brand/50" />
      </div>
    ),
  },
  {
    value: 'centered', label: 'Centered', hint: 'Logo centered, menu underneath',
    preview: (
      <div className="flex flex-col items-center justify-center gap-1.5 h-full">
        <span className="w-10 h-2.5 rounded bg-brand/80" />
        <span className="flex gap-1.5">{[0,1,2,3].map(i => <span key={i} className="w-5 h-1.5 rounded bg-ink-700" />)}</span>
      </div>
    ),
  },
  {
    value: 'minimal', label: 'Minimal', hint: 'Logo left, everything else right',
    preview: (
      <div className="flex items-center justify-between px-3 h-full">
        <span className="w-8 h-2.5 rounded bg-brand/80" />
        <span className="flex gap-1.5 items-center">
          {[0,1,2].map(i => <span key={i} className="w-5 h-1.5 rounded bg-ink-700" />)}
          <span className="w-8 h-3 rounded bg-brand/50" />
        </span>
      </div>
    ),
  },
]

const FOOTER_STYLES = [
  {
    value: 'simple', label: 'Simple', hint: 'One row: brand left, links right',
    preview: (
      <div className="flex items-center justify-between px-3 h-full">
        <span className="w-10 h-2 rounded bg-brand/60" />
        <span className="flex gap-1.5">{[0,1,2].map(i => <span key={i} className="w-5 h-1.5 rounded bg-ink-700" />)}</span>
      </div>
    ),
  },
  {
    value: 'columns', label: 'Columns', hint: 'Brand blurb + link columns',
    preview: (
      <div className="grid grid-cols-3 gap-2 px-3 py-2 h-full">
        <div className="space-y-1"><span className="block w-8 h-2 rounded bg-brand/60" /><span className="block w-full h-1 rounded bg-ink-700" /><span className="block w-3/4 h-1 rounded bg-ink-700" /></div>
        <div className="space-y-1">{[0,1,2].map(i => <span key={i} className="block w-2/3 h-1 rounded bg-ink-700" />)}</div>
        <div className="space-y-1">{[0,1,2].map(i => <span key={i} className="block w-2/3 h-1 rounded bg-ink-700" />)}</div>
      </div>
    ),
  },
  {
    value: 'minimal', label: 'Minimal', hint: 'Single centered line',
    preview: (
      <div className="grid place-items-center h-full">
        <span className="w-16 h-1.5 rounded bg-ink-700" />
      </div>
    ),
  },
]

export default function Appearance() {
  const [values, setValues] = useState({ brand_name: '', brand_color: '', header_style: 'classic', footer_style: 'simple' })
  const [logo, setLogo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/branding').then((b) => {
      setValues({
        brand_name: b.brand_name ?? '',
        brand_color: b.brand_color ?? '#0ea5a4',
        header_style: b.header_style ?? 'classic',
        footer_style: b.footer_style ?? 'simple',
      })
      setLogo(b.brand_logo)
    }).catch(() => {})
  }, [])

  const save = async () => {
    setBusy(true); setSaved(false); setError('')
    try {
      await api('/admin/settings', {
        method: 'PUT',
        body: {
          settings: Object.entries(values).map(([key, value]) => ({ key, value, group: 'branding' })),
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const uploadLogo = async (file) => {
    if (!file) return
    setLogoBusy(true); setError('')
    try {
      const form = new FormData()
      form.append('logo', file)
      const res = await api('/admin/settings/logo', { method: 'POST', body: form, isForm: true })
      setLogo(res.brand_logo)
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setLogoBusy(false)
    }
  }

  const removeLogo = async () => {
    setLogoBusy(true)
    await api('/admin/settings/logo/remove', { method: 'POST' }).catch(() => {})
    setLogo(null)
    setLogoBusy(false)
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Appearance</h1>
      <p className="text-slate-400 text-sm mb-8">
        Branding and layout of the customer-facing site. Changes apply after visitors refresh.
      </p>

      <div className="card p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-4">Branding</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Brand name</label>
            <input className="input" value={values.brand_name}
              onChange={(e) => setValues({ ...values, brand_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Brand color</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={values.brand_color}
                onChange={(e) => setValues({ ...values, brand_color: e.target.value })}
                className="h-10 w-14 rounded-lg bg-ink-800 border border-ink-700 cursor-pointer" />
              <input className="input" value={values.brand_color}
                onChange={(e) => setValues({ ...values, brand_color: e.target.value })} placeholder="#0ea5a4" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Site logo</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-16 w-40 rounded-xl bg-ink-800 border border-ink-700 grid place-items-center overflow-hidden shrink-0">
                {logo
                  ? <img src={logo} alt="Site logo" className="max-h-12 max-w-[140px] object-contain" />
                  : <span className="text-xs text-slate-500">No logo yet</span>}
              </div>
              <div className="flex gap-2">
                <label className="btn-ghost cursor-pointer">
                  {logoBusy ? <Loader2 size={15} className="animate-spin" /> : <ImageUp size={15} />} Upload logo
                  <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => uploadLogo(e.target.files?.[0])} />
                </label>
                {logo && (
                  <button onClick={removeLogo} className="btn-ghost !px-3" title="Remove logo">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StylePicker
        title="Header style"
        options={HEADER_STYLES}
        value={values.header_style}
        onChange={(v) => setValues({ ...values, header_style: v })}
      />

      <StylePicker
        title="Footer style"
        options={FOOTER_STYLES}
        value={values.footer_style}
        onChange={(v) => setValues({ ...values, footer_style: v })}
      />

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      <button className="btn-brand" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save appearance'}
      </button>
      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Theme & colors</h2>
        <SettingsForm sections={THEME_SECTIONS} />
      </section>
    </div>
  )
}

function StylePicker({ title, options, value, onChange }) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="font-display font-semibold text-white mb-4">{title}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {options.map((opt) => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`relative rounded-xl border p-3 text-left transition ${
              value === opt.value ? 'border-brand bg-brand/5' : 'border-ink-700 hover:border-ink-700/30 hover:border-brand/40'
            }`}>
            {value === opt.value && <CheckCircle2 size={16} className="absolute top-2.5 right-2.5 text-brand" />}
            <div className="h-14 rounded-lg bg-ink-950/70 border border-ink-700/60 mb-3 overflow-hidden">
              {opt.preview}
            </div>
            <p className="text-sm font-medium text-white">{opt.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
