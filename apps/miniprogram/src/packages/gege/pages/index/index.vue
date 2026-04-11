<script setup lang="ts">
import { computed, ref } from 'wevu'

import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  formatDesignation,
  formatMetricValue,
  formatNumber,
  formatPeriod,
  formatQualified,
} from '../../lib/format'
import { useGegeDashboardStore } from '../../store'
import MetricChartPopup from './metric-chart-popup.vue'

definePageJson({
  navigationBarTitleText: '咯咯咯',
})

const { dashboard, isLoading, error, refetch } = useGegeDashboardStore()

usePullDownRefresh(async () => {
  await refetch()
})

const profile = computed(() => ({
  name: dashboard.value?.agent.name ?? '咯咯咯',
  agentCode: dashboard.value?.agent.agentCode ?? '',
  designationName: formatDesignation(dashboard.value?.agent.designationName),
  periodLabel: formatPeriod(dashboard.value?.period),
  qualifiedLabel: formatQualified(dashboard.value?.self.isQualified ?? false),
}))

const hasPerformance = computed(() => Boolean(dashboard.value?.period))
const LARGE_METRIC_THRESHOLD = 100_000_000

type MetricName = 'nsc' | 'netCase'
type MetricScope = 'self' | 'direct' | 'all'

interface AmountMetric {
  kind: 'amount'
  label: 'NSC' | 'CASE'
  metricName: MetricName
  monthValue: string
  totalValue: string
  isCompactValue: boolean
  tone: string
}

interface ValueMetric {
  kind: 'value'
  label: string
  value: string
  tone: string
}

interface PerformanceCard {
  key: MetricScope
  title: string
  scope: MetricScope
  metrics: Array<AmountMetric | ValueMetric>
  onDetail: () => void
}

interface SelectedMetric {
  cardTitle: string
  scope: MetricScope
  metricName: MetricName
  label: 'NSC' | 'CASE'
}

const selectedMetric = ref<SelectedMetric | null>(null)

function createAmountMetric(
  label: 'NSC' | 'CASE',
  monthValue: number | null | undefined,
  totalValue: number | null | undefined,
  tone: string,
): AmountMetric {
  const safeMonthValue = Number.isFinite(monthValue) ? Number(monthValue) / 100 : 0
  const metricName: MetricName = label === 'NSC' ? 'nsc' : 'netCase'

  return {
    kind: 'amount' as const,
    label,
    metricName,
    monthValue: formatMetricValue(monthValue),
    totalValue: formatMetricValue(totalValue),
    isCompactValue: safeMonthValue >= LARGE_METRIC_THRESHOLD,
    tone,
  }
}

function goMyPerformance() {
  wx.navigateTo({
    url: '/packages/gege/pages/my-performance/index',
  })
}

function goTeam(scope: 'direct' | 'all') {
  wx.navigateTo({
    url: `/packages/gege/pages/team/index?scope=${scope}`,
  })
}

function openMetricPopup(card: PerformanceCard, item: AmountMetric | ValueMetric) {
  if (item.kind !== 'amount') {
    return
  }

  selectedMetric.value = {
    cardTitle: card.title,
    scope: card.scope,
    metricName: item.metricName,
    label: item.label,
  }
}

function handleMetricPopupVisibleChange(visible: boolean) {
  if (visible) {
    return
  }

  selectedMetric.value = null
}

const chartYear = computed(() => dashboard.value?.period?.year ?? null)
const chartPopupTitle = computed(() => {
  if (!selectedMetric.value) {
    return ''
  }

  return `${selectedMetric.value.cardTitle} · ${selectedMetric.value.label}`
})

