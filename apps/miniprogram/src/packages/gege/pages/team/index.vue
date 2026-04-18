<script setup lang="ts">
import type { Ref } from 'wevu'
import type { MetricRow } from '../../components/metric-rows/types'
import type {
  TeamMemberSortDirection,
  TeamMemberSortField,
} from '../../store/shared'

import { computed, onLoad, ref, watch } from 'wevu'

import DesignationBadge from '@/components/designation-badge/index.vue'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  createAmountMetric,
  createMemberMetric,
  createQualificationMetric,
} from '../../components/metric-rows/helper'
import MetricRows from '../../components/metric-rows/index.vue'
import { buildPageUrl, parseRouteAgentCode } from '../../lib/agent-code'
import { formatPeriod } from '../../lib/format'
import { useTeamMetaStore, useTeamStore } from '../../store'
import TeamStatsPopup from './team-stats-popup.vue'

definePageJson({
  navigationBarTitleText: '我的团队',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})

type TeamScope = 'direct' | 'division' | 'all'

interface Period {
  year: number
  month: number
}

interface PeriodOption extends Period {
  label: string
}

interface TeamSummary {
  memberCount: number
  qualifiedCount: number
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
}

interface TeamSortOption {
  field: TeamMemberSortField
  label: string
}

const MAX_BACKTRACK_MONTHS = 36
const DEFAULT_SORT_FIELD: TeamMemberSortField = 'nsc'
const DEFAULT_SORT_DIRECTION: TeamMemberSortDirection = 'desc'
const TEAM_SORT_OPTIONS: TeamSortOption[] = [
  {
    field: 'designation',
    label: '职级',
  },
  {
    field: 'nsc',
    label: '当月 NSC',
  },
  {
    field: 'nscSum',
    label: '累计 NSC',
  },
  {
    field: 'netCase',
    label: '当月 CASE',
  },
  {
    field: 'netCaseSum',
    label: '累计 CASE',
  },
]
const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const canQueryTeam = computed(() => routeReady.value && !routeError.value)
const requestedScope = ref<TeamScope | null>(null)
const selectedScope = ref<TeamScope | null>(null)
const activeYear = ref<number | null>(null)
const activeMonth = ref<number | null>(null)
const activeSortField = ref<TeamMemberSortField>(DEFAULT_SORT_FIELD)
const activeSortDirection = ref<TeamMemberSortDirection>(DEFAULT_SORT_DIRECTION)
const isStatsPopupVisible = ref(false)
const {
  meta,
  isLoading: isMetaLoading,
  error: metaError,
  refetch: refetchMeta,
} = useTeamMetaStore(routeAgentCode, canQueryTeam)
const availableScopes = computed(() => meta.value?.availableScopes ?? [])
const defaultScope = computed<TeamScope>(() => meta.value?.defaultScope ?? 'direct')
const canQueryTeamData = computed(() => canQueryTeam.value && !!meta.value)
const activeScope = computed<TeamScope>(() => selectedScope.value ?? defaultScope.value)
const {
  stats,
  members,
  hasMore,
  isLoading,
  isLoadingMore,
  statsError,
  membersError,
  loadMoreError,
  refetch,
  loadMore,
} = useTeamStore(
  routeAgentCode,
  canQueryTeamData,
  activeScope as Ref<TeamScope>,
  activeYear,
  activeMonth,
  activeSortField,
  activeSortDirection,
)
const emptySummary: TeamSummary = {
  memberCount: 0,
  qualifiedCount: 0,
  nsc: 0,
  nscSum: 0,
  netCase: 0,
  netCaseSum: 0,
}

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error

  wx.setNavigationBarTitle({
    title: parsedAgentCode.agentCode ? '代理人团队' : '我的团队',
  })

  if (options?.scope === 'division' || options?.scope === 'all') {
    requestedScope.value = options.scope
  }

  routeReady.value = true
})

usePullDownRefresh(async () => {
  if (!canQueryTeam.value) {
    return
  }

  await Promise.all([
    refetchMeta(),
    refetch(),
  ])
})

watch(
  () => [requestedScope.value, availableScopes.value.map(option => option.scope).join(',')],
  () => {
    if (availableScopes.value.length === 0) {
      return
    }

    const nextScope = requestedScope.value
      && availableScopes.value.some(option => option.scope === requestedScope.value)
      ? requestedScope.value
      : defaultScope.value

    if (selectedScope.value === nextScope) {
      return
    }

    selectedScope.value = nextScope
  },
  { immediate: true },
)

const pageError = computed(() => {
  return routeError.value
    ?? metaError.value?.message
    ?? statsError.value?.message
    ?? null
})
const pageTitle = computed(() => routeAgentCode.value ? '代理人团队' : '我的团队')
const viewContextLabel = computed(() => {
  return routeAgentCode.value
    ? `当前查看 ${routeAgentCode.value}`
    : null
})
const teamSummary = computed<TeamSummary>(() => stats.value?.summary ?? emptySummary)
const scopeTabs = computed(() => availableScopes.value)

