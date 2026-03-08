import { type Ref } from 'wevu'

import { useQuery } from '@/hooks/useQuery'
import type { RpcError, RpcOutput } from '@/lib/rpc'

type FamilyOfficeResources = RpcOutput<'cms/listFamilyOfficeResources'>
type FamilyOfficeResourceDetail = RpcOutput<'cms/getFamilyOfficeResourceDetail'>

export interface FamilyOfficeResourcesStore {
  data: Ref<FamilyOfficeResources | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<FamilyOfficeResources | null>
}

export interface FamilyOfficeResourceDetailStore {
  detail: Ref<FamilyOfficeResourceDetail | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<FamilyOfficeResourceDetail | null>
}

export function useFamilyOfficeResourcesStore(): FamilyOfficeResourcesStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['cms/listFamilyOfficeResources', {}],
  })

  return {
    data: data as Ref<FamilyOfficeResources | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useFamilyOfficeResourceDetailStore(id: Ref<string>): FamilyOfficeResourceDetailStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!id.value) {
        return undefined
      }

      return ['cms/getFamilyOfficeResourceDetail', { id: id.value }]
    },
  })

  return {
    detail: data as Ref<FamilyOfficeResourceDetail | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