const performanceCards = computed<PerformanceCard[]>(() => {
  const self = dashboard.value?.self
  const direct = dashboard.value?.team.direct
  const all = dashboard.value?.team.all

  return [
    {
      key: 'self',
      title: '我的业绩',
      scope: 'self',
      metrics: [
        createAmountMetric('NSC', self?.nsc, self?.nscSum, 'text-primary'),
        createAmountMetric('CASE', self?.netCase, self?.netCaseSum, 'text-primary-2'),
      ],
      onDetail: goMyPerformance,
    },
    {
      key: 'direct',
      title: '直属团队',
      scope: 'direct',
      metrics: [
        createAmountMetric('NSC', direct?.nsc, direct?.nscSum, 'text-primary'),
        createAmountMetric('CASE', direct?.netCase, direct?.netCaseSum, 'text-primary-2'),
        {
          kind: 'value' as const,
          label: '成员',
          value: formatNumber(direct?.memberCount),
          tone: 'text-foreground',
        },
        {
          kind: 'value' as const,
          label: '合资格',
          value: formatNumber(direct?.qualifiedCount),
          tone: 'text-success',
        },
      ],
      onDetail: () => goTeam('direct'),
    },
    {
      key: 'all',
      title: '全团队',
      scope: 'all',
      metrics: [
        createAmountMetric('NSC', all?.nsc, all?.nscSum, 'text-primary'),
        createAmountMetric('CASE', all?.netCase, all?.netCaseSum, 'text-primary-2'),
        {
          kind: 'value' as const,
          label: '成员',
          value: formatNumber(all?.memberCount),
          tone: 'text-foreground',
        },
        {
          kind: 'value' as const,
          label: '合资格',
          value: formatNumber(all?.qualifiedCount),
          tone: 'text-success',
        },
      ],
      onDetail: () => goTeam('all'),
    },
  ]
})
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view class="card bg-hero p-5">
      <view class="flex items-start justify-between gap-3">
        <view class="min-w-0">
          <view class="text-xl font-semibold text-foreground">
            {{ profile.name }}
          </view>
          <view v-if="profile.agentCode" class="mt-1 text-sm text-muted-foreground">
            {{ profile.agentCode }}
          </view>
          <view class="mt-3 flex flex-wrap gap-2">
            <view class="pill pill-primary">
              {{ profile.designationName }}
            </view>
            <view class="pill pill-success">
              {{ profile.qualifiedLabel }}
            </view>
          </view>
        </view>

        <view class=" px-3 py-2 text-right">
          <view class="text-xs text-muted-foreground">
            数据月份
          </view>
          <view class="mt-1 text-sm font-semibold text-foreground">
            {{ profile.periodLabel }}
          </view>
        </view>
      </view>
    </view>

    <view v-if="!hasPerformance && !isLoading" class="card mt-4 p-4">
      <t-empty icon="view-list" description="暂无业绩数据" />
    </view>

    <view v-else-if="error && !dashboard" class="card mt-4 p-4">
      <t-empty icon="error-circle" :description="error.message || '数据加载失败'" />
    </view>

    <view v-else class="mt-4 space-y-4">
      <view
        v-for="card in performanceCards"
        :key="card.key"
        class="card p-4"
      >
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0">
            <view class="text-lg font-semibold text-foreground">
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

        <view class="mt-4 grid grid-cols-2 gap-3">
          <view
            v-for="item in card.metrics"
            :key="item.label"
            class="card bg-muted shadow-none p-2.5"
            @tap="openMetricPopup(card, item)"
          >
            <view class="text-xs text-muted-foreground">
              {{ item.label }}
            </view>
            <template v-if="item.kind === 'amount'">
              <view class="mt-2">
                <view
                  class="font-semibold"
                  :class="[item.tone, item.isCompactValue ? 'text-lg' : 'text-xl']"
                >
                  {{ item.monthValue }}
                </view>
                <view class="mt-1 text-sm text-muted-foreground">
                  {{ item.totalValue }}
                </view>
              </view>
            </template>
            <view v-else class="mt-2 text-xl font-semibold" :class="item.tone">
              {{ item.value }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <MetricChartPopup
      :visible="Boolean(selectedMetric)"
      :title="chartPopupTitle"
      :year="chartYear"
      :metric="selectedMetric"
      @visible-change="handleMetricPopupVisibleChange"
    />
  </view>
</template>
