import type { Ref } from 'wevu'

import type { RpcError, RpcOutput } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'

type ResourceContent = RpcOutput<'cms/getResourceContent'>
type ResourceContents = RpcOutput<'cms/listResourceContents'>

export interface ResourceContentStore {
  data: Ref<ResourceContent | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<ResourceContent | null>
}

export interface ResourceContentsStore {
  data: Ref<ResourceContents | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<ResourceContents | null>
}

export function useResourceContentStore(resourceId: Ref<string>): ResourceContentStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      const id = Number(resourceId.value)

      if (!Number.isInteger(id) || id <= 0) {
        return undefined
      }

      return ['cms/getResourceContent', { id }]
    },
    showLoading: '加载详情中...',
  })

  return {
    data: data as Ref<ResourceContent | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useResourceContentsStore(): ResourceContentsStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['cms/listResourceContents', undefined],
    showLoading: '加载资源中...',
  })

  return {
    data: data as Ref<ResourceContents | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
