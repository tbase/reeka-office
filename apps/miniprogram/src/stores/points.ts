import type { ComputedRef, Ref } from 'wevu'

import type { RpcError, RpcOutput } from '@/lib/rpc'
import { computed } from 'wevu'
import { useQuery } from '@/hooks/useQuery'
import { useUserStore } from './user'

type MineSummary = RpcOutput<'points/getMineSummary'>
type RedeemItems = RpcOutput<'points/listRedeemItems'>
type PointRecords = RpcOutput<'points/listPointRecords'>
type PointRuleScenes = RpcOutput<'points/listPointRuleScenes'>
type PointRules = RpcOutput<'points/listPointRules'>

export interface PointSummaryStore {
  summary: Ref<MineSummary | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  agentCode: ComputedRef<string | undefined>
  refetch: () => Promise<MineSummary | null>
}

export interface RedeemItemsStore {
  items: Ref<RedeemItems | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<RedeemItems | null>
}

export interface PointRecordsStore {
  records: Ref<PointRecords | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  agentCode: ComputedRef<string | undefined>
  refetch: () => Promise<PointRecords | null>
}

export interface PointRuleScenesStore {
  scenes: Ref<PointRuleScenes | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<PointRuleScenes | null>
}

export interface PointRulesStore {
  rules: Ref<PointRules | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<PointRules | null>
}

const AGENT_CODE_REGEXP = /^[A-Z0-9]{8}$/

function useAgentCode(): ComputedRef<string | undefined> {
  const { user } = useUserStore()

  return computed(() => {
    const code = user.value?.agentCode
    if (!code) {
      return undefined
    }

    return AGENT_CODE_REGEXP.test(code) ? code : undefined
  })
}

export function usePointSummaryStore(): PointSummaryStore {
  const agentCode = useAgentCode()
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['points/getMineSummary', { agentCode: agentCode.value }],
    showLoading: '加载积分中...',
  })

  return {
    summary: data as Ref<MineSummary | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    agentCode,
    refetch,
  }
}

export function useRedeemItemsStore(): RedeemItemsStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['points/listRedeemItems', {}],
    showLoading: '加载积分中...',
  })

  return {
    items: data as Ref<RedeemItems | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function usePointRecordsStore(): PointRecordsStore {
  const agentCode = useAgentCode()
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['points/listPointRecords', { agentCode: agentCode.value }],
  })

  return {
    records: data as Ref<PointRecords | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    agentCode,
    refetch,
  }
}

export function usePointRuleScenesStore(): PointRuleScenesStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['points/listPointRuleScenes', undefined],
  })

  return {
    scenes: data as Ref<PointRuleScenes | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function usePointRulesStore(): PointRulesStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['points/listPointRules', undefined],
  })

  return {
    rules: data as Ref<PointRules | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
