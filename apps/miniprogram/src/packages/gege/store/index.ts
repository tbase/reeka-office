import type { Ref } from 'wevu'

import type { RpcError, RpcOutput } from '@/lib/rpc'
import { computed, onShow, onUnload, onUnmounted, ref, shallowRef, watch } from 'wevu'
import { useQuery } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { rpc } from '@/lib/rpc'

type Dashboard = RpcOutput<'gege/getDashboard'>
type MetricChart = RpcOutput<'gege/getMetricChart'>
type MyPerformanceHistory = RpcOutput<'gege/getMyPerformanceHistory'>
type MyPerformanceMeta = RpcOutput<'gege/getMyPerformanceMeta'>
type OrgTree = RpcOutput<'gege/getOrgTree'>
type TeamMeta = RpcOutput<'gege/getTeamMeta'>
type TeamStats = RpcOutput<'gege/getTeamStats'>
type TeamMembersPage = RpcOutput<'gege/listTeamMembers'>
type SearchAgentsResult = RpcOutput<'gege/searchAgents'>
type SearchAgent = SearchAgentsResult['agents'][number]
type TeamMember = TeamMembersPage['members'][number]
type TeamScope = 'direct' | 'division' | 'all'

const DEFAULT_TEAM_PAGE_SIZE = 20
const DEFAULT_AGENT_SEARCH_LIMIT = 20
const DEFAULT_SEARCH_DEBOUNCE_MS = 300

function buildAgentCodeInput(agentCode: string | null): { agentCode: string } | undefined {
  const code = agentCode?.trim()

  return code
    ? { agentCode: code }
    : undefined
}

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

export interface OrgTreeStore {
  tree: Ref<OrgTree | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<OrgTree | null>
}

export interface TeamMetaStore {
  meta: Ref<TeamMeta | null>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  refetch: () => Promise<TeamMeta | null>
}

export interface TeamStore {
  stats: Ref<TeamStats | null>
  members: Ref<TeamMember[]>
  hasMore: Ref<boolean>
  isLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  statsError: Ref<RpcError | null>
  membersError: Ref<RpcError | null>
  loadMoreError: Ref<RpcError | null>
  error: Ref<RpcError | null>
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
}

export interface AgentSearchStore {
  agents: Ref<SearchAgent[]>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  searchNow: () => Promise<void>
  reset: () => void
}

export function useDashboardStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): DashboardStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      const code = agentCode.value?.trim()

      return ['gege/getDashboard', code
        ? { agentCode: code }
        : undefined]
    },
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

export function useTeamMetaStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
): TeamMetaStore {
  const { data, loading, error, refetch } = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getTeamMeta', buildAgentCodeInput(agentCode.value)]
    },
    refetchOnShow: true,
    showLoading: '加载团队信息中...',
  })

  return {
    meta: data as Ref<TeamMeta | null>,
    isLoading: loading,
    error: error as Ref<RpcError | null>,
    refetch,
  }
}

