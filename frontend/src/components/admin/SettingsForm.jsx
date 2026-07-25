import { useEffect, useState } from 'react'
import { CircleCheck, CircleX, Loader2, Plug } from 'lucide-react'
import { api } from '../../lib/api'

const groupFor = (key) =>
  key.startsWith('brand') ? 'branding'
  : key.startsWith('stripe') ? 'payment'
  : key.startsWith('notify') ? 'notifications'
  : key.startsWith('engine_') ? 'engines'
  : key.endsWith('_provider') || key === 'currency_code' || key === 'free_limit_message' ? 'general'
  : 'ai_keys'

export default function SettingsForm({ title, intro, sections, saveLabel = 'Save settings' }) {
  const [values, setValues] = useState({})
  const [tests, setTests] = useState({})
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/admin/settings').then((rows) => {
      const v = {}
      rows.forEach((r) => { v[r.key] = r.value ?? '' })
      setValues(v)
    })
  }, [])

  const save = async () => {
    setBusy(true); setSaved(false)
    await api('/admin/settings', {
      method: 'PUT',
      body: { settings: Object.entries(values).map(([key, value]) => ({ key, value, group: groupFor(key) })) },
    })
    setBusy(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const test = async (provider) => {
    setTests((t) => ({ ...t, [provider]: 'busy' }))
    // Send everything currently typed in the form — no need to save first.
    const overrides = Object.fromEntries(
      Object.entries(values).filter(([, v]) => typeof v === 'string' && v !== '' && !v.includes('•'))
    )
    const res = await api(`/admin/settings/test/${provider}`, { method: 'POST', body: { overrides } })
      .catch((e) => ({ ok: false, message: e.message }))
    setTests((t) => ({ ...t, [provider]: res }))
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-2xl font-bold text-white mb-1">{title}</h1>
      <p className="text-slate-400 mb-8 text-sm">{intro}</p>

      {sections.map((section) => (
        <div key={section.title} className="card p-6 mb-5">
          <h2 className="font-display font-semibold text-white mb-1">{section.title}</h2>
          {section.note && <p className="text-xs text-slate-500 mb-4">{section.note}</p>}
          <div className="space-y-4 mt-4">
            {section.keys
              .filter((f) => !f.showWhen || (values[f.showWhen.key] ?? f.showWhen.fallback ?? 'test') === f.showWhen.value)
              .map(({ key, label, provider, type, options, default: def, placeholder , testable }) => (
              <div key={key}>
                <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
                <div className="flex gap-2">
                  {type === 'dropdown' ? (
                    <select className="input" value={values[key] ?? def}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })}>
                      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : type === 'longtext' ? (
                    <textarea className="input min-h-20" placeholder={placeholder}
                      value={values[key] ?? ''}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  ) : type === 'choice' ? (
                    <div className="flex rounded-xl border border-ink-700 overflow-hidden">
                      {options.map((opt) => (
                        <button key={opt.value}
                          onClick={() => setValues({ ...values, [key]: opt.value })}
                          className={`px-5 py-2.5 text-sm transition ${
                            (values[key] ?? def) === opt.value
                              ? 'bg-brand text-ink-950 font-semibold'
                              : 'text-slate-300 hover:bg-ink-800'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  ) : type === 'toggle' ? (
                    <select className="input" value={values[key] ?? '1'}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })}>
                      <option value="1">Enabled</option>
                      <option value="0">Disabled</option>
                    </select>
                  ) : type === 'number' ? (
                    <input className="input" type="number" min="1" max="30"
                      value={values[key] ?? '3'}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  ) : type === 'color' ? (
                    <span className="flex items-center gap-3">
                      <input type="color" value={values[key] || '#000000'}
                        className="h-11 w-16 rounded-xl border border-ink-700 bg-transparent cursor-pointer p-1"
                        onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                      <input className="input !w-32" type="text" placeholder="#hex or empty"
                        value={values[key] ?? ''}
                        onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                      {values[key] && (
                        <button type="button" className="text-xs text-slate-400 hover:text-red-400"
                          onClick={() => setValues({ ...values, [key]: '' })}>Reset</button>
                      )}
                    </span>
                  ) : (
                    <input className="input" type="text" placeholder={placeholder ?? ''}
                      value={values[key] ?? ''}
                      onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  )}
                  {(provider || (testable && values[key])) && (
                    <button onClick={() => test(provider || values[key])}
                      className="shrink-0 inline-flex items-center gap-2 px-4 rounded-xl border border-ink-700 text-sm text-slate-300 hover:border-brand/60">
                      {tests[provider || values[key]] === 'busy'
                        ? <Loader2 size={15} className="animate-spin" />
                        : tests[provider || values[key]]?.ok === true
                          ? <CircleCheck size={15} className="text-brand" />
                          : tests[provider || values[key]]?.ok === false
                            ? <CircleX size={15} className="text-red-400" />
                            : <Plug size={15} />}
                      Test
                    </button>
                  )}
                </div>
                {tests[provider || values[key]]?.message && tests[provider || values[key]] !== 'busy' && (
                  <p className={`text-xs mt-1 ${tests[provider || values[key]].ok ? 'text-brand' : 'text-red-400'}`}>
                    {tests[provider || values[key]].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn-brand" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : saved ? 'Saved ✓' : saveLabel}
      </button>
    </div>
  )
}
