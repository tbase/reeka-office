import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'
import type { OrgTree } from './shared'
import { buildAgentCodeInput } from './shared'

export interface OrgTreeStore {
  tree: Ref<OrgTree | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<OrgTree | null>
}

export function useOrgTreeStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): OrgTreeStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getOrgTree', buildAgentCodeInput(agentCode.value)]
    },
    refetchOnShow: true,
    showLoading: '加载组织架构中...',
  })

  return {
    tree: data as Ref<OrgTree | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
