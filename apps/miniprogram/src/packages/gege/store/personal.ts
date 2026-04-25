import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { useQuery } from '@/hooks/useQuery'
import type {
  AgentLogs,
  MetricChart,
  MyPerformanceHistory,
  MyPerformanceMeta,
} from './shared'
import { buildAgentCodeInput } from './shared'

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

export interface AgentLogsStore {
  logs: Ref<AgentLogs | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<AgentLogs | null>
}

export function useMyPerformanceMetaStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): MyPerformanceMetaStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getMyPerformanceMeta', buildAgentCodeInput(agentCode.value)]
    },
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
  agentCode: Ref<string | null>,
  year: Ref<number | null>,
  enabled: Ref<boolean>,
): MyPerformanceHistoryStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value || year.value == null) {
        return undefined
      }

      return ['gege/getMyPerformanceHistory', {
        ...buildAgentCodeInput(agentCode.value),
        year: year.value,
      }]
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
  agentCode: Ref<string | null>,
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
        ...buildAgentCodeInput(agentCode.value),
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

export function useAgentLogsStore(
  agentCode: Ref<string | null>,
  category: Ref<'all' | 'profile' | 'apm'>,
  enabled: Ref<boolean>,
): AgentLogsStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/listAgentLogs', {
        ...buildAgentCodeInput(agentCode.value),
        category: category.value,
        limit: 50,
      }]
    },
    refetchOnShow: true,
    showLoading: '加载日志中...',
  })

  return {
    logs: data as Ref<AgentLogs | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}
