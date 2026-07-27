import { useState } from 'react'
import SettingsForm from '../../components/admin/SettingsForm'

const SECTIONS = [
  { title: 'General', keys: [
    { key: 'currency_code', label: 'Display currency (prices across the site)', type: 'dropdown', default: 'USD', options: [
      { value: 'USD', label: 'USD — $' }, { value: 'EUR', label: 'EUR — €' }, { value: 'GBP', label: 'GBP — £' },
      { value: 'PKR', label: 'PKR — ₨' }, { value: 'INR', label: 'INR — ₹' }, { value: 'AED', label: 'AED — د.إ' },
      { value: 'SAR', label: 'SAR — ﷼' }, { value: 'CNY', label: 'CNY — ¥' }, { value: 'CAD', label: 'CAD — C$' },
      { value: 'AUD', label: 'AUD — A$' },
    ]},
    { key: 'free_limit_message', label: 'Message shown when a free tool limit is used up', type: 'longtext', placeholder: 'Your free limit for this tool is used up — choose a plan to keep creating.' },
  ]},
  { title: 'Business info', note: 'Shown on your Contact page, and used as the sender address for customer emails. Leave any field empty to hide it.', keys: [
    { key: 'business_email', label: 'Business email (shown on Contact page)' },
    { key: 'business_phone', label: 'Phone number' },
    { key: 'business_address', label: 'Address', type: 'longtext' },
    { key: 'mail_from_address', label: 'Customer emails are sent from this address' },
  ]},
  { title: 'Sign-in options', note: 'Google login: create OAuth credentials at console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID → Web application. The Authorized redirect URI must match your APP_URL in .env EXACTLY, including 127.0.0.1 vs localhost — these are different addresses to Google. With the default local setup that value is: http://127.0.0.1:8000/api/auth/google/callback — also add your live URL before going live. If Google shows "Access blocked: this request is invalid", the redirect URI does not match, or the OAuth consent screen has not been completed (fill in App name + User support email + Developer contact, then Save). While the consent screen is in Testing mode, add your own Google address under Audience → Test users. The buttons appear on Login and Register automatically when enabled.', keys: [
    { key: 'google_login_enabled', label: 'Enable "Continue with Google" button', type: 'toggle' },
    { key: 'google_client_id', label: 'Google OAuth Client ID' },
    { key: 'google_client_secret', label: 'Google OAuth Client Secret', provider: 'google', testable: true },
  ]},
  { title: 'Payments', note: 'Turn each payment method on or off. Stripe Price IDs are OPTIONAL now — prices are generated automatically from each package; attach an ID only if you prefer managing prices in the Stripe dashboard. PayPal needs only a Client ID + Secret from developer.paypal.com (plans are created automatically too).', keys: [
    { key: 'stripe_enabled', label: 'Accept card payments (Stripe)', type: 'toggle' },
    { key: 'paypal_enabled', label: 'Accept PayPal', type: 'toggle' },
    { key: 'paypal_mode', label: 'PayPal mode', type: 'choice', options: [
      { value: 'sandbox', label: 'Sandbox (testing)' }, { value: 'live', label: 'Live' },
    ], default: 'sandbox', showWhen: { key: 'paypal_enabled', value: '1' } },
    { key: 'paypal_client_id', label: 'PayPal Client ID', showWhen: { key: 'paypal_enabled', value: '1' } },
    { key: 'paypal_secret_key', label: 'PayPal Secret', provider: 'paypal', showWhen: { key: 'paypal_enabled', value: '1' } },
    { key: 'stripe_mode', label: 'Payment mode', type: 'choice', options: [
      { value: 'test', label: 'Test keys' }, { value: 'live', label: 'Live keys' },
    ], default: 'test' },
    { key: 'stripe_test_publishable_key', label: 'Test — publishable key (pk_test_…)', showWhen: { key: 'stripe_mode', value: 'test' } },
    { key: 'stripe_test_secret_api_key', label: 'Test — secret key (sk_test_…)', provider: 'stripe', showWhen: { key: 'stripe_mode', value: 'test' } },
    { key: 'stripe_test_webhook_secret', label: 'Test — webhook signing secret (whsec_…)', showWhen: { key: 'stripe_mode', value: 'test' } },
    { key: 'stripe_live_publishable_key', label: 'Live — publishable key (pk_live_…)', showWhen: { key: 'stripe_mode', value: 'live' } },
    { key: 'stripe_live_secret_api_key', label: 'Live — secret key (sk_live_…)', provider: 'stripe', showWhen: { key: 'stripe_mode', value: 'live' } },
    { key: 'stripe_live_webhook_secret', label: 'Live — webhook signing secret (whsec_…)', showWhen: { key: 'stripe_mode', value: 'live' } },
  ]},
  { title: 'Email notifications', keys: [
    { key: 'notify_account_created', label: 'Email when an account is created', type: 'toggle' },
    { key: 'notify_account_updated', label: 'Email when an admin updates a customer’s details', type: 'toggle' },
    { key: 'notify_account_blocked', label: 'Email when an account is blocked', type: 'toggle' },
    { key: 'notify_plan_purchased', label: 'Email when a plan is purchased or assigned', type: 'toggle' },
    { key: 'notify_plan_expiry', label: 'Email before a plan expires', type: 'toggle' },
    { key: 'notify_expiry_days', label: 'Send expiry reminder this many days before', type: 'number' },
  ]},
]

export default function Settings() {
  const [active, setActive] = useState(SECTIONS[0].title)
  const section = SECTIONS.find((s) => s.title === active) ?? SECTIONS[0]

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
      {/* Section sub-menu — each settings area is its own page */}
      <div className="card p-2.5 lg:sticky lg:top-6">
        <p className="px-3.5 pt-2 pb-3 text-[11px] uppercase tracking-widest text-slate-500">Settings</p>
        {SECTIONS.map((s) => (
          <button key={s.title} onClick={() => setActive(s.title)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition ${
              active === s.title ? 'bg-brand/10 text-brand font-medium' : 'text-slate-300 hover:bg-ink-800'
            }`}>
            {s.title}
          </button>
        ))}
      </div>

      <SettingsForm
        key={active}
        title={section.title}
        intro={section.note ?? ''}
        sections={[section]}
        saveLabel="Save settings"
      />
    </div>
  )
}
