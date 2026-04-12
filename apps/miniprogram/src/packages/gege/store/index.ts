import type { Ref } from 'wevu'

import type { RpcError, RpcOutput } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'

type Dashboard = RpcOutput<'gege/getDashboard'>
type MetricChart = RpcOutput<'gege/getMetricChart'>
type MyPerformanceHistory = RpcOutput<'gege/getMyPerformanceHistory'>
type MyPerformanceMeta = RpcOutput<'gege/getMyPerformanceMeta'>
type TeamMembers = RpcOutput<'gege/listTeamMembers'>
type MemberDetail = RpcOutput<'gege/getTeamMemberDetail'>

export interface DashboardStore {
  dashboard: Ref<Dashboard | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<Dashboard | null>
}

export interface MyPerformanceMetaStore {
  meta: Ref<MyPerformanceMeta | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<MyPerformanceMeta | null>
}

export interface MyPerformanceHistoryStore {
  history: Ref<MyPerformanceHistory | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<MyPerformanceHistory | null>
}

export interface MetricChartStore {
  chart: Ref<MetricChart | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<MetricChart | null>
}

export interface TeamMembersStore {
  team: Ref<TeamMembers | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<TeamMembers | null>
}

export interface MemberDetailStore {
  detail: Ref<MemberDetail | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<MemberDetail | null>
}

export function useDashboardStore(): DashboardStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['gege/getDashboard', undefined],
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

export function useMyPerformanceMetaStore(): MyPerformanceMetaStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['gege/getMyPerformanceMeta', undefined],
    refetchOnShow: true,
    showLoading: '加载业绩中...',
  })

  return {
    meta: data as Ref<MyPerformanceMeta | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useMyPerformanceHistoryStore(
  year: Ref<number | null>,
): MyPerformanceHistoryStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (year.value == null) {
        return undefined
      }

      return ['gege/getMyPerformanceHistory', { year: year.value }]
    },
    refetchOnShow: true,
    showLoading: '加载业绩中...',
  })

  return {
    history: data as Ref<MyPerformanceHistory | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useMetricChartStore(
  year: Ref<number | null>,
  metricName: Ref<'nsc' | 'netCase' | null>,
  scope: Ref<'self' | 'direct' | 'all' | null>,
  enabled: Ref<boolean>,
): MetricChartStore {
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
    showLoading: '加载图表中...',
  })

  return {
    chart: data as Ref<MetricChart | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useTeamMembersStore(
  scope: Ref<'direct' | 'all'>,
  year: Ref<number | null>,
  month: Ref<number | null>,
): TeamMembersStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => ['gege/listTeamMembers', {
      scope: scope.value,
      ...(year.value != null && month.value != null
        ? {
            year: year.value,
            month: month.value,
          }
        : {}),
    }],
    refetchOnShow: true,
    showLoading: '加载团队数据中...',
  })

  return {
    team: data as Ref<TeamMembers | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useMemberDetailStore(
  agentCode: Ref<string>,
  year: Ref<number | null>,
): MemberDetailStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      const code = agentCode.value.trim()

      return ['gege/getTeamMemberDetail', year.value
        ? { agentCode: code, year: year.value }
        : { agentCode: code }]
    },
    refetchOnShow: true,
    showLoading: '加载成员详情中...',
  })

  return {
    detail: data as Ref<MemberDetail | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
