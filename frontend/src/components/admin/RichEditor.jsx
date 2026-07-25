import { useEffect, useRef } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3,
  Type, ChevronDownSquare, Link2, RemoveFormatting, Pilcrow,
} from 'lucide-react'

/**
 * Self-contained rich text editor (no external libraries).
 * Produces plain HTML — headings, bold/italic/underline, bullet & numbered
 * lists, font sizes, links, and open/close accordion sections.
 */
export default function RichEditor({ value, onChange }) {
  const ref = useRef(null)

  // Load initial content once (not on every keystroke, or the caret jumps)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value ?? '')) {
      ref.current.innerHTML = value ?? ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = () => onChange(ref.current?.innerHTML ?? '')

  const cmd = (command, arg = null) => {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    emit()
  }

  const insertAccordion = () => {
    ref.current?.focus()
    document.execCommand('insertHTML', false,
      '<details><summary>Section title — click to open/close</summary><p>Section content…</p></details><p><br></p>')
    emit()
  }

  const insertLink = () => {
    const url = prompt('Link URL (https://…):')
    if (url) cmd('createLink', url)
  }

  const btn = 'p-2 rounded-lg text-slate-300 hover:bg-ink-800 hover:text-white transition'

  return (
    <div className="rounded-2xl border border-ink-700 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-700 bg-ink-800/60 px-2 py-1.5">
        <button type="button" className={btn} title="Bold" onClick={() => cmd('bold')}><Bold size={15} /></button>
        <button type="button" className={btn} title="Italic" onClick={() => cmd('italic')}><Italic size={15} /></button>
        <button type="button" className={btn} title="Underline" onClick={() => cmd('underline')}><Underline size={15} /></button>
        <span className="w-px h-5 bg-ink-700 mx-1" />
        <button type="button" className={btn} title="Heading" onClick={() => cmd('formatBlock', '<h2>')}><Heading2 size={15} /></button>
        <button type="button" className={btn} title="Sub-heading" onClick={() => cmd('formatBlock', '<h3>')}><Heading3 size={15} /></button>
        <button type="button" className={btn} title="Normal paragraph" onClick={() => cmd('formatBlock', '<p>')}><Pilcrow size={15} /></button>
        <span className="w-px h-5 bg-ink-700 mx-1" />
        <button type="button" className={btn} title="Bullet list" onClick={() => cmd('insertUnorderedList')}><List size={15} /></button>
        <button type="button" className={btn} title="Numbered list" onClick={() => cmd('insertOrderedList')}><ListOrdered size={15} /></button>
        <span className="w-px h-5 bg-ink-700 mx-1" />
        <span className="inline-flex items-center gap-1 px-1" title="Font size">
          <Type size={14} className="text-slate-400" />
          <select className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
            defaultValue="" onChange={(e) => { if (e.target.value) { cmd('fontSize', e.target.value); e.target.value = '' } }}>
            <option value="" disabled>Size</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="6">Huge</option>
          </select>
        </span>
        <span className="w-px h-5 bg-ink-700 mx-1" />
        <button type="button" className={btn} title="Insert link" onClick={insertLink}><Link2 size={15} /></button>
        <button type="button" className={`${btn} inline-flex items-center gap-1.5 !px-2.5 text-xs`}
          title="Insert an open/close section" onClick={insertAccordion}>
          <ChevronDownSquare size={15} /> Open/close section
        </button>
        <span className="flex-1" />
        <button type="button" className={btn} title="Clear formatting" onClick={() => cmd('removeFormat')}><RemoveFormatting size={15} /></button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="rich-editor-canvas p-5 text-sm text-slate-200 bg-ink-900/60"
        onInput={emit}
        onBlur={emit}
      />
    </div>
  )
}
