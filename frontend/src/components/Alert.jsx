import { CircleAlert, CircleCheck, TriangleAlert, Info, X } from 'lucide-react'

const STYLES = {
  error:   { icon: CircleAlert,   ring: 'border-red-400/40',   bg: 'bg-red-400/10',   text: 'text-red-300',   iconColor: 'text-red-400' },
  success: { icon: CircleCheck,   ring: 'border-brand/40',     bg: 'bg-brand/10',     text: 'text-brand',     iconColor: 'text-brand' },
  warning: { icon: TriangleAlert, ring: 'border-amber-400/40', bg: 'bg-amber-400/10', text: 'text-amber-300', iconColor: 'text-amber-400' },
  info:    { icon: Info,          ring: 'border-sky-400/40',   bg: 'bg-sky-400/10',   text: 'text-sky-300',   iconColor: 'text-sky-400' },
}

/**
 * Consistent, polished message banner.
 *   <Alert type="error">Something went wrong</Alert>
 *   <Alert type="success" title="Saved">Your profile was updated.</Alert>
 */
export default function Alert({ type = 'info', title, children, onClose, className = '', action }) {
  const { icon: Icon, ring, bg, text, iconColor } = STYLES[type] ?? STYLES.info

  return (
    <div className={`flex items-start gap-3 rounded-xl border ${ring} ${bg} px-4 py-3 animate-pop-in ${className}`}>
      <Icon size={17} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${text}`}>{title}</p>}
        <div className={`text-sm ${title ? 'text-slate-300 mt-0.5' : text} leading-relaxed`}>{children}</div>
        {action}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition shrink-0">
          <X size={15} />
        </button>
      )}
    </div>
  )
}
