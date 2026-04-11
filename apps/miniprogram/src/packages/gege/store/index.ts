import type { Ref } from 'wevu'

import type { RpcError, RpcOutput } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'

type GegeDashboard = RpcOutput<'gege/getDashboard'>
type GegeMetricChart = RpcOutput<'gege/getMetricChart'>
type GegeMyPerformance = RpcOutput<'gege/getMyPerformance'>
type GegeTeamMembers = RpcOutput<'gege/listTeamMembers'>
type GegeMemberDetail = RpcOutput<'gege/getTeamMemberDetail'>

export interface GegeDashboardStore {
  dashboard: Ref<GegeDashboard | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<GegeDashboard | null>
}

export interface GegeMyPerformanceStore {
  performance: Ref<GegeMyPerformance | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<GegeMyPerformance | null>
}

export interface GegeMetricChartStore {
  chart: Ref<GegeMetricChart | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<GegeMetricChart | null>
}

export interface GegeTeamMembersStore {
  team: Ref<GegeTeamMembers | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<GegeTeamMembers | null>
}

export interface GegeMemberDetailStore {
  detail: Ref<GegeMemberDetail | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<GegeMemberDetail | null>
}

export function useGegeDashboardStore(): GegeDashboardStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['gege/getDashboard', undefined],
    refetchOnShow: true,
  })

  return {
    dashboard: data as Ref<GegeDashboard | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useGegeMyPerformanceStore(
  year: Ref<number | null>,
): GegeMyPerformanceStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['gege/getMyPerformance', year.value ? { year: year.value } : {}],
    refetchOnShow: true,
  })

  return {
    performance: data as Ref<GegeMyPerformance | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useGegeMetricChartStore(
  year: Ref<number | null>,
  metricName: Ref<'nsc' | 'netCase' | null>,
  scope: Ref<'self' | 'direct' | 'all' | null>,
  enabled: Ref<boolean>,
): GegeMetricChartStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (
        !enabled.value
        || year.value == null
        || !metricName.value
        || !scope.value
      ) {
        return undefined
      }

      return ['gege/getMetricChart', {
        year: year.value,
        metricName: metricName.value,
        scope: scope.value,
      }]
    },
  })

  return {
    chart: data as Ref<GegeMetricChart | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useGegeTeamMembersStore(
  scope: Ref<'direct' | 'all'>,
): GegeTeamMembersStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['gege/listTeamMembers', { scope: scope.value }],
    refetchOnShow: true,
  })

  return {
    team: data as Ref<GegeTeamMembers | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useGegeMemberDetailStore(
  agentCode: Ref<string>,
  year: Ref<number | null>,
): GegeMemberDetailStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      const code = agentCode.value.trim()

      return ['gege/getTeamMemberDetail', year.value
        ? { agentCode: code, year: year.value }
        : { agentCode: code }]
    },
    refetchOnShow: true,
  })

  return {
    detail: data as Ref<GegeMemberDetail | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
