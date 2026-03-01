import { computed, type ComputedRef, type Ref } from 'wevu'

import { useQuery } from '@/hooks/useQuery'
import type { RpcError, RpcOutput } from '@/lib/rpc'
import { useUserStore } from './user'

type MineSummary = RpcOutput<'point/getMineSummary'>
type RedeemItems = RpcOutput<'point/listRedeemItems'>
type PointRecords = RpcOutput<'point/listPointRecords'>
type RedeemDetail = RpcOutput<'point/getRedeemDetail'>
type PointRuleScenes = RpcOutput<'point/listPointRuleScenes'>
type PointRules = RpcOutput<'point/listPointRules'>

const defaultRedeemDetail: RedeemDetail = {
  memberPoints: 0,
  item: {
    id: '',
    name: '',
    cost: 0,
    stock: 0,
    desc: '',
    notes: [],
  },
}

export interface PointSummaryStore {
  summary: Ref<MineSummary | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  agentCode: ComputedRef<string | undefined>
}

export interface RedeemItemsStore {
  items: Ref<RedeemItems | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
}

export interface PointRecordsStore {
  records: Ref<PointRecords | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  agentCode: ComputedRef<string | undefined>
}

export interface RedeemDetailStore {
  detail: Ref<RedeemDetail | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  agentCode: ComputedRef<string | undefined>
  refetch: () => Promise<RedeemDetail | null>
}

export interface PointRuleScenesStore {
  scenes: Ref<PointRuleScenes | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
}

export interface PointRulesStore {
  rules: Ref<PointRules | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
}

function useAgentCode(): ComputedRef<string | undefined> {
  const { user } = useUserStore()

  return computed(() => {
    const code = user.value?.agentCode?.trim().toUpperCase()
    if (!code) return undefined

    return /^[A-Z0-9]{8}$/.test(code) ? code : undefined
  })
}

export function usePointSummaryStore(): PointSummaryStore {
  const agentCode = useAgentCode()
  const { data, loading, error } = useQuery({
    queryKey: () => ['point/getMineSummary', { agentCode: agentCode.value }],
  })

  return {
    summary: data as Ref<MineSummary | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    agentCode,
  }
}

export function useRedeemItemsStore(): RedeemItemsStore {
  const { data, loading, error } = useQuery({
    queryKey: ['point/listRedeemItems', undefined],
  })

  return {
    items: data as Ref<RedeemItems | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
  }
}

export function usePointRecordsStore(): PointRecordsStore {
  const agentCode = useAgentCode()
  const { data, loading, error } = useQuery({
    queryKey: () => ['point/listPointRecords', { agentCode: agentCode.value }],
  })

  return {
    records: data as Ref<PointRecords | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    agentCode,
  }
}

export function useRedeemDetailStore(itemId: string): RedeemDetailStore {
  const agentCode = useAgentCode()
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['point/getRedeemDetail', { itemId, agentCode: agentCode.value }],
    initialData: defaultRedeemDetail,
  })

  return {
    detail: data as Ref<RedeemDetail | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    agentCode,
    refetch,
  }
}

export function usePointRuleScenesStore(): PointRuleScenesStore {
  const { data, loading, error } = useQuery({
    queryKey: ['point/listPointRuleScenes', undefined],
  })

  return {
    scenes: data as Ref<PointRuleScenes | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
  }
}

export function usePointRulesStore(): PointRulesStore {
  const { data, loading, error } = useQuery({
    queryKey: ['point/listPointRules', undefined],
  })

  return {
    rules: data as Ref<PointRules | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
  }
}
