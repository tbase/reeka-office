<script setup lang="ts">
import type { MetricRow } from '../../components/metric-rows/types'

import { computed, onLoad, ref } from 'wevu'
import DesignationBadge from '@/components/designation-badge/index.vue'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  createAmountMetric,
  createMemberMetric,
  createQualificationMetric,
} from '../../components/metric-rows/helper'
import MetricRows from '../../components/metric-rows/index.vue'
import {
  buildPageUrl,
  parseRouteAgentCode,
} from '../../lib/agent-code'
import { showOrg as getShowOrg } from '../../lib/designation'
import { formatPeriod } from '../../lib/format'
import { useDashboardStore } from '../../store'

definePageJson({
  navigationBarTitleText: '咯咯咯',
})

const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const canQueryDashboard = computed(() => routeReady.value && !routeError.value)

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error
  routeReady.value = true
})

const { dashboard, isLoading, error, refetch } = useDashboardStore(
  routeAgentCode,
  canQueryDashboard,
)

usePullDownRefresh(async () => {
  if (!canQueryDashboard.value) {
    return
  }

  await refetch()
})

const pageError = computed(() => routeError.value ?? error.value?.message ?? null)
const showOrg = computed(() => getShowOrg(dashboard.value?.agent.designationName))
const showSearchEntry = computed(() => !routeAgentCode.value)

const profile = computed(() => ({
  name: dashboard.value?.agent.name ?? '咯咯咯',
  agentCode: dashboard.value?.agent.agentCode ?? '',
  designationName: dashboard.value?.agent.designationName ?? null,
  periodLabel: formatPeriod(dashboard.value?.period),
  qualified: dashboard.value?.self.isQualified ?? null,
  qualifiedGap: dashboard.value?.self.qualifiedGap ?? null,
}))

const hasPerformance = computed(() => Boolean(dashboard.value?.period))

type MetricScope = 'self' | 'direct' | 'division' | 'all'

interface PerformanceCard {
  key: MetricScope
  title: string
  scope: MetricScope
  metrics: Array<MetricRow>
  onDetail: () => void
}

function goPersonal() {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/personal/index', {
      agentCode: routeAgentCode.value,
    }),
  })
}

function goTeam(scope: 'direct' | 'division' | 'all') {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/team/index', {
      scope,
      agentCode: routeAgentCode.value,
    }),
  })
}

function goOrg() {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/org/index', {
      agentCode: routeAgentCode.value,
    }),
  })
}

function goPromotion() {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/promotion/index', {
      agentCode: routeAgentCode.value,
    }),
  })
}

function goLogs() {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/logs/index', {
      agentCode: routeAgentCode.value,
    }),
  })
}

function goSearch() {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/search/index', {
      agentCode: routeAgentCode.value,
    }),
  })
}

