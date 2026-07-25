import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import AuthShell, { GoogleButton } from '../components/AuthShell'
import Alert from '../components/Alert'
import DateField from '../components/DateField'

export default function Register() {
  const { t } = useLang()
  const { user, register } = useAuth()
  const from = useLocation().state?.from

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '', date_of_birth: '' })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user && !busy) return <Navigate to="/account" replace />

  const submit = async () => {
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setBusy(true); setError('')
    try {
      await register(form, form.email, form.password)
      setDone(true)
    } catch (e) {
      setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <AuthShell>
        <div className="text-center animate-pop-in">
          <span className="icon-tile mb-4"><Check size={24} /></span>
          <h1 className="font-display text-xl font-bold text-white mb-2">{t('auth.check_email', 'Check your email')}</h1>
          <p className="text-sm text-slate-400 mb-6">
            {t('auth.check_email_text', 'We sent a verification link to')}{' '}
            <strong className="text-white">{form.email}</strong>
          </p>
          <Link to="/login" className="btn-brand w-full">{t('auth.goto_signin', 'Go to sign in')}</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold text-white mb-1">{t('auth.create_title', 'Create your account')}</h1>
      <p className="text-sm text-slate-400 mb-7">{t('cta.subtitle', 'Set up your account in under a minute.')}</p>

      <GoogleButton />

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder={t('auth.first_name', 'First name')} value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="input" placeholder={t('auth.last_name', 'Last name')} value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <input className="input" type="email" placeholder={t('auth.email', 'Email')} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div>
          <label className="text-xs text-slate-500 block mb-1.5">{t('auth.dob', 'Date of birth (optional)')}</label>
          <DateField value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)}
            onChange={(v) => setForm({ ...form, date_of_birth: v })} placeholder="Select your birth date" />
        </div>
        <input className="input" type="password" placeholder={t('auth.password', 'Password') + ' (min 8)'} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" type="password" placeholder={t('auth.confirm', 'Confirm password')} value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
        {error && <Alert type="error">{error}</Alert>}
        <button className="btn-brand w-full" onClick={submit} disabled={busy}>
          {busy ? '…' : t('auth.register_btn', 'Create account')}
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-6">
        {t('auth.have_account', 'Already have an account?')}{' '}
        <Link to="/login" state={{ from }} className="text-brand hover:underline">{t('auth.signin_btn', 'Sign in')}</Link>
      </p>
    </AuthShell>
  )
}
