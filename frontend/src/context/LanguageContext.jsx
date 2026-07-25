import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const LanguageContext = createContext(null)
export const useLang = () => useContext(LanguageContext)

function cachedLanguages() {
  try {
    const raw = localStorage.getItem('languages')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

export function LanguageProvider({ children }) {
  const [languages, setLanguages] = useState(cachedLanguages)
  const [code, setCode] = useState(() => localStorage.getItem('lang') || 'en')

  useEffect(() => {
    api('/languages').then((list) => {
      setLanguages(list)
      try { localStorage.setItem('languages', JSON.stringify(list)) } catch { /* ignore */ }
    }).catch(() => {})
  }, [])

  const current = useMemo(
    () => languages.find((l) => l.code === code) ?? languages.find((l) => l.code === 'en'),
    [languages, code]
  )
  const english = useMemo(() => languages.find((l) => l.code === 'en'), [languages])

  // Apply text direction for RTL languages (Arabic etc.)
  useEffect(() => {
    document.documentElement.dir = current?.dir === 'rtl' ? 'rtl' : 'ltr'
    document.documentElement.lang = current?.code ?? 'en'
  }, [current])

  const setLanguage = (c) => {
    setCode(c)
    localStorage.setItem('lang', c)
  }

  /** Translate a key. Falls back: current → English → provided fallback text. */
  const t = (key, fallback = '') =>
    current?.translations?.[key] ?? english?.translations?.[key] ?? fallback ?? key

  return (
    <LanguageContext.Provider value={{ t, languages, current, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
