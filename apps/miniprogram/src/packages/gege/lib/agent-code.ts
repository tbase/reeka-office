const AGENT_CODE_REGEX = /^[A-Z0-9]{8}$/

export function parseRouteAgentCode(
  value: unknown,
): {
  agentCode: string | null
  error: string | null
} {
  if (typeof value !== 'string') {
    return {
      agentCode: null,
      error: null,
    }
  }

  const normalizedAgentCode = value.trim().toUpperCase()

  if (!normalizedAgentCode) {
    return {
      agentCode: null,
      error: null,
    }
  }

  if (!AGENT_CODE_REGEX.test(normalizedAgentCode)) {
    return {
      agentCode: null,
      error: '代理人编码不合法',
    }
  }

  return {
    agentCode: normalizedAgentCode,
    error: null,
  }
}

export function buildPageUrl(
  path: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const query = Object.entries(params)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    })
    .join('&')

  return query
    ? `${path}?${query}`
    : path
}
