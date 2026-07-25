# Cubix AI Studio — Changelog

## 1.0 — Initial release

- 9 AI tools: Image Generator, Content Writer, Translator, Document Assistant,
  Background Removal, Text-to-Audio, Chat Assistant, Grammar & Rewriter, Summarizer
- Multiple AI engines per tool (OpenAI, Gemini, Claude, DeepSeek, Mistral, Groq,
  Stable Diffusion, ElevenLabs, Clipdrop, remove.bg) with automatic engine fallback;
  free Pollinations engine for images (no API key needed)
- Subscriptions: monthly & yearly plans, discount badges, unlimited-credit toggles,
  per-plan browser-login limits, private custom packages, credit meters, usage history
- Payments: Stripe (dynamic prices — no Price IDs required) + PayPal (fully dynamic,
  sandbox/live), enable either or both, payment-method chooser, verified activation on
  return (works on localhost), success celebration popup, cancellation from account
- Admin panel: dashboard with live charts, customers (block/credits/plans), packages,
  taxonomies, AI engine & key manager with live key testing, pages + drag-drop menu
  builder + shortcodes, testimonials, translations with one-click auto-translate,
  business info, notification controls, one-click demo installer (with password confirm)
- Multi-language storefront: RTL support, floating/header switcher, complete
  translation of ALL content including pages, packages, categories and testimonials
- Modern design: dark & light themes with admin-configurable colors, scroll-reveal
  animations, portal-based popups, custom scrollbars, artwork backdrops, responsive
- Google sign-in (optional), email verification, session limits, notification emails
  with admin-configurable sender address

## 1.0 design notes
- Premium FX system: layered living background (mesh aurora, star field, masked
  grid, noise, light ray), spotlight cards, animated conic borders, magnetic
  buttons, click ripples, 3D tilt panels, glass windows — all dependency-free
  CSS/JS with prefers-reduced-motion support.

## 1.0 reliability notes
- Every AI tool now falls back automatically across all configured engines
  (text, image and voice) before showing an error, and reports missing API keys
  distinctly from busy providers so the fix is obvious.
- Demo install ships bundled Spanish, French, Arabic and Chinese translations
  for all demo content — no internet needed for a fully translated showroom.

## 1.0 translation coverage
- Every visible interface string is registered for translation (previously ~50
  were rendered but never registered, so they always fell back to English).
- Bundled Spanish, French, Arabic and Chinese translations now cover the full
  interface as well as all demo content — menus, plan feature labels, tool
  badges, showcase captions, testimonials, footer and account tabs included.

## 1.0 admin + translation completeness
- Admin → Customers: edit any account's name, email and password; administrators
  appear in the list and need their current password to change an admin password.
  One click emails a user their updated sign-in details.
- All four bundled languages now cover 100% of the interface (verified by an
  automated key-coverage check) — no internet needed for a fully translated site.
