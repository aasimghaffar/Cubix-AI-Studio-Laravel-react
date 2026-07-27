import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarClock, XCircle, X, UserCircle2, CreditCard, KeyRound, BellRing } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import CreditMeter from '../components/CreditMeter'
import { useLang } from '../context/LanguageContext'
import Alert from '../components/Alert'
import Portal from '../components/Portal'
import DateField from '../components/DateField'

const METER_LABELS = {
  image_generation_credits: 'AI images',
  content_writer_credits: 'Written articles',
  translation_credits: 'Translations',
  document_query_credits: 'Document queries',
  background_removal_credits: 'Background removals',
  audio_character_limit: 'Audio characters',
  chat_credits: 'Chat questions',
  rewriter_credits: 'Rewrites',
  summarizer_credits: 'Summaries',
}

const TABS = [
  { id: 'profile', key: 'account.tab.profile', label: 'Profile', icon: UserCircle2 },
  { id: 'plan', key: 'account.tab.plan', label: 'Plan & credits', icon: CreditCard },
  { id: 'password', key: 'account.tab.password', label: 'Password', icon: KeyRound },
  { id: 'notifications', key: 'account.tab.notifications', label: 'Notifications', icon: BellRing },
]

export default function Account() {
  const { t } = useLang()
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl font-bold text-white mb-6">{t('account.title', 'My account')}</h1>

      {/* Tabs — segmented bar with active underline */}
      <div className="card p-1.5 flex gap-1 mb-8 overflow-x-auto w-full">
        {TABS.map(({ id, key, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`relative flex-1 min-w-fit inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm whitespace-nowrap transition ${
              tab === id
                ? 'text-ink-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-ink-800'
            }`}
            style={tab === id ? { background: 'linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)))' } : undefined}>
            <Icon size={15} /> {t(key, label)}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab user={user} t={t} />}
      {tab === 'plan' && <PlanTab user={user} t={t} />}
      {tab === 'password' && <PasswordTab user={user} t={t} />}
      {tab === 'notifications' && <NotificationsTab user={user} t={t} />}
    </div>
  )
}

function ProfileTab({ user, t }) {
  const { refresh } = useAuth()
  const parts = (user?.name ?? '').split(' ')
  const [form, setForm] = useState({
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' '),
    date_of_birth: user?.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const initials = ((form.first_name[0] ?? '') + (form.last_name[0] ?? '')).toUpperCase() || 'U'

  const save = async () => {
    setBusy(true); setError(''); setDone(false)
    try {
      await api('/account/profile', { method: 'PUT', body: { ...form, date_of_birth: form.date_of_birth || null } })
      await refresh()
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-7 animate-fade-up">
      <div className="flex items-center gap-4 mb-7">
        <span className="w-16 h-16 rounded-2xl grid place-items-center font-display font-bold text-xl text-ink-950"
          style={{ background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--accent)))' }}>
          {initials}
        </span>
        <div>
          <h2 className="font-display font-semibold text-white text-lg">{user?.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('acct.member_since', 'Member since')} {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">{t('acct.first_name', 'First name')}</label>
          <input className="input" value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">{t('acct.last_name', 'Last name')}</label>
          <input className="input" value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">{t('acct.dob', 'Date of birth')}</label>
          <DateField value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)}
            onChange={(v) => setForm({ ...form, date_of_birth: v })} placeholder={t('acct.ph_birth', "Select your birth date")} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">{t('acct.email', 'Email')} <span className="text-slate-600">{t('acct.email_locked', "(sign-in email can't be changed)")}</span></label>
          <input className="input w-full opacity-60 cursor-not-allowed" value={user?.email ?? ''} readOnly />
        </div>
      </div>

      {error && <Alert type="error" className="mt-4">{error}</Alert>}
      <div className="flex items-center gap-3 mt-6">
        <button className="btn-brand" onClick={save} disabled={busy}>{busy ? t('acct.saving', 'Saving…') : t('acct.save_profile', 'Save profile')}</button>
        {done && <span className="text-sm text-brand">{t('acct.saved', 'Saved ✓')}</span>}
      </div>
    </div>
  )
}

function PlanTab({ user, t }) {
  const { refresh } = useAuth()
  const [meters, setMeters] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/tools').then((d) => setMeters(d.meters)).catch(() => {}) }, [])

  const sub = user?.active_subscription

  const cancel = async () => {
    setBusy(true); setError('')
    try {
      const res = await api('/billing/cancel', { method: 'POST' })
      setNotice(res.message)
      setConfirming(false)
      await refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-up">
      {notice && <Alert type="success" className="mb-5" onClose={() => setNotice('')}>{notice}</Alert>}

      <div className="card p-6 mb-5">
        <h2 className="font-display font-semibold text-white mb-4">{t('acct.current_plan', 'Current plan')}</h2>
        {sub ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <BadgeCheck className="text-brand" size={20} />
                <div>
                  <p className="text-white font-medium">{sub.package?.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <CalendarClock size={12} />
                    {sub.cancel_at_period_end
                      ? `Renewal canceled — active until ${new Date(sub.expires_at).toLocaleDateString()}`
                      : sub.expires_at
                        ? `Renews ${new Date(sub.expires_at).toLocaleDateString()}`
                        : 'Active'}
                  </p>
                </div>
              </div>
              <Link to="/pricing" className="text-sm text-brand hover:underline shrink-0">{t('acct.change_plan', 'Change plan')}</Link>
            </div>

            {!sub.cancel_at_period_end && (
              <div className="border-t border-ink-700/60 mt-5 pt-4">
                <button onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition">
                  <XCircle size={15} /> {t('account.cancel', 'Cancel subscription')}
                </button>
              </div>
            )}
            {error && <Alert type="error" className="mt-3">{error}</Alert>}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-slate-400 text-sm">{t('account.no_plan', 'No active plan yet.')}</p>
            <Link to="/pricing" className="btn-brand !py-2">{t('account.choose_plan', 'Choose a plan')}</Link>
          </div>
        )}
      </div>

      {Object.keys(meters).length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-white mb-5">{t('account.credits', 'Credits this cycle')}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {Object.entries(meters).map(([key, m]) => (
              <CreditMeter key={key} used={m.used} limit={m.limit} label={t(`meter.${key}`, METER_LABELS[key] ?? key)}
                freeLabel={m.free ? (m.renews === 'day' ? t('acct.free_today', 'free uses today') : t('acct.free_month', 'free uses this month')) : undefined}
                renews={m.renews} />
            ))}
          </div>
        </div>
      )}

      {confirming && (
        <Portal>
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-950/60 backdrop-blur-md" onClick={() => setConfirming(false)}>
          <div className="relative card p-7 w-full max-w-sm animate-pop-in border-red-400/30" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setConfirming(false)} aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-ink-800 transition">
              <X size={18} />
            </button>
            <h2 className="font-display font-semibold text-white mb-2">{t('acct.cancel_confirm', 'Cancel your subscription?')}</h2>
            <p className="text-sm text-slate-400 mb-6">
              Your plan will <strong className="text-white">not renew</strong>, and no further payments will be taken.
              You keep full access and your remaining credits until
              {' '}{sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'the end of the period'}.
            </p>
            <div className="flex gap-3">
              <button onClick={cancel} disabled={busy}
                className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-50 transition">
                {busy ? 'Canceling…' : 'Yes, cancel'}
              </button>
              <button onClick={() => setConfirming(false)} className="btn-ghost flex-1">{t('acct.keep_plan', 'Keep plan')}</button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}

function PasswordTab({ user, t }) {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const viaGoogle = !!user?.google_id

  const save = async () => {
    setBusy(true); setError(''); setDone(false)
    try {
      await api('/account/password', { method: 'PUT', body: form })
      setDone(true)
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-7 animate-fade-up grid md:grid-cols-[1fr_260px] gap-8">
      <div>
      <h2 className="font-display font-semibold text-white mb-1">{t('acct.change_password', 'Change password')}</h2>
      <p className="text-xs text-slate-500 mb-5">
        {viaGoogle
          ? t('acct.pw_google', 'You signed up with Google. You can still set a password here to also sign in with email.')
          : t('acct.pw_min', 'Use at least 8 characters.')}
      </p>
      <div className="space-y-3">
        <input className="input" type="password" placeholder={t('acct.ph_current_pw', "Current password")} value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
        <input className="input" type="password" placeholder={t('acct.ph_new_pw', "New password (min 8)")} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" type="password" placeholder={t('acct.ph_confirm_pw', "Confirm new password")} value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
        {error && <Alert type="error">{error}</Alert>}
        {done && <Alert type="success">{t('acct.pw_updated', 'Password updated successfully.')}</Alert>}
        <button className="btn-brand w-full" onClick={save} disabled={busy}>
          {busy ? t('acct.saving', 'Saving…') : t('acct.update_password', 'Update password')}
        </button>
      </div>
      </div>

      {/* Tips column keeps the card the same size as the other tabs */}
      <div className="hidden md:block border-l border-ink-700/60 pl-8">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">{t('acct.pw_tips', 'Strong password tips')}</p>
        <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
          <li>• {t('acct.tip1', 'Use 12+ characters when possible')}</li>
          <li>• {t('acct.tip2', 'Mix letters, numbers, and symbols')}</li>
          <li>• {t('acct.tip3', 'Avoid names, birthdays, and reused passwords')}</li>
          <li>• {t('acct.tip4', 'A short sentence works great: "coffee-at-9-tastes-best!"')}</li>
        </ul>
      </div>
    </div>
  )
}

const NOTIFY_TYPES = [
  { key: 'plan_purchased', tkey: 'notif.purchase', label: 'Plan purchase receipts', hintKey: 'notif.purchase_sub', hint: 'When a plan is purchased or assigned to your account' },
  { key: 'plan_expiry', tkey: 'notif.expiry', label: 'Plan expiry reminders', hintKey: 'notif.expiry_sub', hint: 'A heads-up before your plan renews or expires' },
  { key: 'account_updates', tkey: 'notif.updates', label: 'Account updates', hintKey: 'notif.updates_sub', hint: 'Important changes to your account status' },
]

function NotificationsTab({ user, t }) {
  const { refresh } = useAuth()
  const [prefs, setPrefs] = useState({ all: true, plan_purchased: true, plan_expiry: true, account_updates: true, ...(user?.notify_prefs ?? {}) })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const save = async (next) => {
    setPrefs(next); setBusy(true); setSaved(false)
    try {
      await api('/account/notifications', { method: 'PUT', body: { prefs: next } })
      setSaved(true)
      refresh()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setBusy(false)
    }
  }

  const allOff = prefs.all === false

  return (
    <div className="card p-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-display font-semibold text-white">{t('acct.email_notifs', 'Email notifications')}</h2>
        {saved && <span className="text-xs text-brand">{t('acct.saved', 'Saved ✓')}</span>}
      </div>
      <p className="text-xs text-slate-500 mb-6">{t('acct.notifs_sub', 'Choose which emails you receive. Security emails (like verification) are always sent.')}</p>

      <div className="space-y-4">
        {NOTIFY_TYPES.map(({ key, tkey, label, hintKey, hint }) => (
          <label key={key} className={`flex items-start justify-between gap-4 ${allOff ? 'opacity-40 pointer-events-none' : ''}`}>
            <span>
              <span className="block text-sm text-white">{t(tkey, label)}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{t(hintKey, hint)}</span>
            </span>
            <Toggle checked={prefs[key] !== false} onChange={(v) => save({ ...prefs, [key]: v })} disabled={busy} />
          </label>
        ))}

        <div className="border-t border-ink-700/60 pt-4 flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm text-white">{t('acct.disable_all', 'Disable all notifications')}</span>
            <span className="block text-xs text-slate-500 mt-0.5">{t('acct.disable_all_sub', 'Turn off every optional email in one switch')}</span>
          </span>
          <Toggle checked={allOff} onChange={(v) => save({ ...prefs, all: !v })} disabled={busy} danger />
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled, danger = false }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition shrink-0 ${
        checked ? (danger ? 'bg-red-500' : 'bg-brand') : 'bg-ink-700'
      } disabled:opacity-50`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}
