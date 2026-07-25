import { createPortal } from 'react-dom'

/**
 * Renders children at document.body. Popups MUST use this: ancestors with
 * transform / will-change / backdrop-filter hijack position:fixed and make
 * modals appear off-center or hidden inside sections.
 */
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
