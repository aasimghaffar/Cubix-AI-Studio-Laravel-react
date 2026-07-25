import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function UsageLogs() {
  const [page, setPage] = useState(null)
  const [tool, setTool] = useState('')
  const [tools, setTools] = useState([])

  const load = (t = tool) => api(`/admin/usage-logs${t ? `?tool=${t}` : ''}`).then(setPage)

  useEffect(() => {
    load('')
    api('/admin/tools').then(setTools)
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Usage logs</h1>
        <select className="input !w-56" value={tool}
          onChange={(e) => { setTool(e.target.value); load(e.target.value) }}>
          <option value="">All tools</option>
          {tools.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-slate-400 border-b border-ink-700/60">
            <tr>
              <th className="p-4">When</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Tool</th>
              <th className="p-4 text-right">Credits</th>
            </tr>
          </thead>
          <tbody>
            {(page?.data ?? []).map((log) => (
              <tr key={log.id} className="border-b border-ink-700/40 last:border-0">
                <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-4">
                  <p className="text-white">{log.user?.name ?? '—'}</p>
                  <p className="text-slate-500 text-xs">{log.user?.email}</p>
                </td>
                <td className="p-4 text-slate-300">{log.tool_slug}</td>
                <td className="p-4 text-right text-slate-300">{Number(log.amount).toLocaleString()}</td>
              </tr>
            ))}
            {page?.data?.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No usage recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