const summaryItems = computed(() => [
  createMemberMetric(teamSummary.value.qualifiedCount, teamSummary.value.memberCount),
])

const latestPeriod = computed<Period | null>(() => stats.value?.latestPeriod ?? stats.value?.period ?? null)
const currentPeriod = computed<Period | null>(() => stats.value?.period ?? latestPeriod.value)
const periodLabel = computed(() => formatPeriod(currentPeriod.value))
const hasPerformance = computed(() => Boolean(latestPeriod.value))
const periodOptions = computed<PeriodOption[]>(() => {
  const latest = latestPeriod.value

  if (!latest) {
    return []
  }

  const latestIndex = toPeriodIndex(latest)

  return Array.from({ length: MAX_BACKTRACK_MONTHS }, (_, index) => {
    const period = createPeriodFromIndex(latestIndex - index)

    return {
      ...period,
      label: formatPeriod(period),
    }
  })
})
const currentPeriodOptionIndex = computed(() => {
  const period = currentPeriod.value

  if (!period) {
    return 0
  }

  const matchedIndex = periodOptions.value.findIndex((option) => {
    return option.year === period.year
      && option.month === period.month
  })

  return matchedIndex >= 0 ? matchedIndex : 0
})

const summaryMetrics = computed(() => [
  createAmountMetric('NSC', teamSummary.value.nsc, teamSummary.value.nscSum),
  createAmountMetric('CASE', teamSummary.value.netCase, teamSummary.value.netCaseSum),
])
const sortOptions = computed(() => {
  return TEAM_SORT_OPTIONS.map(option => ({
    ...option,
    isActive: option.field === activeSortField.value,
    displayLabel: option.field === activeSortField.value
      ? `${option.label} ${activeSortDirection.value === 'desc' ? '↓' : '↑'}`
      : option.label,
  }))
})
const showMembersLoading = computed(() => isLoading.value && members.value.length === 0)
const showMembersError = computed(() => {
  return Boolean(membersError.value) && members.value.length === 0 && !isLoading.value
})
const showMembersEmpty = computed(() => {
  return members.value.length === 0 && !isLoading.value
})
const membersErrorDescription = computed(() => {
  return membersError.value?.message || '团队成员加载失败'
})

const memberCards = computed(() => {
  return members.value.map((member) => {
    const metrics: MetricRow[] = [
      createAmountMetric('NSC', member.nsc, member.nscSum),
      createAmountMetric('CASE', member.netCase, member.netCaseSum),
      createQualificationMetric(
        member.isQualified,
        member.qualifiedGap,
        member.isQualifiedNextMonth,
        member.qualifiedGapNextMonth,
      ),
    ]

    return {
      ...member,
      metrics,
    }
  })
})

function toPeriodIndex(period: Period): number {
  return period.year * 12 + period.month - 1
}

function createPeriodFromIndex(index: number): Period {
  return {
    year: Math.floor(index / 12),
    month: index % 12 + 1,
  }
}

function changeScope(scope: TeamScope) {
  if (selectedScope.value === scope) {
    return
  }

  selectedScope.value = scope
}

function changeSort(sortField: TeamMemberSortField) {
  if (activeSortField.value === sortField) {
    activeSortDirection.value = activeSortDirection.value === 'desc'
      ? 'asc'
      : 'desc'
    return
  }

  activeSortField.value = sortField
  activeSortDirection.value = DEFAULT_SORT_DIRECTION
}

function openStatsPopup() {
  isStatsPopupVisible.value = true
}

function handleStatsPopupVisibleChange(visible: boolean) {
  isStatsPopupVisible.value = visible
}

function handleMembersScrollToLower() {
  if (!hasMore.value || isLoadingMore.value) {
    return
  }

  void loadMore()
}

function handlePeriodChange(
  event: WechatMiniprogram.CustomEvent<{ value?: number | string }>,
) {
  const nextIndex = typeof event.detail?.value === 'number'
    ? event.detail.value
    : Number(event.detail?.value)
  const nextPeriod = Number.isInteger(nextIndex)
    ? periodOptions.value[nextIndex]
    : undefined

  if (!nextPeriod) {
    return
  }

  activeYear.value = nextPeriod.year
  activeMonth.value = nextPeriod.month
}

function goMemberDetail(agentCode: string) {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/index/index', {
      agentCode,
    }),
  })
}
</script>

