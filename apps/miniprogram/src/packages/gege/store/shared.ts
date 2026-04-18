import type { RpcOutput } from '@/lib/rpc'

export type Dashboard = RpcOutput<'gege/getDashboard'>
export type MetricChart = RpcOutput<'gege/getMetricChart'>
export type MyPerformanceHistory = RpcOutput<'gege/getMyPerformanceHistory'>
export type MyPerformanceMeta = RpcOutput<'gege/getMyPerformanceMeta'>
export type OrgTree = RpcOutput<'gege/getOrgTree'>
export type TeamMeta = RpcOutput<'gege/getTeamMeta'>
export type TeamStats = RpcOutput<'gege/getTeamStats'>
export type TeamMembersPage = RpcOutput<'gege/listTeamMembers'>
export type SearchAgentsResult = RpcOutput<'gege/searchAgents'>
export type SearchAgent = SearchAgentsResult['agents'][number]
export type TeamMember = TeamMembersPage['members'][number]
export type TeamScope = 'direct' | 'division' | 'all'

export const DEFAULT_TEAM_PAGE_SIZE = 20
export const DEFAULT_AGENT_SEARCH_LIMIT = 20
export const DEFAULT_SEARCH_DEBOUNCE_MS = 300

export function buildAgentCodeInput(agentCode: string | null): { agentCode: string } | undefined {
  const code = agentCode?.trim()

  return code
    ? { agentCode: code }
    : undefined
}
