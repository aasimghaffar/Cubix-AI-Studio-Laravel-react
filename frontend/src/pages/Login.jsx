import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import AuthShell, { GoogleButton } from '../components/AuthShell'
import Alert from '../components/Alert'

export default function Login() {
  const { t } = useLang()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const params = new URLSearchParams(location.search)
  const verified = params.get('verified')
  const google = params.get('google')

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [sessionLimit, setSessionLimit] = useState(null) // message from the server when browser limit is hit
  const [busy, setBusy] = useState(false)

  if (user && !busy) return <Navigate to="/account" replace />

  const submit = async (force = false) => {
    setBusy(true); setError(''); if (force) setSessionLimit(null)
    try {
      const u = await login(form.email, form.password, force)
      navigate(from || (u?.role === 'admin' ? '/admin' : '/tools'))
    } catch (e) {
      if (e.status === 409 && e.data?.code === 'SESSION_LIMIT') {
        setSessionLimit(e.data.message)
      } else {
        setError(e.data?.errors ? Object.values(e.data.errors).flat().join(' ') : e.message)
      }
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-bold text-white mb-1">{t('auth.welcome', 'Welcome back')}</h1>
      <p className="text-sm text-slate-400 mb-7">{t('auth.signin_sub', 'Sign in to your studio.')}</p>

      {verified === '1' && <Alert type="success" className="mb-4" title="Email verified!">You can sign in now.</Alert>}
      {verified === '0' && <Alert type="error" className="mb-4">That verification link is invalid or already used.</Alert>}
      {google === 'failed' && <Alert type="error" className="mb-4">Google sign-in didn't complete — please try again.</Alert>}
      {google === 'session_limit' && <Alert type="warning" className="mb-4">Your plan's browser limit is reached. Sign out on another browser first, then try Google sign-in again.</Alert>}
      {google === 'blocked' && <Alert type="error" className="mb-4">This account has been suspended.</Alert>}

      <GoogleButton />

      <div className="space-y-3">
        <input className="input" type="email" placeholder={t('auth.email', 'Email')} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit(false)} />
        <input className="input" type="password" placeholder={t('auth.password', 'Password')} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && submit(false)} />
        {error && <Alert type="error">{error}</Alert>}
        {sessionLimit && (
          <Alert type="warning" title="Browser limit reached"
            action={
              <button className="mt-3 w-full rounded-lg bg-amber-400/90 hover:bg-amber-400 text-ink-950 font-semibold text-xs py-2 transition"
                onClick={() => submit(true)} disabled={busy}>
                Sign out other browsers & continue here
              </button>
            }>
            {sessionLimit}
          </Alert>
        )}
        <button className="btn-brand w-full" onClick={() => submit(false)} disabled={busy}>
          {busy ? '…' : t('auth.signin_btn', 'Sign in')}
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-6">
        {t('auth.no_account', "Don't have an account?")}{' '}
        <Link to="/register" state={{ from }} className="text-brand hover:underline">{t('auth.register_btn', 'Create account')}</Link>
      </p>
    </AuthShell>
  )
}
