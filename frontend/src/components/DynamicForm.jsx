import { useEffect, useState } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'

/**
 * Renders a form entirely from the backend's JSON schema.
 * New field types or tools added in future updates render automatically.
 */
export default function DynamicForm({ schema, onSubmit, busy }) {
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const defaults = {}
    for (const f of schema?.fields ?? []) {
      if (f.default !== undefined) {
        defaults[f.name] = f.default
      } else if (f.type === 'select' && f.options?.length) {
        // Pre-select the first option so nothing is ever submitted empty.
        defaults[f.name] = f.options[0].value
      }
    }
    setValues(defaults)
    setErrors({})
  }, [schema])

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  const submit = async () => {
    const errs = {}
    for (const f of schema?.fields ?? []) {
      if (f.required && !values[f.name]) errs[f.name] = `${f.label} is required.`
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    await onSubmit(values, setErrors)
  }

  return (
    <div className="space-y-5">
      {(schema?.fields ?? []).map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {f.label} {f.required && <span className="text-brand">*</span>}
          </label>
          <Field field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
          {errors[f.name] && <p className="text-xs text-red-400 mt-1">{errors[f.name]}</p>}
        </div>
      ))}

      {schema?.credit_note && <p className="text-xs text-slate-500">{schema.credit_note}</p>}

      <button onClick={submit} disabled={busy} className="btn-brand w-full">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? 'Working…' : schema?.submit_label || 'Run'}
      </button>
    </div>
  )
}

function Field({ field, value, onChange }) {
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className="input min-h-28"
          placeholder={field.placeholder}
          maxLength={field.max_length}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'select':
      return (
        <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>Choose…</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    case 'file':
      return (
        <label className="flex items-center gap-3 input cursor-pointer hover:border-brand/60">
          <UploadCloud size={18} className="text-brand shrink-0" />
          <span className="text-slate-400 text-sm truncate">
            {value?.name || `Upload ${((field.accept_extensions ?? []).join(', ') || 'file').toUpperCase()}`}
          </span>
          <input
            type="file"
            className="hidden"
            accept={(field.accept_extensions ?? []).map((e) => `.${e}`).join(',')}
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        </label>
      )
    case 'range':
      return (
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={field.min} max={field.max} step={field.step ?? 0.1}
            value={value ?? field.default ?? field.min}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-[rgb(var(--brand))]"
          />
          <span className="text-sm text-slate-300 w-10 text-right">{value ?? field.default}</span>
        </div>
      )
    default:
      return (
        <input
          className="input"
          placeholder={field.placeholder}
          maxLength={field.max_length}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
