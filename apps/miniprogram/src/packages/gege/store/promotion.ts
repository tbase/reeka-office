import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'
import type { Promotion } from './shared'
import { buildAgentCodeInput } from './shared'

export interface PromotionStore {
  promotion: Ref<Promotion | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<Promotion | null>
}

export function usePromotionStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): PromotionStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getPromotion', buildAgentCodeInput(agentCode.value)]
    },
    refetchOnShow: true,
    showLoading: '加载晋级中...',
  })

  return {
    promotion: data as Ref<Promotion | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
