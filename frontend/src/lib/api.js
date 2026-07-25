// Tiny API client. Token lives in memory + localStorage.
// Development: same-origin via the Vite proxy. Production: set VITE_API_URL
// in frontend/.env before `npm run build` (e.g. https://api.yourdomain.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api'
let token = localStorage.getItem('token') || null

export function setToken(t) {
  token = t
  t ? localStorage.setItem('token', t) : localStorage.removeItem('token')
}

export async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

const hexToRgb = (hex) => {
  const h = (hex || '').replace('#', '')
  if (h.length !== 6) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
}

/** Apply the admin's saved brand + theme colors to CSS variables. */
export function applyBranding({ brand_color, theme_colors } = {}) {
  const root = document.documentElement
  const brand = hexToRgb(brand_color)
  if (brand) root.style.setProperty('--brand', brand)

  const tc = theme_colors || {}
  // Admin-chosen backgrounds override the ink surface for each theme
  const isLight = root.classList.contains('theme-light')
  const darkBg = hexToRgb(tc.dark_bg)
  const lightBg = hexToRgb(tc.light_bg)
  if (!isLight && darkBg) root.style.setProperty('--ink-950', darkBg)
  if (isLight && lightBg) root.style.setProperty('--ink-950', lightBg)
  if (tc.dark_text) root.style.setProperty('--theme-dark-text', tc.dark_text)
  if (tc.light_text) root.style.setProperty('--theme-light-text', tc.light_text)
  // Remember for theme switches
  window.__themeColors = tc
}

/** Re-apply the right admin background when the visitor flips the theme. */
export function applyThemeColors(theme) {
  const tc = window.__themeColors || {}
  const root = document.documentElement
  const bg = hexToRgb(theme === 'light' ? tc.light_bg : tc.dark_bg)
  if (bg) root.style.setProperty('--ink-950', bg)
  else root.style.removeProperty('--ink-950')
}
