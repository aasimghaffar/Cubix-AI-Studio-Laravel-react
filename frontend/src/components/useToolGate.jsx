import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ToolAccessModal from './ToolAccessModal'

/**
 * openTool(tool): navigates straight in when allowed:
 *  - guests: login popup (free tools require an account too)
 *  - signed-in without plan: allowed if the tool is free-enabled, else plans popup
 *  - subscribers: always allowed
 */
export function useToolGate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gate, setGate] = useState(null)

  const openTool = (tool) => {
    const slug = typeof tool === 'string' ? tool : tool.slug
    const isFree = typeof tool === 'object' && tool.free_enabled
    const path = `/tools/${slug}`

    if (!user) { setGate({ type: 'login', path }); return }
    if (!user.active_subscription && !isFree) { setGate({ type: 'plans', path }); return }
    navigate(path)
  }

  const modal = gate
    ? <ToolAccessModal gate={gate.type} toolPath={gate.path} onClose={() => setGate(null)} />
    : null

  return { openTool, modal }
}
