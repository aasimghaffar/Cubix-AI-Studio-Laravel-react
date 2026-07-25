import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

/** Google redirects here with #token=… — store it and go to the tools. */
export default function GoogleCallback() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (!token) { setFailed(true); return }
    setToken(token)
    window.history.replaceState(null, '', '/auth/google') // remove the token from the URL
    api('/auth/me')
      .then(() => refresh().then(() => navigate('/tools', { replace: true })))
      .catch(() => setFailed(true))
  }, [])

  return (
    <div className="min-h-screen grid place-items-center text-slate-400">
      {failed ? 'Google sign-in failed — please try again from the login page.' : 'Signing you in with Google…'}
    </div>
  )
}