const performanceCards = computed<PerformanceCard[]>(() => {
  const self = dashboard.value?.self
  const direct = dashboard.value?.team.direct
  const division = dashboard.value?.team.division
  const all = dashboard.value?.team.all
  const divisionCode = dashboard.value?.agent.division?.trim()
  const teamCards: PerformanceCard[] = [
    {
      key: 'direct',
      title: '直属团队',
      scope: 'direct',
      metrics: [
        createAmountMetric('NSC', direct?.nsc, direct?.nscSum),
        createAmountMetric('CASE', direct?.netCase, direct?.netCaseSum),
        createMemberMetric(direct?.qualifiedCount, direct?.memberCount),
      ],
      onDetail: () => goTeam('direct'),
    },
  ]

  if (division && divisionCode) {
    teamCards.push({
      key: 'division',
      title: `${divisionCode} 团队`,
      scope: 'division',
      metrics: [
        createAmountMetric('NSC', division.nsc, division.nscSum),
        createAmountMetric('CASE', division.netCase, division.netCaseSum),
        createMemberMetric(division.qualifiedCount, division.memberCount),
      ],
      onDetail: () => goTeam('division'),
    })
  }

  teamCards.push({
    key: 'all',
    title: '全团队',
    scope: 'all',
    metrics: [
      createAmountMetric('NSC', all?.nsc, all?.nscSum),
      createAmountMetric('CASE', all?.netCase, all?.netCaseSum),
      createMemberMetric(all?.qualifiedCount, all?.memberCount),
    ],
    onDetail: () => goTeam('all'),
  })

  return [
    {
      key: 'self',
      title: '我的业绩',
      scope: 'self',
      metrics: [
        createAmountMetric('NSC', self?.nsc, self?.nscSum),
        createAmountMetric('CASE', self?.netCase, self?.netCaseSum),
        createQualificationMetric(
          self?.isQualified,
          self?.qualifiedGap,
          self?.isQualifiedNextMonth,
          self?.qualifiedGapNextMonth,
        ),
      ],
      onDetail: goPersonal,
    },
    ...teamCards,
  ]
})
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view v-if="pageError && !dashboard" class="card mt-4 p-4">
      <t-empty icon="error-circle" :description="pageError || '数据加载失败'" />
    </view>

    <template v-else-if="dashboard && !routeError">
      <view class="card bg-hero p-5">
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0">
            <view class="text-xl font-semibold text-foreground">
              {{ profile.name }}
            </view>
            <view v-if="profile.agentCode" class="mt-1 text-sm text-muted-foreground">
              {{ profile.agentCode }}
            </view>
            <view class="mt-3 flex flex-wrap items-center gap-2">
              <DesignationBadge :designation-name="profile.designationName" />
              <view class="hero-inline-link" @tap="goPromotion">
                查看晋级信息
              </view>
              <view class="hero-inline-link" @tap="goLogs">
                变更日志
              </view>
            </view>
          </view>

          <view class=" px-3 py-2 text-right">
            <view class="text-xs text-muted-foreground">
              数据月份
            </view>
            <view class="mt-1 text-sm font-medium text-foreground">
              {{ profile.periodLabel }}
            </view>
          </view>
        </view>
      </view>

      <view v-if="showSearchEntry" class="mt-4" @tap="goSearch">
        <view class="agent-search-entry">
          <t-icon name="search" size="48rpx" class="agent-search-entry__icon" />
          <view class="agent-search-entry__placeholder">
            搜索代理人姓名/编码
          </view>
        </view>
      </view>

      <view v-if="showOrg" class="card mt-4 p-4" @tap="goOrg">
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0">
            <view class="text-base font-medium text-foreground">
              组织架构
            </view>
            <view class="mt-1 text-sm text-muted-foreground">
              查看当前代理人旗下成员树状结构
            </view>
          </view>

          <view class="pill pill-primary">
            进入
          </view>
        </view>
      </view>

      <view v-if="!hasPerformance && !isLoading" class="card mt-4 p-4">
        <t-empty icon="view-list" description="暂无业绩数据" />
      </view>

      <view v-else class="mt-4 space-y-4">
        <view
          v-for="card in performanceCards"
          :key="card.key"
          class="card p-4"
        >
          <view class="flex items-center justify-between gap-3 mb-2">
            <view class="min-w-0">
              <view class="text-base font-medium text-foreground">
                {{ card.title }}
              </view>
            </view>

            <view
              class="text-primary text-xs"
              @tap="card.onDetail"
            >
              查看详情
            </view>
          </view>

          <MetricRows
            class="mt-3"
            :rows="card.metrics"
          />
        </view>
      </view>
    </template>
    <t-toast id="t-toast" />
  </view>
</template>

<style scoped lang="postcss">
.agent-search-entry {
  @apply flex items-center gap-3;

  min-height: 80rpx;
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  background: var(--card);
  box-shadow: var(--shadow-lg);
}

.agent-search-entry__icon {
  color: var(--muted-foreground);
}

.agent-search-entry__placeholder {
  color: var(--muted-foreground);
  font-size: 32rpx;
  line-height: 48rpx;
}

.hero-inline-link {
  color: var(--primary);
  font-size: 24rpx;
  line-height: 1.4;
}
</style>
