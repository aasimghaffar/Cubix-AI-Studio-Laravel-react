import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Gauge, Boxes, Users, BadgeDollarSign, Wrench, ListOrdered,
  Inbox, Settings2, LogOut, ArrowLeftRight, ShieldCheck, Menu, X, Palette, Globe, FileText, ListTree, ChevronDown, Tags, Code2, Cpu, KeyRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
    isActive ? 'bg-brand/15 text-brand font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-ink-800'
  }`

function NavGroup({ item }) {
  const { pathname } = useLocation()
  const active = item.children.some((c) => pathname.startsWith(c.to))
  const [open, setOpen] = useState(active)
  const Icon = item.icon

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
          active ? 'text-brand' : 'text-slate-300 hover:bg-ink-800'
        }`}>
        <Icon size={18} /> {item.label}
        <ChevronDown size={14} className={`ml-auto transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-5 pl-3 border-l border-ink-700/60 space-y-0.5 mb-1">
          {item.children.map((c) => (
            <NavLink key={c.to} to={c.to} end
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-[13px] transition ${
                  isActive ? 'text-brand bg-brand/10' : 'text-slate-400 hover:text-white hover:bg-ink-800'
                }`}>
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

const LINKS = [
  { to: '/admin', end: true, icon: Gauge, label: 'Dashboard' },
  { to: '/admin/packages', icon: Boxes, label: 'Packages' },
  { icon: Users, label: 'Customers', children: [
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin/subscriptions', label: 'Subscriptions' },
    { to: '/admin/usage', label: 'Usage logs' },
  ]},
  { icon: Cpu, label: 'AI Settings', children: [
    { to: '/admin/tools', label: 'AI tools' },
    { to: '/admin/engines', label: 'AI Engines' },
    { to: '/admin/taxonomies', label: 'Categories' },
    { to: '/admin/keys', label: 'API Keys' },
  ]},
  { icon: FileText, label: 'Pages', children: [
    { to: '/admin/pages', label: 'All pages' },
    { to: '/admin/menu', label: 'Menu' },
    { to: '/admin/shortcodes', label: 'Shortcodes' },
    { to: '/admin/testimonials', label: 'Testimonials' },
  ]},
  { to: '/admin/messages', icon: Inbox, label: 'Messages' },
  { to: '/admin/appearance', icon: Palette, label: 'Appearance' },
  { to: '/admin/languages', icon: Globe, label: 'Languages' },
  { to: '/admin/settings', icon: Settings2, label: 'Settings' },
]

function Sidebar({ user, branding, logout, navigate }) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <ShieldCheck className="text-brand" size={22} />
        <div>
          <p className="font-display font-bold text-white leading-tight">{branding.brand_name}</p>
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Admin panel</p>
        </div>
      </div>

      {LINKS.map((item) => item.children
        ? <NavGroup key={item.label} item={item} />
        : <NavLink key={item.to} to={item.to} end={item.end} className={linkCls}>
            <item.icon size={18} /> {item.label}
          </NavLink>
      )}

      <div className="mt-auto border-t border-ink-700/60 pt-3">
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-brand">
          <ArrowLeftRight size={18} /> View website
        </Link>
        <p className="px-4 pt-2 text-sm text-slate-300 truncate">{user?.name}</p>
        <button
          onClick={() => logout().then(() => navigate('/'))}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 w-full"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [pathname])
  const { user, branding, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-ink-700/60 bg-ink-950/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-brand" size={20} />
          <span className="font-display font-bold text-white text-sm">Admin panel</span>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg border border-ink-700 text-slate-300" aria-label="Menu">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-ink-900 border-r border-ink-700/60 p-4 flex flex-col gap-1 overflow-y-auto animate-pop-in"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDrawerOpen(false)} className="self-end p-2 text-slate-400" aria-label="Close">
              <X size={18} />
            </button>
            <Sidebar user={user} branding={branding} logout={logout} navigate={navigate} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-ink-700/60 p-4 flex-col gap-1 bg-ink-900/40">
        <Sidebar user={user} branding={branding} logout={logout} navigate={navigate} />
      </aside>

      <main key={pathname} className="flex-1 p-4 sm:p-8 w-full animate-page-in">
        <Outlet />
      </main>
    </div>
  )
}
