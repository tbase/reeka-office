import type { Ref } from 'wevu'
import type { RpcError, RpcInput, RpcOutput } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'

export type CustomerTypeConfigs = RpcOutput<'crm/listCustomerTypes'>
export type CustomerList = RpcOutput<'crm/listCustomers'>
export type CustomerDetail = RpcOutput<'crm/getCustomer'>

export function useCustomerTypesStore(): {
  customerTypes: Ref<CustomerTypeConfigs | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<CustomerTypeConfigs | null>
} {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['crm/listCustomerTypes', undefined],
    showLoading: '加载客户配置中...',
  })

  return {
    customerTypes: data as Ref<CustomerTypeConfigs | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useCustomersStore(filters: Ref<RpcInput<'crm/listCustomers'>>): {
  customers: Ref<CustomerList | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<CustomerList | null>
} {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['crm/listCustomers', filters.value],
    refetchOnShow: true,
    showLoading: '加载客户中...',
  })

  return {
    customers: data as Ref<CustomerList | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useCustomerDetailStore(customerId: Ref<number | null>): {
  customer: Ref<CustomerDetail | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<CustomerDetail | null>
} {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!customerId.value) {
        return undefined
      }

      return ['crm/getCustomer', { customerId: customerId.value }]
    },
    refetchOnShow: true,
    showLoading: '加载客户详情中...',
  })

  return {
    customer: data as Ref<CustomerDetail | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
