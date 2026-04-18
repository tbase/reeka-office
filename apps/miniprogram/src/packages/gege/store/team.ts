import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { computed, onShow, ref, shallowRef, watch } from 'wevu'
import { useQuery } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { rpc } from '@/lib/rpc'
import type {
  TeamMember,
  TeamMemberSortDirection,
  TeamMemberSortField,
  TeamMeta,
  TeamScope,
  TeamStats,
} from './shared'
import {
  buildAgentCodeInput,
  DEFAULT_TEAM_PAGE_SIZE,
} from './shared'

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
  sortField: Ref<TeamMemberSortField>,
  sortDirection: Ref<TeamMemberSortDirection>,
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
      sortField: sortField.value,
      sortDirection: sortDirection.value,
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
    () => [
      agentCode.value,
      enabled.value,
      scope.value,
      year.value,
      month.value,
      sortField.value,
      sortDirection.value,
    ],
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
