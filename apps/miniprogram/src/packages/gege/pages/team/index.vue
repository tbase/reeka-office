<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'

import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  formatDesignation,
  formatMetricValue,
  formatNumber,
  formatPeriod,
  formatQualified,
} from '../../lib/format'
import { useTeamMembersStore } from '../../store'

definePageJson({
  navigationBarTitleText: '我的团队',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})

type TeamScope = 'direct' | 'all'

interface Period {
  year: number
  month: number
}

interface PeriodOption extends Period {
  label: string
}

interface AmountMetric {
  label: 'NSC' | 'CASE'
  monthValue: string
  totalValue: string
  tone: string
}

const MAX_BACKTRACK_MONTHS = 36
const activeScope = ref<'direct' | 'all'>('direct')
const activeYear = ref<number | null>(null)
const activeMonth = ref<number | null>(null)
const { team, isLoading, error, refetch } = useTeamMembersStore(
  activeScope,
  activeYear,
  activeMonth,
)

onLoad((options) => {
  if (options?.scope === 'all') {
    activeScope.value = 'all'
  }
})

usePullDownRefresh(async () => {
  await refetch()
})

const summaryItems = computed(() => [
  {
    label: '成员数',
    value: formatNumber(team.value?.summary.memberCount),
    tone: 'text-foreground',
  },
  {
    label: '合资格人数',
    value: formatNumber(team.value?.summary.qualifiedCount),
    tone: 'text-[#0f9d58]',
  },
])

const members = computed(() => team.value?.members ?? [])
const latestPeriod = computed<Period | null>(() => team.value?.latestPeriod ?? team.value?.period ?? null)
const currentPeriod = computed<Period | null>(() => team.value?.period ?? latestPeriod.value)
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
  createAmountMetric('NSC', team.value?.summary.nsc, team.value?.summary.nscSum, 'text-primary'),
  createAmountMetric('CASE', team.value?.summary.netCase, team.value?.summary.netCaseSum, 'text-primary-2'),
])

const memberCards = computed(() => {
  return members.value.map(member => ({
    ...member,
    metrics: [
      createAmountMetric('NSC', member.nsc, member.nscSum, 'text-primary'),
      createAmountMetric('CASE', member.netCase, member.netCaseSum, 'text-primary-2'),
    ],
  }))
})

function createAmountMetric(
  label: 'NSC' | 'CASE',
  monthValue: number | null | undefined,
  totalValue: number | null | undefined,
  tone: string,
): AmountMetric {
  return {
    label,
    monthValue: formatMetricValue(monthValue),
    totalValue: formatMetricValue(totalValue),
    tone,
  }
}

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
  if (activeScope.value === scope) {
    return
  }

  activeScope.value = scope
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
    url: `/packages/gege/pages/member/index?agentCode=${agentCode}`,
  })
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view v-if="error && !team" class="card mt-4 p-4">
      <t-empty icon="error-circle" :description="error.message || '数据加载失败'" />
    </view>

    <template v-else-if="team">
      <view class="card bg-card p-4">
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0">
            <view class="text-xl font-semibold text-foreground">
              我的团队
            </view>
          </view>

          <view class="inline-flex rounded-full bg-muted p-1">
            <view
              class="pill"
              :class="activeScope === 'direct'
                ? 'pill-surface'
                : 'text-muted-foreground'"
              @tap="changeScope('direct')"
            >
              直属
            </view>
            <view
              class="pill"
              :class="activeScope === 'all'
                ? 'pill-surface'
                : 'text-muted-foreground'"
              @tap="changeScope('all')"
            >
              全团队
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
          <view class="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <view class="text-sm font-medium text-foreground">
              {{ periodLabel }}
            </view>
            <view class="pill pill-card">
              切换月份
            </view>
          </view>
        </picker>

        <view class="mt-2.5 grid grid-cols-2 gap-2.5">
          <view
            v-for="item in summaryItems"
            :key="item.label"
            class="card bg-muted p-2.5 shadow-none"
          >
            <view class="text-xs text-muted-foreground">
              {{ item.label }}
            </view>
            <view class="mt-1.5 text-lg font-semibold" :class="item.tone">
              {{ item.value }}
            </view>
          </view>
        </view>

        <view class="mt-4 grid grid-cols-2 gap-2.5">
          <view
            v-for="metric in summaryMetrics"
            :key="metric.label"
            class="card bg-muted p-2.5 shadow-none"
          >
            <view class="text-xs text-muted-foreground">
              {{ metric.label }}
            </view>
            <view class="mt-1.5 text-lg font-semibold" :class="metric.tone">
              {{ metric.monthValue }}
            </view>
            <view class="mt-0.5 text-xs text-muted-foreground">
              累计 {{ metric.totalValue }}
            </view>
          </view>
        </view>
      </view>

      <view v-if="!hasPerformance && !isLoading" class="card mt-4 p-4">
        <t-empty icon="view-list" description="暂无团队业绩数据" />
      </view>

      <view v-else class="mt-4 space-y-3">
        <view v-if="members.length === 0" class="card p-4">
          <t-empty icon="view-list" description="当前范围暂无成员" />
        </view>

        <view v-else class="space-y-3">
          <view
            v-for="member in memberCards"
            :key="member.agentCode"
            class="card p-3.5"
            @tap="goMemberDetail(member.agentCode)"
          >
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <view class="text-sm font-semibold text-foreground">
                  {{ member.name }}
                </view>
                <view class="mt-0.5 text-xs text-muted-foreground">
                  {{ member.agentCode }}
                </view>
              </view>

              <view class="flex shrink-0 items-center gap-2">
                <view class="pill pill-muted">
                  {{ formatDesignation(member.designationName) }}
                </view>
                <view
                  class="pill"
                  :class="member.isQualified
                    ? 'pill-success'
                    : 'pill-warning'"
                >
                  {{ formatQualified(member.isQualified) }}
                </view>
              </view>
            </view>

            <view class="mt-3 grid grid-cols-2 gap-2.5">
              <view
                v-for="metric in member.metrics"
                :key="metric.label"
                class="card bg-muted p-2.5 shadow-none"
              >
                <view class="text-xs text-muted-foreground">
                  {{ metric.label }}
                </view>
                <view class="mt-1.5 text-lg font-semibold" :class="metric.tone">
                  {{ metric.monthValue }}
                </view>
                <view class="mt-0.5 text-xs text-muted-foreground">
                  累计 {{ metric.totalValue }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>

    <t-toast id="t-toast" />
  </view>
</template>
