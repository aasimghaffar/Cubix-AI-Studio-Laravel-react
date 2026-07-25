import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

const STATUS_COLORS = {
  active: 'text-brand border-brand/40',
  canceled: 'text-red-400 border-red-400/40',
  past_due: 'text-amber-400 border-amber-400/40',
  expired: 'text-slate-500 border-ink-700',
}

export default function Subscriptions() {
  const [page, setPage] = useState(null)
  const [status, setStatus] = useState('')

  const load = (s = status) =>
    api(`/admin/subscriptions${s ? `?status=${s}` : ''}`).then(setPage)

  useEffect(() => { load('') }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Subscriptions</h1>
        <select className="input !w-44" value={status}
          onChange={(e) => { setStatus(e.target.value); load(e.target.value) }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past due</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-slate-400 border-b border-ink-700/60">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Package</th>
              <th className="p-4">Gateway</th>
              <th className="p-4">Status</th>
              <th className="p-4">Expires</th>
            </tr>
          </thead>
          <tbody>
            {(page?.data ?? []).map((sub) => (
              <tr key={sub.id} className="border-b border-ink-700/40 last:border-0">
                <td className="p-4">
                  <p className="text-white">{sub.user?.name}</p>
                  <p className="text-slate-500 text-xs">{sub.user?.email}</p>
                </td>
                <td className="p-4 text-slate-300">
                  {sub.package?.name} <span className="text-slate-500">(${sub.package?.price}/{sub.package?.billing_cycle === 'yearly' ? 'yr' : 'mo'})</span>
                </td>
                <td className="p-4 text-slate-400 capitalize">{sub.gateway}</td>
                <td className="p-4">
                  <span className={`text-[11px] uppercase tracking-wider rounded-full px-2.5 py-1 border ${STATUS_COLORS[sub.status] ?? STATUS_COLORS.expired}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400">
                  {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {page?.data?.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No subscriptions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
