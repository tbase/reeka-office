import { computed, type ComputedRef, type Ref } from 'wevu'
import { useQuery } from '@/hooks/useQuery'
import type { RpcError, RpcOutput } from '@/lib/rpc'

type GetUserResult = Exclude<RpcOutput<'user/getCurrentUser'>, null>

export interface UserStore {
  user: Ref<GetUserResult | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  isAgent: ComputedRef<boolean>
}

export function useUserStore(): UserStore {
  const { data, loading, error } = useQuery({
    queryKey: ['user/getCurrentUser', undefined],
  })

  const isAgent = computed(() => Boolean(data.value?.agentCode))

  return {
    user: data as Ref<GetUserResult | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    isAgent,
  }
}
