import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'
import type { Dashboard } from './shared'
import { buildAgentCodeInput } from './shared'

export interface DashboardStore {
  dashboard: Ref<Dashboard | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<Dashboard | null>
}

export function useDashboardStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): DashboardStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getDashboard', buildAgentCodeInput(agentCode.value)]
    },
    refetchOnShow: true,
    showLoading: '加载业绩中...',
  })

  return {
    dashboard: data as Ref<Dashboard | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
