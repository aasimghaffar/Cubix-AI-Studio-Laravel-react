import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Pencil, Gift } from 'lucide-react'
import { api } from '../../lib/api'

const STATUS_STYLE = {
  active: 'text-brand border-brand/40 bg-brand/10',
  inactive: 'text-slate-500 border-ink-700',
  coming_soon: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
}

export default function ToolsManager() {
  const [tools, setTools] = useState([])
  useEffect(() => { api('/admin/tools').then(setTools) }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">AI tools</h1>
      </div>
      <p className="text-slate-400 text-sm mb-8">
        Every tool customers can use. Open a tool to edit its name, description, category,
        status, and the free credits signed-in users get before choosing a plan.
      </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tools.map((tool, i) => {
          const Icon = Icons[tool.icon] || Icons.Wand2
          return (
            <div key={tool.id} className="card card-laminate p-5 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <span className="p-2.5 rounded-xl bg-brand/15 text-brand shrink-0"><Icon size={20} /></span>
                <span className={`text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border ${STATUS_STYLE[tool.status] ?? STATUS_STYLE.inactive}`}>
                  {tool.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-white truncate">{tool.name}</h2>
                <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">{tool.description}</p>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>{tool.taxonomy?.name ?? 'No category'}</span>
                {tool.free_enabled && (
                  <span className="inline-flex items-center gap-1 text-brand">
                    <Gift size={11} /> {tool.free_limit ?? '∞'} free / {tool.free_unit === 'day' ? 'day' : 'month'}
                  </span>
                )}
              </div>
              <Link to={`/admin/tools/${tool.id}`} className="btn-brand w-full !py-2 text-sm">
                <Pencil size={13} /> Edit tool
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
