/**
 * Global micro-interactions — spotlight cards, magnetic buttons, click ripples.
 * Dependency-free, event-delegated (one set of listeners for the whole app),
 * disabled automatically for prefers-reduced-motion.
 */
let initialized = false

export function initFx() {
  if (initialized || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  initialized = true

  // ── Spotlight: cards get a light that follows the cursor ──
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spotlight')
    if (card) {
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }

    // ── Magnetic: buttons lean toward the cursor ──
    const mag = e.target.closest?.('.magnetic')
    if (mag) {
      const r = mag.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      mag.style.transform = `translate(${dx * 0.12}px, ${dy * 0.18}px)`
    }

    // ── Tilt: panels rotate subtly in 3D ──
    const tilt = e.target.closest?.('.tilt')
    if (tilt) {
      const r = tilt.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      tilt.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-2px)`
    }
  }, { passive: true })

  document.addEventListener('pointerout', (e) => {
    const mag = e.target.closest?.('.magnetic')
    if (mag && !mag.contains(e.relatedTarget)) mag.style.transform = ''
    const tilt = e.target.closest?.('.tilt')
    if (tilt && !tilt.contains(e.relatedTarget)) tilt.style.transform = ''
  }, { passive: true })

  // ── Ripple on every button click ──
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('button, .btn-brand, .btn-ghost, a[class*="btn"]')
    if (!btn || btn.disabled) return
    const r = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'fx-ripple'
    const size = Math.max(r.width, r.height) * 2
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - r.left - size / 2}px`
    ripple.style.top = `${e.clientY - r.top - size / 2}px`
    const cs = getComputedStyle(btn)
    if (cs.position === 'static') btn.style.position = 'relative'
    if (cs.overflow !== 'hidden') btn.style.overflow = 'hidden'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 650)
  }, { passive: true })
}
