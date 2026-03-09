import { computed, type ComputedRef, type Ref } from 'wevu'
import { invalidateQueries, useQuery } from '@/hooks/useQuery'
import type { RpcError, RpcOutput } from '@/lib/rpc'

type GetUserResult = Exclude<RpcOutput<'user/getCurrentUser'>, null>

export interface UserStore {
  user: Ref<GetUserResult | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  isAgent: ComputedRef<boolean>
  refetch: () => Promise<GetUserResult | null>
  invalidate: () => void
}

let userStore: UserStore | null = null

export function useUserStore(): UserStore {
  if (userStore) {
    return userStore
  }

  const { data, loading, error, refetch, invalidate } = useQuery({
    queryKey: ['user/getCurrentUser', undefined],
  })

  const isAgent = computed(() => Boolean(data.value?.agentCode))

  userStore = {
    user: data as Ref<GetUserResult | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    isAgent,
    refetch: refetch as () => Promise<GetUserResult | null>,
    invalidate: () => {
      invalidate()
      invalidateQueries('user/getCurrentUser')
    },
  }

  return userStore
}
