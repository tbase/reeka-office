import type { Ref } from 'wevu'
import type { RpcError, RpcInput, RpcOutput } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'

export type CustomerTypeConfig = RpcOutput<'crm/getCustomerTypeConfig'>
export type CustomerList = RpcOutput<'crm/listCustomers'>
export type CustomerDetail = RpcOutput<'crm/getCustomer'>

export function useCustomerTypeConfigStore(customerTypeId: Ref<number | null>): {
  customerType: Ref<CustomerTypeConfig | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<CustomerTypeConfig | null>
} {
  const { data, loading, error, refetch: refetchQuery } = useQuery({
    queryKey: () => {
      if (!customerTypeId.value) {
        return undefined
      }

      return ['crm/getCustomerTypeConfig', { customerTypeId: customerTypeId.value }]
    },
    showLoading: '加载客户配置中...',
  })

  async function refetch(): Promise<CustomerTypeConfig | null> {
    if (!customerTypeId.value) {
      return null
    }

    return refetchQuery()
  }

  return {
    customerType: data as Ref<CustomerTypeConfig | null>,
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
  const { data, loading, error, refetch: refetchQuery } = useQuery({
    queryKey: () => {
      if (!filters.value) {
        return undefined
      }

      return ['crm/listCustomers', filters.value]
    },
    refetchOnShow: true,
    showLoading: '加载客户中...',
  })

  async function refetch(): Promise<CustomerList | null> {
    if (!filters.value) {
      return null
    }

    return refetchQuery()
  }

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
