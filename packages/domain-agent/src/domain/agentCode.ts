export type AgentCode = string

export function normalizeAgentCode(value: string, label = '代理人编码'): AgentCode {
  const agentCode = value.trim()

  if (!agentCode) {
    throw new Error(`${label}不能为空`)
  }

  if (agentCode.length > 8) {
    throw new Error(`${label}过长: ${agentCode}`)
  }

  return agentCode
}
