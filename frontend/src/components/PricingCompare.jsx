import { Check, Minus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { fmtPrice } from '../lib/format'
import { featureLabel, FEATURE_LABELS, fmtLimit } from './PricingGrid'

/** Side-by-side comparison of every visible package. */
export default function PricingCompare({ visible }) {
  const { branding } = useAuth()
  const { t } = useLang()
  if (visible.length < 2) return null

  const canon = Object.keys(FEATURE_LABELS)
  const featureKeys = [...new Set(visible.flatMap((p) => Object.keys(p.features ?? {})))]
    .sort((a, b) => (canon.indexOf(a) + 1 || 99) - (canon.indexOf(b) + 1 || 99))

  return (
    <div className="mt-16 animate-fade-up">
      <h2 className="font-display text-xl md:text-2xl font-bold text-white text-center mb-8">
        {t('pricing.compare', 'Compare plans side by side')}
      </h2>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-ink-700/60">
              <th className="text-left px-5 py-4 text-slate-400 font-normal">{t('pricing.feature', 'What you get')}</th>
              {visible.map((pkg, i) => (
                <th key={pkg.id} className={`px-5 py-4 text-center ${i === 1 && visible.length >= 3 ? 'bg-brand/5' : ''}`}>
                  <span className="font-display font-semibold text-white block">{pkg.name}</span>
                  <span className="text-brand font-bold">{fmtPrice(pkg.price, branding)}</span>
                  <span className="text-xs text-slate-500"> /{pkg.billing_cycle === 'yearly' ? t('pricing.year', 'year') : t('pricing.month', 'month')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureKeys.map((key, r) => (
              <tr key={key} className={r % 2 ? '' : 'bg-ink-800/25'}>
                <td className="px-5 py-3 text-slate-300">{featureLabel(t, key)}</td>
                {visible.map((pkg, i) => {
                  const v = pkg.features?.[key]
                  return (
                    <td key={pkg.id} className={`px-5 py-3 text-center ${i === 1 && visible.length >= 3 ? 'bg-brand/5' : ''}`}>
                      {v === undefined || Number(v) === 0
                        ? <Minus size={14} className="inline text-slate-600" />
                        : <span className={Number(v) === -1 ? 'font-semibold animate-gradient-text' : 'text-white font-medium'}>{fmtLimit(v)}</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="border-t border-ink-700/60">
              <td className="px-5 py-3 text-slate-300">{t('pricing.sessions_row', 'Simultaneous browser logins')}</td>
              {visible.map((pkg, i) => (
                <td key={pkg.id} className={`px-5 py-3 text-center ${i === 1 && visible.length >= 3 ? 'bg-brand/5' : ''}`}>
                  <span className="text-white font-medium">{pkg.max_sessions ?? t('pricing.unlimited', 'Unlimited')}</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-5 py-3 text-slate-300">{t('pricing.all_tools', 'Access to every AI tool')}</td>
              {visible.map((pkg, i) => (
                <td key={pkg.id} className={`px-5 py-3 text-center ${i === 1 && visible.length >= 3 ? 'bg-brand/5' : ''}`}>
                  <Check size={15} className="inline text-brand" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
