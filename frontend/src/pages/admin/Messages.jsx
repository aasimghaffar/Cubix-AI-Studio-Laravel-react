import { useEffect, useState } from 'react'
import { MailOpen, Mail, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'

export default function Messages() {
  const [page, setPage] = useState(null)
  const [open, setOpen] = useState(null)

  const load = () => api('/admin/messages').then(setPage)
  useEffect(() => { load() }, [])

  const toggleRead = async (msg) => {
    await api(`/admin/messages/${msg.id}/read`, { method: 'POST' })
    load()
  }

  const remove = async (msg) => {
    if (!confirm('Delete this message?')) return
    await api(`/admin/messages/${msg.id}`, { method: 'DELETE' })
    setOpen(null)
    load()
  }

  return (
    <div>
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-6">Contact messages</h1>

      <div className="space-y-3">
        {(page?.data ?? []).map((msg) => (
          <div key={msg.id} className={`card p-5 ${msg.is_read ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <button className="text-left flex-1 min-w-0" onClick={() => setOpen(open === msg.id ? null : msg.id)}>
                <p className="text-white font-medium truncate">{msg.subject || '(no subject)'}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {msg.name} · {msg.email} · {new Date(msg.created_at).toLocaleString()}
                </p>
              </button>
              <div className="flex gap-2 shrink-0">
                <button title={msg.is_read ? 'Mark unread' : 'Mark read'} onClick={() => toggleRead(msg)}
                  className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-brand">
                  {msg.is_read ? <Mail size={15} /> : <MailOpen size={15} />}
                </button>
                <button title="Delete" onClick={() => remove(msg)}
                  className="p-2 rounded-lg border border-ink-700 text-slate-400 hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {open === msg.id && (
              <p className="text-sm text-slate-300 mt-4 pt-4 border-t border-ink-700/60 whitespace-pre-wrap">
                {msg.message}
              </p>
            )}
          </div>
        ))}
        {page?.data?.length === 0 && (
          <div className="card p-10 text-center text-slate-500 text-sm">No messages yet.</div>
        )}
      </div>
    </div>
  )
}
