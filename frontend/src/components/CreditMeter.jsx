export default function CreditMeter({ used = 0, limit = 0, label, freeLabel, renews }) {
  // -1 → unlimited plan credits for this tool
  if (Number(limit) === -1) {
    return (
      <div>
        {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
        <p className="text-xs font-semibold animate-gradient-text inline-block">∞ Unlimited</p>
      </div>
    )
  }

  // limit === null → unlimited free usage
  if (limit === null || limit === undefined) {
    return (
      <div>
        {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
        <p className="text-xs text-brand">{freeLabel ?? 'Free'} — unlimited{renews ? ` · renews ${renews === 'day' ? 'daily' : 'monthly'}` : ''}</p>
      </div>
    )
  }

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const danger = pct >= 90

  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {used.toLocaleString()} / {limit.toLocaleString()} {freeLabel ? freeLabel : 'used'}
      </p>
    </div>
  )
}
