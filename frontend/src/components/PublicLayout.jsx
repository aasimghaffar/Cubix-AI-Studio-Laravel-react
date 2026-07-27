import { useEffect, useRef, useState } from 'react'
import FxBackground from './FxBackground'
import { initFx } from '../lib/fx'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, UserRound, LogOut, UserCircle2, ShieldCheck, ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { Globe, Sun, Moon, ChevronDown as Chevron } from 'lucide-react'
import { api, applyThemeColors } from '../lib/api'

const navCls = ({ isActive }) =>
  `text-sm transition ${isActive ? 'text-brand font-medium' : 'text-slate-300 hover:text-white'}`

const NAV_KEYS = [
  { to: '/', key: 'nav.home', fallback: 'Home', end: true },
  { to: '/tools', key: 'nav.tools', fallback: 'Tools' },
  { to: '/pricing', key: 'nav.pricing', fallback: 'Pricing' },
  { to: '/contact', key: 'nav.contact', fallback: 'Contact' },
]

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    localStorage.setItem('theme', theme)
    applyThemeColors(theme)
  }, [theme])
  return [theme, setTheme]
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle light/dark mode"
      className="p-2.5 rounded-lg border border-ink-700 text-slate-300 hover:border-brand/60 transition">
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  )
}

function FloatingLanguageSwitcher() {
  const { languages, current, setLanguage } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (languages.length < 2) return null

  return (
    <div ref={ref} className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50">
      {open && (
        <div className="absolute bottom-14 right-0 rtl:right-auto rtl:left-0 w-44 card p-2 shadow-2xl animate-pop-in">
          {languages.map((l) => (
            <button key={l.code} onClick={() => { setLanguage(l.code); setOpen(false) }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${l.code === current?.code ? 'text-brand bg-brand/10' : 'text-slate-300 hover:bg-ink-800'}`}>
              {l.native_name}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Change language"
        className="w-12 h-12 rounded-full grid place-items-center bg-gradient-to-br from-[rgb(var(--brand))] to-[rgb(var(--accent))] text-ink-950 shadow-lg shadow-[rgb(var(--brand))]/30 hover:scale-105 transition">
        <Globe size={20} />
      </button>
    </div>
  )
}

function LanguageSwitcher({ compact = false }) {
  const { languages, current, setLanguage } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (languages.length < 2) return null

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-ink-700 text-slate-300 hover:border-brand/60 transition ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}>
        <Globe size={compact ? 13 : 15} /> {current?.native_name ?? 'EN'}
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2 w-44 card p-2 shadow-xl animate-pop-in z-50">
          {languages.map((l) => (
            <button key={l.code} onClick={() => { setLanguage(l.code); setOpen(false) }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${l.code === current?.code ? 'text-brand bg-brand/10' : 'text-slate-300 hover:bg-ink-800'}`}>
              {l.native_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Brand({ branding, size = 22 }) {
  return branding.brand_logo ? (
    <img src={branding.brand_logo} alt={branding.brand_name} className="h-8 w-auto max-w-[140px] object-contain" />
  ) : (
    <Sparkles className="text-brand" size={size} />
  )
}

const CORE_LABEL_KEYS = { '/': 'nav.home', '/tools': 'nav.tools', '/pricing': 'nav.pricing', '/contact': 'nav.contact' }

function itemPath(item) {
  if (item.type === 'page') return `/p/${item.target}`
  return item.target
}

/** Translated label for any menu item: core string key first, then the
 *  admin-editable `menu.<id>` key, then the raw label as a last resort. */
export function menuLabel(t, item) {
  if (item.type === 'core' && CORE_LABEL_KEYS[item.target]) {
    return t(CORE_LABEL_KEYS[item.target], item.label)
  }
  return t(`menu.${item.id}`, item.label)
}

function MenuLink({ item, t, className }) {
  const isExternal = item.type === 'link' && /^https?:/i.test(item.target)
  const label = menuLabel(t, item)

  if (isExternal) {
    return <a href={item.target} target="_blank" rel="noreferrer" className="text-sm text-slate-300 hover:text-white transition">{label}</a>
  }
  return <NavLink to={itemPath(item)} end={item.target === '/'} className={className ?? navCls}>{label}</NavLink>
}

function NavLinks({ className = '', menu }) {
  const { t } = useLang()

  if (!menu || menu.length === 0) {
    return (
      <nav className={className}>
        {NAV_KEYS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navCls}>{t(item.key, item.fallback)}</NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav className={className}>
      {menu.map((item) => (
        item.children?.length > 0 ? (
          <div key={item.id} className="relative group/menu">
            <button className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white transition py-2">
              {menuLabel(t, item)} <Chevron size={13} className="transition group-hover/menu:rotate-180" />
            </button>
            <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition z-50">
              <div className="card p-2 w-52 shadow-xl">
                {item.children.map((child) => (
                  <MenuLink key={child.id} item={child} t={t}
                    className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'text-brand bg-brand/10' : 'text-slate-300 hover:bg-ink-800'}`} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MenuLink key={item.id} item={item} t={t} />
        )
      ))}
    </nav>
  )
}

function UserActions({ user, loading, branding, logout, navigate, menuOpen, setMenuOpen, menuRef }) {
  const { t } = useLang()

  // While we're still checking the session, show a neutral placeholder —
  // never flash "Sign in / Get started" at a user who is actually signed in.
  if (loading) {
    return <span className="w-24 h-9 rounded-xl bg-ink-800/80 animate-pulse" aria-hidden />
  }

  if (!user) {
    return (
      <>
        <Link to="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white px-3 py-2">{t('nav.signin', 'Sign in')}</Link>
        <Link to="/register" className="btn-brand !py-2 !px-4 text-xs sm:text-sm">{t('nav.getstarted', 'Get started')}</Link>
      </>
    )
  }
  return (
    <>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full border border-ink-700 hover:border-brand/60 transition"
        >
          <span className="p-1.5 rounded-full bg-brand/15 text-brand"><UserRound size={16} /></span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 card p-2 shadow-xl animate-pop-in z-50">
            <p className="px-3 py-2 text-sm text-white truncate border-b border-ink-700/60 mb-1">{user.name}</p>
            {user.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="flex sm:hidden items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-ink-800 hover:text-white">
                <ShieldCheck size={16} /> {t('nav.admin', 'Admin panel')}
              </Link>
            )}
            <Link to="/account" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-ink-800 hover:text-white">
              <UserCircle2 size={16} /> {t('nav.account', 'My account')}
            </Link>
            <button
              onClick={() => { setMenuOpen(false); logout().then(() => navigate('/')) }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-ink-800 hover:text-red-400 w-full"
            >
              <LogOut size={16} /> {t('nav.signout', 'Sign out')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function PublicLayout() {
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    initFx()
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const { user, loading, branding, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menu, setMenu] = useState(() => {
    try { return JSON.parse(localStorage.getItem('menu') || 'null') } catch { return null }
  })
  const menuRef = useRef(null)

  useEffect(() => {
    api('/menu').then((m) => {
      setMenu(m)
      try { localStorage.setItem('menu', JSON.stringify(m)) } catch { /* ignore */ }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => { setMobileOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [location.pathname])

  const headerStyle = branding.header_style ?? 'classic'
  const footerStyle = branding.footer_style ?? 'columns'
  // Main menu in the footer too — flattened, submenu children included
  const footerMenu = (menu ?? []).flatMap((m) => (m.children?.length ? m.children : [m])).filter((m) => m.target !== '#')
  const actionProps = { user, loading, branding, logout, navigate, menuOpen, setMenuOpen, menuRef }
  const switcherPos = branding.language_switcher ?? 'header'
  const showHeaderSwitcher = switcherPos === 'header' || switcherPos === 'both'
  const showFooterSwitcher = switcherPos === 'footer' || switcherPos === 'both'
  const showFloatSwitcher = switcherPos === 'float'

  const hamburger = (
    <button
      className="md:hidden p-2 rounded-lg border border-ink-700 text-slate-300"
      onClick={() => setMobileOpen((o) => !o)}
      aria-label="Menu"
    >
      {mobileOpen ? <X size={18} /> : <Menu size={18} />}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col relative">
      <FxBackground />
      <header className={`sticky top-0 z-40 backdrop-blur bg-ink-950/60 border-b border-transparent transition-all duration-300 ${scrolled ? 'nav-scrolled' : ''}`}>
        {headerStyle === 'centered' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="relative flex items-center justify-center h-10">
              <div className="absolute left-0">{hamburger}</div>
              <Link to="/" className="flex items-center gap-2">
                <Brand branding={branding} />
                <span className="font-display font-bold text-white">{branding.brand_name}</span>
              </Link>
              <div className="absolute right-0 flex items-center gap-2 sm:gap-3">
                {branding.theme_toggle !== false && <span className="hidden sm:block"><ThemeToggle /></span>}{showHeaderSwitcher && <span className="hidden sm:block"><LanguageSwitcher /></span>}
                <UserActions {...actionProps} />
              </div>
            </div>
            <NavLinks menu={menu} className="hidden md:flex items-center justify-center gap-8 pt-3" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <Brand branding={branding} />
              <span className="font-display font-bold text-white truncate">{branding.brand_name}</span>
            </Link>

            {headerStyle === 'minimal' ? (
              <div className="flex items-center gap-2 sm:gap-6">
                <NavLinks menu={menu} className="hidden md:flex items-center gap-6" />
                <div className="flex items-center gap-2 sm:gap-3">{branding.theme_toggle !== false && <span className="hidden sm:block"><ThemeToggle /></span>}{showHeaderSwitcher && <span className="hidden sm:block"><LanguageSwitcher /></span>}<UserActions {...actionProps} /></div>
                {hamburger}
              </div>
            ) : (
              <>
                <NavLinks menu={menu} className="hidden md:flex items-center gap-8" />
                <div className="flex items-center gap-2 sm:gap-3">
                  {branding.theme_toggle !== false && <span className="hidden sm:block"><ThemeToggle /></span>}{showHeaderSwitcher && <span className="hidden sm:block"><LanguageSwitcher /></span>}
                  <UserActions {...actionProps} />
                  {hamburger}
                </div>
              </>
            )}
          </div>
        )}

        {mobileOpen && (
          <nav className="md:hidden border-t border-ink-700/60 bg-ink-950/95 backdrop-blur px-4 py-3 space-y-1 animate-pop-in">
            {(menu?.length ? menu : NAV_KEYS.map((n) => ({ id: n.to, type: 'core', target: n.to, label: n.fallback }))).map((item) => (
              <div key={item.id}>
                {item.children?.length > 0 ? (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-slate-500">{menuLabel(t, item)}</p>
                    {item.children.map((child) => (
                      <NavLink key={child.id} to={itemPath(child)}
                        className={({ isActive }) => `block px-5 py-2 rounded-lg text-sm ${isActive ? 'bg-brand/15 text-brand' : 'text-slate-300 hover:bg-ink-800'}`}>
                        {child.label}
                      </NavLink>
                    ))}
                  </>
                ) : (
                  <NavLink to={itemPath(item)} end={item.target === '/'}
                    className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm ${isActive ? 'bg-brand/15 text-brand' : 'text-slate-300 hover:bg-ink-800'}`}>
                    {menuLabel(t, item)}
                  </NavLink>
                )}
              </div>
            ))}
            {branding.theme_toggle !== false && <div className="px-3 py-2"><ThemeToggle /></div>}
            {!user && !loading && (
              <NavLink to="/login" className="block px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-ink-800">
                Sign in
              </NavLink>
            )}
            {showHeaderSwitcher && <div className="px-3 py-2"><LanguageSwitcher compact /></div>}
          </nav>
        )}
      </header>

      <main key={pathname} className="relative z-10 flex-1 animate-page-in">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-24 fx-footer overflow-hidden">
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--brand) / .6), rgb(var(--accent) / .5), transparent)', backgroundSize: '200% 100%', animation: 'gradientShift 6s linear infinite' }} />
        {/* ambient brand glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-64 pointer-events-none" aria-hidden
          style={{ background: 'radial-gradient(ellipse at center, rgb(var(--brand) / .14), transparent 70%)', filter: 'blur(10px)' }} />

        {footerStyle === 'columns' ? (
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <Brand branding={branding} size={22} />
                  <span className="font-display font-bold text-white text-xl animate-gradient-text">{branding.brand_name}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t('footer.tagline', 'Images, words, and voice — every AI tool you need in one workspace, under one subscription.')}
                </p>
                <NewsletterBox />
              </div>
              <div>
                <p className="footer-heading">Explore</p>
                <ul className="space-y-2 text-sm">
                  {((fl => fl.length ? fl : null)(footerMenu.filter((m) =>
                    !['faq', 'terms', 'privacy-policy'].includes(String(m.target)) && m.target !== '#'
                  )) ?? [
                    { id: 't', type: 'core', target: '/tools', label: 'Tools' },
                    { id: 'p', type: 'core', target: '/pricing', label: 'Pricing' },
                    { id: 'c', type: 'core', target: '/contact', label: 'Contact' },
                  ]).map((item) => (
                    <li key={item.id}>
                      {item.type === 'link' && /^https?:/i.test(item.target)
                        ? <a href={item.target} target="_blank" rel="noreferrer" className="footer-link">{menuLabel(t, item)}</a>
                        : <Link to={itemPath(item)} className="footer-link">{menuLabel(t, item)}</Link>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="footer-heading">{t('footer.info', 'Info')}</p>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/p/faq" className="footer-link">{t('footer.faq', 'FAQ')}</Link></li>
                  <li><Link to="/p/terms" className="footer-link">{t('footer.terms', 'Terms & Conditions')}</Link></li>
                  <li><Link to="/p/privacy-policy" className="footer-link">{t('footer.privacy', 'Privacy Policy')}</Link></li>
                  {user ? (
                    <li><Link to="/account" className="footer-link">{t('footer.account', 'My account')}</Link></li>
                  ) : (
                    <li><Link to="/register" className="footer-link">{t('footer.create', 'Create account')}</Link></li>
                  )}
                </ul>
              </div>
              <div>
                <p className="footer-heading">{t('footer.contact', 'Get in touch')}</p>
                <ul className="space-y-2.5 text-sm">
                  {branding.business?.email && (
                    <li><a href={`mailto:${branding.business.email}`} className="footer-link break-all">{branding.business.email}</a></li>
                  )}
                  {branding.business?.phone && (
                    <li><a href={`tel:${branding.business.phone.replace(/\s/g, '')}`} className="footer-link">{branding.business.phone}</a></li>
                  )}
                  {branding.business?.address && (
                    <li className="text-slate-500 text-[13px] leading-relaxed">{branding.business.address}</li>
                  )}
                  <li><Link to="/contact" className="text-brand hover:underline text-[13px]">{t('footer.message', 'Send us a message →')}</Link></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 mt-12 pt-5 pb-1 footer-divider">
              <p className="text-xs text-slate-500 text-center">
                © {new Date().getFullYear()} <span className="text-slate-400 font-medium">{branding.brand_name}</span>. {t('footer.rights', 'All rights reserved.')}
              </p>
              {showFooterSwitcher && <LanguageSwitcher compact />}
            </div>
          </div>
        ) : footerStyle === 'minimal' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center gap-3 text-sm text-slate-500">
            {footerMenu.length > 0 && (
              <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm text-slate-400">
                {footerMenu.map((item) => (
                  item.type === 'link' && /^https?:/i.test(item.target)
                    ? <a key={item.id} href={item.target} target="_blank" rel="noreferrer" className="hover:text-white">{menuLabel(t, item)}</a>
                    : <Link key={item.id} to={itemPath(item)} className="hover:text-white">{menuLabel(t, item)}</Link>
                ))}
              </nav>
            )}
            <span>© {new Date().getFullYear()} {branding.brand_name}</span>
            {showFooterSwitcher && <LanguageSwitcher compact />}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Brand branding={branding} size={16} />
              <span className="text-sm">{branding.brand_name} — © {new Date().getFullYear()}</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {(footerMenu.length ? footerMenu : [
                { id: 't', type: 'core', target: '/tools', label: 'Tools' },
                { id: 'p', type: 'core', target: '/pricing', label: 'Pricing' },
                { id: 'c', type: 'core', target: '/contact', label: 'Contact' },
              ]).map((item) => (
                item.type === 'link' && /^https?:/i.test(item.target)
                  ? <a key={item.id} href={item.target} target="_blank" rel="noreferrer" className="hover:text-white">{menuLabel(t, item)}</a>
                  : <Link key={item.id} to={itemPath(item)} className="hover:text-white">{menuLabel(t, item)}</Link>
              ))}
              {showFooterSwitcher && <LanguageSwitcher compact />}
            </nav>
          </div>
        )}
      </footer>

      {showFloatSwitcher && <FloatingLanguageSwitcher />}
    </div>
  )
}


/* Newsletter: wires to the real contact inbox — admin sees signups in Messages. */
function NewsletterBox() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [state, setState] = useState(null) // null | busy | ok | error-string
  const send = async () => {
    if (!email.includes('@')) { setState(t('footer.bad_email', 'Enter a valid email address.')); return }
    setState('busy')
    try {
      await api('/contact', { method: 'POST', body: { name: 'Newsletter signup', email, subject: 'Newsletter subscription', message: `Please add ${email} to the newsletter list.` } })
      setState('ok')
    } catch {
      setState(t('footer.sub_failed', 'Could not subscribe right now — please try again.'))
    }
  }
  return (
    <div className="mt-5">
      <p className="footer-heading">{t('footer.newsletter', 'Stay in the loop')}</p>
      {state === 'ok' ? (
        <p className="text-sm text-brand">{t('footer.subscribed', "You're subscribed — welcome aboard!")}</p>
      ) : (
        <div className="flex gap-2">
          <input className="input !py-2 text-sm flex-1" type="email" placeholder="you@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button className="btn-brand !px-4 !py-2 text-sm magnetic" onClick={send} disabled={state === 'busy'}>
            {state === 'busy' ? '…' : t('footer.join', 'Join')}
          </button>
        </div>
      )}
      {state && state !== 'busy' && state !== 'ok' && <p className="text-xs text-red-400 mt-1.5">{state}</p>}
    </div>
  )
}
