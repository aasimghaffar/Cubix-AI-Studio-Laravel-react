import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PublicLayout from './components/PublicLayout'
import SiteLoader from './components/SiteLoader'
import NotFound from './pages/NotFound'
import AdminLayout from './components/AdminLayout'
import Home from './pages/public/Home'
import Tools from './pages/public/Tools'
import Contact from './pages/public/Contact'
import PublicPricing from './pages/public/PublicPricing'
import Login from './pages/Login'
import Register from './pages/Register'
import ToolWorkspace from './pages/ToolWorkspace'
import Account from './pages/Account'
import AdminDashboard from './pages/admin/Dashboard'
import AdminPackages from './pages/admin/Packages'
import AdminCustomers from './pages/admin/Customers'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminToolsManager from './pages/admin/ToolsManager'
import ToolEditor from './pages/admin/ToolEditor'
import AdminUsageLogs from './pages/admin/UsageLogs'
import AdminMessages from './pages/admin/Messages'
import AdminApiKeys from './pages/admin/ApiKeys'
import AdminAiEngines from './pages/admin/AiEngines'
import AdminSettings from './pages/admin/Settings'
import AdminAppearance from './pages/admin/Appearance'
import AdminLanguages from './pages/admin/Languages'
import AdminPages from './pages/admin/Pages'
import AdminMenuManager from './pages/admin/MenuManager'
import AdminTaxonomies from './pages/admin/Taxonomies'
import AdminShortcodes from './pages/admin/Shortcodes'
import AdminTestimonials from './pages/admin/Testimonials'
import Page from './pages/public/Page'
import GoogleCallback from './pages/GoogleCallback'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-[50vh] grid place-items-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <SiteLoader />
      <Routes>
        {/* ── Everything customer-facing lives on the public site ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/:slug" element={<ToolWorkspace />} />
          <Route path="/pricing" element={<PublicPricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/p/:slug" element={<Page />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        </Route>

        {/* ── Auth ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google" element={<GoogleCallback />} />
        <Route path="/register" element={<Register />} />

        {/* ── Admin panel ── */}
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/packages" element={<AdminPackages />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/tools" element={<AdminToolsManager />} />
          <Route path="/admin/tools/:id" element={<ToolEditor />} />
          <Route path="/admin/usage" element={<AdminUsageLogs />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/appearance" element={<AdminAppearance />} />
          <Route path="/admin/languages" element={<AdminLanguages />} />
          <Route path="/admin/pages" element={<AdminPages />} />
          <Route path="/admin/menu" element={<AdminMenuManager />} />
          <Route path="/admin/taxonomies" element={<AdminTaxonomies />} />
          <Route path="/admin/shortcodes" element={<AdminShortcodes />} />
          <Route path="/admin/testimonials" element={<AdminTestimonials />} />
          <Route path="/admin/engines" element={<AdminAiEngines />} />
          <Route path="/admin/keys" element={<AdminApiKeys />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
