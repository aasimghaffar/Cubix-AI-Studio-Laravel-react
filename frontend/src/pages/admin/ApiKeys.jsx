import SettingsForm from '../../components/admin/SettingsForm'

const SECTIONS = [
  { title: 'AI provider keys', note: 'Add keys only for the engines you selected on the AI Engines page. Pollinations needs no key at all.', keys: [
    { key: 'openai_api_key',           label: 'OpenAI — DALL·E images, GPT text, TTS audio',      provider: 'openai' },
    { key: 'gemini_api_key',           label: 'Google Gemini — Imagen 3 images + Gemini text (aistudio.google.com)', provider: 'gemini' },
    { key: 'claude_api_key',           label: 'Anthropic Claude — text tools (console.anthropic.com)', provider: 'claude' },
    { key: 'deepseek_api_key',         label: 'DeepSeek — text tools (platform.deepseek.com)',    provider: 'deepseek' },
    { key: 'mistral_api_key',          label: 'Mistral — text tools (console.mistral.ai)',        provider: 'mistral' },
    { key: 'groq_api_key',             label: 'Groq — very fast Llama text (console.groq.com)',   provider: 'groq' },
    { key: 'stable_diffusion_api_key', label: 'Stability AI — images (platform.stability.ai)',    provider: 'stable_diffusion' },
    { key: 'clipdrop_api_key',         label: 'Clipdrop — background removal (clipdrop.co/apis)', provider: 'clipdrop' },
    { key: 'removebg_api_key',         label: 'remove.bg — background removal (remove.bg/api)',   provider: 'removebg' },
    { key: 'elevenlabs_api_key',       label: 'ElevenLabs — text-to-audio voices (elevenlabs.io)', provider: 'elevenlabs' },
  ]},
]

export default function ApiKeys() {
  return (
    <SettingsForm
      title="API keys"
      intro="Keys are encrypted before they're stored. Saved keys show only their last 4 characters — leave a field untouched to keep the existing key. Use Test to verify each key."
      sections={SECTIONS}
      saveLabel="Save keys"
    />
  )
}
