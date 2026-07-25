import { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken, applyBranding } from '../lib/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Hydrate branding synchronously from the last visit so the header, logo,
// colors, and layout styles render correctly on the very first paint.
function cachedBranding() {
  try {
    const raw = localStorage.getItem('branding')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { brand_name: 'Cubix AI Studio', header_style: 'classic', footer_style: 'simple', currency: { code: 'USD', symbol: '$' } }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [branding, setBranding] = useState(cachedBranding)
  const [loading, setLoading] = useState(true) // true until we KNOW if the user is signed in

  useEffect(() => {
    applyBranding(branding) // apply cached brand color immediately

    api('/branding').then((b) => {
      setBranding(b)
      applyBranding(b)
      try { localStorage.setItem('branding', JSON.stringify(b)) } catch { /* ignore */ }
    }).catch(() => {})

    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return } // no token → definitely a guest, no flash

    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password, force = false) => {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password, force } })
    setToken(token)
    setUser(await api('/auth/me'))
    return user
  }

  const register = async (form, email, password) => {
    // Registration no longer signs in — the account is pending email verification.
    const body = typeof form === 'string'
      ? { name: form, email, password }
      : {
          first_name: form.first_name,
          last_name: form.last_name || null,
          email: form.email,
          password: form.password,
          date_of_birth: form.date_of_birth || null,
        }
    return api('/auth/register', { method: 'POST', body })
  }

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setToken(null)
    setUser(null)
  }

  const refreshBranding = async () => {
    const b = await api('/branding')
    setBranding(b)
    applyBranding(b)
    try { localStorage.setItem('branding', JSON.stringify(b)) } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{
      user, branding, loading, login, register, logout, refreshBranding,
      refresh: () => api('/auth/me').then(setUser),
    }}>
      {children}
    </AuthContext.Provider>
  )
}