<template>
  <view class="h-screen flex flex-col bg-background">
    <view v-if="pageError && !meta" class="px-4 pt-4">
      <view class="card p-4">
        <t-empty icon="error-circle" :description="pageError || '团队信息加载失败'" />
      </view>
    </view>

    <template v-else-if="meta">
      <view class="shrink-0 px-4 pt-4">
        <view class="card bg-hero p-4">
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0">
              <view class="text-xl font-semibold text-foreground">
                {{ pageTitle }}
              </view>
              <view v-if="viewContextLabel" class="mt-1 text-sm text-muted-foreground">
                {{ viewContextLabel }}
              </view>
            </view>

            <view class="inline-flex rounded-full bg-card p-1">
              <view
                v-for="tab in scopeTabs"
                :key="tab.scope"
                class="pill"
                :class="activeScope === tab.scope
                  ? 'pill-primary'
                  : 'text-muted-foreground'"
                @tap="changeScope(tab.scope)"
              >
                {{ tab.label }}
              </view>
            </view>
          </view>

          <picker
            v-if="periodOptions.length > 0"
            class="mt-4 block"
            mode="selector"
            :range="periodOptions"
            range-key="label"
            :value="currentPeriodOptionIndex"
            @change="handlePeriodChange"
          >
            <view class="flex items-center justify-between rounded-lg bg-card px-4 py-3">
              <view class="text-sm font-medium text-foreground">
                {{ periodLabel }}
              </view>
              <view class="pill pill-card">
                切换月份
              </view>
            </view>
          </picker>

          <view class="mt-3 flex justify-center">
            <view class="text-primary text-xs" @tap="openStatsPopup">
              查看统计
            </view>
          </view>
        </view>

        <scroll-view
          scroll-x
          show-scrollbar="false"
          class="mt-3 w-full whitespace-nowrap"
        >
          <view class="inline-flex gap-2 pr-4">
            <view
              v-for="option in sortOptions"
              :key="option.field"
              class="pill shrink-0 whitespace-nowrap"
              :class="option.isActive
                ? 'pill-selected'
                : 'pill-card'"
              @tap="changeSort(option.field)"
            >
              {{ option.displayLabel }}
            </view>
          </view>
        </scroll-view>
      </view>

      <scroll-view
        scroll-y
        lower-threshold="96"
        class="mt-3 min-h-0 flex-1"
        @scrolltolower="handleMembersScrollToLower"
      >
        <view class="px-4 pb-16">
          <view v-if="pageError && !stats" class="card p-4">
            <t-empty icon="error-circle" :description="pageError || '团队统计加载失败'" />
          </view>

          <view v-if="!hasPerformance && !isLoading" class="card p-4">
            <t-empty icon="view-list" description="暂无团队业绩数据" />
          </view>

          <view v-else class="space-y-3">
            <view v-if="showMembersLoading" class="card p-4">
              <view class="text-center text-sm text-muted-foreground">
                加载团队成员中...
              </view>
            </view>

            <view v-else-if="showMembersError" class="card p-4">
              <t-empty icon="error-circle" :description="membersErrorDescription" />
            </view>

            <view v-else-if="showMembersEmpty" class="card p-4">
              <t-empty icon="view-list" description="当前范围暂无成员" />
            </view>

            <view v-else class="space-y-3">
              <view
                v-for="member in memberCards"
                :key="member.agentCode"
                class="card p-3.5"
                @tap="goMemberDetail(member.agentCode)"
              >
                <view class="flex items-start justify-between gap-2">
                  <view class="min-w-0">
                    <view class="text-sm font-medium text-foreground">
                      {{ member.name }}
                    </view>
                    <view class="text-xs text-muted-foreground">
                      {{ member.agentCode }}
                    </view>
                  </view>

                  <view class="flex shrink-0 items-center gap-2">
                    <DesignationBadge :designation-name="member.designationName" />
                  </view>
                </view>

                <MetricRows class="mt-2.5" :rows="member.metrics" />
              </view>

              <view
                v-if="loadMoreError"
                class="card p-3 text-center text-sm text-destructive"
                @tap="loadMore"
              >
                {{ loadMoreError.message || '加载更多失败' }}，点击重试
              </view>

              <view
                v-else-if="hasMore"
                class="card p-3 text-center text-sm text-muted-foreground"
              >
                {{ isLoadingMore ? '加载中...' : '继续下拉加载更多' }}
              </view>

              <view
                v-else
                class="py-1 text-center text-xs text-muted-foreground"
              >
                已加载全部成员
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <TeamStatsPopup
        :visible="isStatsPopupVisible"
        :period-label="periodLabel"
        :summary-items="summaryItems"
        :summary-metrics="summaryMetrics"
        @visible-change="handleStatsPopupVisibleChange"
      />
    </template>

    <view v-else-if="isMetaLoading" class="px-4 pt-4">
      <view class="card p-4">
        <view class="text-center text-sm text-muted-foreground">
          加载团队信息中...
        </view>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
