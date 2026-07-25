import SettingsForm from '../../components/admin/SettingsForm'

const FREE = { value: 'pollinations', label: 'Pollinations — FREE, no key needed' }
const TEXT_ENGINES = [
  { value: 'openai', label: 'OpenAI GPT-4o mini' },
  { value: 'gemini', label: 'Google Gemini 2.0 Flash' },
  { value: 'claude', label: 'Anthropic Claude Haiku' },
  { value: 'deepseek', label: 'DeepSeek Chat' },
  { value: 'mistral', label: 'Mistral Small' },
  { value: 'groq', label: 'Groq — Llama 3.3 70B (very fast)' },
]

const SECTIONS = [
  { title: 'Image tools', note: 'Pollinations is FREE with no API key and returns 4 variations per run — but it is not unlimited: the free tier is rate-limited (roughly a few requests per minute per server) and speed can vary at busy times. Perfect for demos and normal traffic; for heavy production use, a keyed engine (OpenAI / Stability) is steadier. Paid engines return 1–2 higher-quality images.', keys: [
    { key: 'engine_ai-image-generator', label: 'AI Image Generator', type: 'dropdown', testable: true, default: 'pollinations', options: [
      FREE,
      { value: 'openai', label: 'OpenAI DALL·E 3' },
      { value: 'gemini', label: 'Google Imagen 3 (Gemini key)' },
      { value: 'stable_diffusion', label: 'Stability AI' },
    ]},
    { key: 'engine_ai-background-removal', label: 'AI Background Removal', type: 'dropdown', testable: true, default: 'clipdrop', options: [
      { value: 'clipdrop', label: 'Clipdrop' },
      { value: 'removebg', label: 'remove.bg' },
    ]},
  ]},
  { title: 'Text tools', note: 'Text tools need one API key. Gemini (aistudio.google.com) and Groq (console.groq.com) offer FREE keys that take a minute to create; OpenAI and the others are paid. Each tool can use a different engine.', keys: [
    { key: 'engine_ai-content-writer',     label: 'AI Content Writer',     type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
    { key: 'engine_ai-translator',         label: 'AI Translator',         type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
    { key: 'engine_ai-document-assistant', label: 'AI Document Assistant', type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
    { key: 'engine_ai-chat-assistant',     label: 'AI Chat Assistant',     type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
    { key: 'engine_ai-text-rewriter',      label: 'AI Grammar & Rewriter', type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
    { key: 'engine_ai-summarizer',         label: 'AI Summarizer',         type: 'dropdown', testable: true, default: 'openai', options: TEXT_ENGINES },
  ]},
  { title: 'Audio tools', note: 'Audio always requires a key for the selected engine.', keys: [
    { key: 'engine_ai-text-to-audio', label: 'AI Text to Audio', type: 'dropdown', testable: true, default: 'elevenlabs', options: [
      { value: 'elevenlabs', label: 'ElevenLabs' },
      { value: 'openai', label: 'OpenAI TTS' },
    ]},
  ]},
]

export default function AiEngines() {
  return (
    <SettingsForm
      title="AI engines"
      intro="Choose which AI powers each tool. Engines that aren't free need their API key added on the API Keys page."
      sections={SECTIONS}
      saveLabel="Save engines"
    />
  )
}
