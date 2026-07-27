import { useEffect, useState } from 'react'
import { Check, CheckCircle2, ImageUp, Loader2, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { LoaderArt } from '../../components/SiteLoader'

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
  const [values, setValues] = useState({
    brand_name: '', brand_color: '', header_style: 'classic', footer_style: 'columns',
    theme_toggle_enabled: '1', theme_dark_bg: '', theme_dark_text: '',
    theme_light_bg: '', theme_light_text: '',
    loader_enabled: '1', loader_style: 'neural',
  })
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
        footer_style: b.footer_style ?? 'columns',
        theme_toggle_enabled: b.theme_toggle === false ? '0' : '1',
        theme_dark_bg: b.theme_colors?.dark_bg ?? '',
        theme_dark_text: b.theme_colors?.dark_text ?? '',
        theme_light_bg: b.theme_colors?.light_bg ?? '',
        theme_light_text: b.theme_colors?.light_text ?? '',
        loader_enabled: (b.loader_enabled === '1' || b.loader_enabled === true) ? '1' : '0',
        loader_style: b.loader_style ?? 'neural',
      })
      setLogo(b.brand_logo)
    }).catch(() => {})
  }, [])

  const set = (patch) => { setValues((v) => ({ ...v, ...patch })); setSaved(false) }

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

      {/* ── Theme & colors ── */}
      <div className="card p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-1">Theme & colors</h2>
        <p className="text-xs text-slate-500 mb-5">
          Give visitors a dark/light switch, and optionally set your own background and
          text colors for each mode. Leave a color empty to use the built-in design.
        </p>

        <label className="flex items-start gap-2.5 cursor-pointer mb-5">
          <input type="checkbox" className="accent-[rgb(var(--brand))] mt-0.5"
            checked={values.theme_toggle_enabled === '1'}
            onChange={(e) => set({ theme_toggle_enabled: e.target.checked ? '1' : '0' })} />
          <span className="text-sm text-slate-200">Show the dark / light mode switch to visitors</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['theme_dark_bg', 'Dark mode — background color'],
            ['theme_dark_text', 'Dark mode — text color'],
            ['theme_light_bg', 'Light mode — background color'],
            ['theme_light_text', 'Light mode — text color'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-11 h-11 rounded-lg bg-transparent border border-ink-700 cursor-pointer p-1"
                  value={values[key] || '#0b1220'} onChange={(e) => set({ [key]: e.target.value })} />
                <input className="input flex-1" placeholder="Leave empty for the default"
                  value={values[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} />
                {values[key] && (
                  <button type="button" title="Clear" onClick={() => set({ [key]: '' })}
                    className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Loader ── */}
      <div className="card p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-1">Loader</h2>
        <p className="text-xs text-slate-500 mb-5">
          An optional splash screen shown while the site loads. It appears once per
          visit, fades out on its own, and never delays the page by more than a moment.
        </p>
        <LoaderPicker
          enabled={values.loader_enabled === '1'}
          style={values.loader_style}
          onChange={(patch) => set(patch)}
        />
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* One save button for the whole page */}
      <div className="sticky bottom-4 z-10">
        <button className="btn-brand !px-8 shadow-2xl" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save appearance'}
        </button>
      </div>
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


/** Live, animated previews so the admin picks by eye rather than by name.
 *  Fully controlled — the parent owns the values and the single save button. */
function LoaderPicker({ enabled, style, onChange }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 cursor-pointer mb-6">
        <input type="checkbox" checked={enabled} className="accent-[rgb(var(--brand))] mt-0.5"
          onChange={(e) => onChange({ loader_enabled: e.target.checked ? '1' : '0' })} />
        <span>
          <span className="block text-sm text-white">Show the loading screen</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Turn this off and visitors go straight to the site.
          </span>
        </span>
      </label>

      <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Choose a style</p>
      <div className={`grid sm:grid-cols-2 xl:grid-cols-3 gap-4 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
        {LOADER_STYLES.map((opt) => (
          <button key={opt.id} type="button"
            onClick={() => onChange({ loader_style: opt.id })}
            className={`relative rounded-2xl border-2 p-4 text-left transition ${
              style === opt.id ? 'border-brand bg-brand/5' : 'border-ink-700 hover:border-brand/50'
            }`}>
            {style === opt.id && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full grid place-items-center text-ink-950 z-10"
                style={{ background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))' }}>
                <Check size={12} />
              </span>
            )}
            {/* the real animation, running live */}
            <div className="rounded-xl bg-ink-950/70 grid place-items-center h-40 mb-3 overflow-hidden">
              <div className="scale-[0.72]">
                <LoaderArt style={opt.id} brandName="Preview" />
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{opt.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const LOADER_STYLES = [
  { id: 'neural', name: 'Neural network', desc: 'Nodes firing along connecting lines — signature AI look.' },
  { id: 'node', name: 'AI node', desc: 'Glass card with a pulsing core, orbiting dot and waveform.' },
  { id: 'orbit', name: 'Orbit rings', desc: 'Three counter-rotating rings around a glowing core.' },
  { id: 'pulse', name: 'Sonar pulse', desc: 'Calm expanding rings radiating from a bright centre.' },
  { id: 'prism', name: 'Prism fold', desc: 'Three squares folding through each other in sequence.' },
]
