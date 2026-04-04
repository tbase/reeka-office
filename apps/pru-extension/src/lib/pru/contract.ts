export const AES_URL = "https://aes.prudential.com.hk/"
export const SALESFORCE_URL = "https://salesforce.prudential.com.hk/"
export const AES_ENDPOINT = "https://aes.prudential.com.hk/aes/AESServlet?type=iPC&module=agent"
export const REQUEST_INTERVAL_MS = 800
export const AGENT_CODE_PATTERN = /^0\d{7}$/

export type AgentRow = {
  agent_code: string
  pinyin: string
  designation: string
  leader_code: string
  join_date: string
  financing_scheme: string
  financing_advance: string
  agency: string
  division: string
}

export type SalesMonthRow = {
  month: string
  year: string
  agent_code: string
  pinyin: string
  net_afyp: number
  net_afyp_assigned: number
  net_case: number
  net_case_assigned: number
  nsc: number
  is_qualified: number
  is_qualified_assigned: number
  net_afyp_sum: number
  net_afyp_assigned_sum: number
  net_case_sum: number
  net_case_assigned_sum: number
  nsc_sum: number
  net_afyc_sum: number
  nsc_hp: number
  nsc_hp_sum: number
  net_afyp_hp: number
  net_afyp_hp_sum: number
  net_afyp_h: number
  net_afyp_h_sum: number
  net_case_h: number
  net_case_h_sum: number
  renewal_rate_team: number
}

export type SalesMonthCacheStats = {
  reusedFull: number
  reusedSumOnly: number
  refreshed: number
}

export type FetchSalesMonthResult = {
  rows: SalesMonthRow[]
  cacheSourcePath: string
  cache: SalesMonthCacheStats
}

export type ProgressHandler = (message: string) => void