export function useTeamStore(
  agentCode: Ref<string | null>,
  enabled: Ref<boolean>,
  scope: Ref<TeamScope>,
  year: Ref<number | null>,
  month: Ref<number | null>,
): TeamStore {
  const statsQuery = useQuery({
    queryKey: () => {
      if (!enabled.value) {
        return undefined
      }

      return ['gege/getTeamStats', {
        ...buildAgentCodeInput(agentCode.value),
        scope: scope.value,
        ...(year.value != null && month.value != null
          ? {
              year: year.value,
              month: month.value,
            }
          : {}),
      }]
    },
    refetchOnShow: true,
    showLoading: '加载团队数据中...',
  })
  const members = ref<TeamMember[]>([])
  const hasMore = ref(false)
  const currentPage = ref(1)
  const isLoadingMore = ref(false)
  const isMembersLoading = ref(false)
  const membersError = shallowRef<RpcError | null>(null) as Ref<RpcError | null>
  const loadMoreError = shallowRef<RpcError | null>(null) as Ref<RpcError | null>
  const { hideLoading: hideMembersLoading, showLoading: showMembersLoading } = useToast()

  let hasMembersShownOnce = false
  let latestMembersRequestId = 0

  function buildMembersInput(page: number) {
    return {
      ...buildAgentCodeInput(agentCode.value),
      scope: scope.value,
      ...(year.value != null && month.value != null
        ? {
            year: year.value,
            month: month.value,
          }
        : {}),
      page,
      pageSize: DEFAULT_TEAM_PAGE_SIZE,
    }
  }

  async function fetchMembersPage(
    page: number,
    options: {
      append?: boolean
      showLoadingToast?: boolean
    } = {},
  ): Promise<void> {
    if (!enabled.value) {
      return
    }

    const { append = false, showLoadingToast = false } = options
    const requestId = ++latestMembersRequestId

    if (append) {
      isLoadingMore.value = true
      loadMoreError.value = null
    }
    else {
      isMembersLoading.value = true
      membersError.value = null
      loadMoreError.value = null

      if (showLoadingToast) {
        showMembersLoading('加载团队成员中...')
      }
    }

    const result = await rpc('gege/listTeamMembers', buildMembersInput(page))

    if (requestId !== latestMembersRequestId) {
      return
    }

    if (append) {
      isLoadingMore.value = false
    }
    else {
      isMembersLoading.value = false
      hideMembersLoading()
    }

    if (!result.success) {
      if (append) {
        loadMoreError.value = result.error
      }
      else {
        membersError.value = result.error
      }
      return
    }

    currentPage.value = result.data.page
    hasMore.value = result.data.hasMore
    members.value = append
      ? [...members.value, ...result.data.members]
      : [...result.data.members]
  }

  watch(
    () => [agentCode.value, enabled.value, scope.value, year.value, month.value],
    () => {
      latestMembersRequestId += 1
      hideMembersLoading()
      members.value = []
      hasMore.value = false
      currentPage.value = 1
      isLoadingMore.value = false
      isMembersLoading.value = false
      membersError.value = null
      loadMoreError.value = null

      if (!enabled.value) {
        return
      }

      void fetchMembersPage(1, { showLoadingToast: true })
    },
    { immediate: true },
  )

  onShow(() => {
    if (!hasMembersShownOnce) {
      hasMembersShownOnce = true
      return
    }

    if (!enabled.value) {
      return
    }

    void fetchMembersPage(1)
  })

  async function refetch(): Promise<void> {
    if (!enabled.value) {
      return
    }

    membersError.value = null
    loadMoreError.value = null
    await Promise.all([
      statsQuery.refetch(),
      fetchMembersPage(1),
    ])
  }

  async function loadMore(): Promise<void> {
    if (
      !enabled.value
      || isMembersLoading.value
      || isLoadingMore.value
      || !hasMore.value
    ) {
      return
    }

    await fetchMembersPage(currentPage.value + 1, { append: true })
  }

  const isLoading = computed(() => {
    return statsQuery.loading.value || isMembersLoading.value
  }) as Ref<boolean>
  const error = computed(() => {
    return statsQuery.error.value ?? membersError.value ?? loadMoreError.value
  }) as Ref<RpcError | null>

  return {
    stats: statsQuery.data as Ref<TeamStats | null>,
    members,
    hasMore,
    isLoading,
    isLoadingMore,
    statsError: statsQuery.error as Ref<RpcError | null>,
    membersError,
    loadMoreError,
    error,
    refetch,
    loadMore,
  }
}

export function useAgentSearchStore(
  agentCode: Ref<string | null>,
  keyword: Ref<string>,
  enabled: Ref<boolean>,
): AgentSearchStore {
  const agents = ref<SearchAgent[]>([])
  const isLoading = ref(false)
  const error = shallowRef<RpcError | null>(null) as Ref<RpcError | null>

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let latestRequestId = 0

  function clearDebounceTimer() {
    if (debounceTimer == null) {
      return
    }

    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  function reset() {
    clearDebounceTimer()
    latestRequestId += 1
    isLoading.value = false
    error.value = null
    agents.value = []
  }

  async function search(options: { immediate?: boolean } = {}) {
    const normalizedKeyword = keyword.value.trim()

    clearDebounceTimer()

    if (!enabled.value || normalizedKeyword.length < 2) {
      reset()
      return
    }

    const requestId = ++latestRequestId

    if (!options.immediate) {
      debounceTimer = setTimeout(() => {
        void executeSearch(requestId, normalizedKeyword)
      }, DEFAULT_SEARCH_DEBOUNCE_MS)
      return
    }

    await executeSearch(requestId, normalizedKeyword)
  }

  async function executeSearch(requestId: number, normalizedKeyword: string) {
    isLoading.value = true
    error.value = null

    const result = await rpc('gege/searchAgents', {
      ...buildAgentCodeInput(agentCode.value),
      keyword: normalizedKeyword,
      limit: DEFAULT_AGENT_SEARCH_LIMIT,
    })

    if (requestId !== latestRequestId) {
      return
    }

    isLoading.value = false

    if (!result.success) {
      error.value = result.error
      return
    }

    agents.value = result.data.agents
  }

  watch(
    () => [agentCode.value, keyword.value, enabled.value],
    () => {
      void search()
    },
    { immediate: true },
  )

  onUnload(reset)
  onUnmounted(reset)

  return {
    agents,
    isLoading,
    error,
    searchNow: () => search({ immediate: true }),
    reset,
  }
}
