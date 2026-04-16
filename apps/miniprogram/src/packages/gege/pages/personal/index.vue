<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'

import { computed, onLoad, ref } from 'wevu'

import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  createAmountMetric,
  createQualificationMetric,
} from '../../components/metric-rows/helper'
import MetricRows from '../../components/metric-rows/index.vue'
import { parseRouteAgentCode } from '../../lib/agent-code'
import { formatMonth } from '../../lib/format'
import {
  useMyPerformanceHistoryStore,
  useMyPerformanceMetaStore,
} from '../../store'
import MonthDetailPopup from './month-detail-popup.vue'

definePageJson({
  navigationBarTitleText: '我的业绩',
  backgroundColor: '#f6f7fb',
})

type PersonalHistoryItem = RpcOutput<'gege/getMyPerformanceHistory'>['history'][number]

interface YearOption {
  label: string
  value: number
}

const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const canQueryPerformance = computed(() => routeReady.value && !routeError.value)
const selectedYear = ref<number | null>(null)
const selectedMonth = ref<PersonalHistoryItem | null>(null)
const {
  meta,
  isLoading: isMetaLoading,
  error: metaError,
  refetch: refetchMeta,
} = useMyPerformanceMetaStore(routeAgentCode, canQueryPerformance)

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error

  wx.setNavigationBarTitle({
    title: parsedAgentCode.agentCode ? '代理人业绩' : '我的业绩',
  })

  routeReady.value = true
})

const availableYears = computed(() => meta.value?.availableYears ?? [])
const activeYear = computed(() => {
  return selectedYear.value
    ?? availableYears.value[0]
    ?? null
})

const {
  history: historyResult,
  isLoading: isHistoryLoading,
  error: historyError,
  refetch: refetchHistory,
} = useMyPerformanceHistoryStore(routeAgentCode, activeYear, canQueryPerformance)

usePullDownRefresh(async () => {
  if (!canQueryPerformance.value) {
    return
  }

  await Promise.all([
    refetchMeta(),
    refetchHistory(),
  ])
})

const pageError = computed(() => routeError.value ?? metaError.value?.message ?? null)
const pageTitle = computed(() => routeAgentCode.value ? '代理人业绩' : '我的业绩')
const viewContextLabel = computed(() => {
  return routeAgentCode.value
    ? `当前查看 ${routeAgentCode.value}`
    : null
})
const quickYears = computed(() => availableYears.value.slice(0, 2))
const overflowYears = computed<YearOption[]>(() => {
  return availableYears.value.slice(2).map(year => ({
    label: `${year} 年`,
    value: year,
  }))
})

const overflowActiveYear = computed(() => {
  const year = activeYear.value

  if (year == null) {
    return undefined
  }

  return overflowYears.value.some(option => option.value === year)
    ? year
    : undefined
})

const overflowDropdownLabel = computed(() => {
  return overflowActiveYear.value == null
    ? '更多'
    : `${overflowActiveYear.value} 年`
})

const overflowDropdownBarClass = computed(() => {
  return overflowActiveYear.value == null
    ? 'year-dropdown-bar'
    : 'year-dropdown-bar year-dropdown-selected'
})

const overflowDropdownLabelClass = computed(() => {
  return overflowActiveYear.value == null
    ? 'year-dropdown-label'
    : 'year-dropdown-label year-dropdown-label-active'
})

const overflowDropdownIconClass = computed(() => {
  return overflowActiveYear.value == null
    ? 'year-dropdown-icon'
    : 'year-dropdown-icon year-dropdown-icon-active'
})

const visibleHistorySource = computed(() => historyResult.value?.history ?? [])
const visibleHistory = computed(() => {
  return visibleHistorySource.value
    .filter(item => item.hasData)
    .sort((left, right) => right.month - left.month)
})

const hasVisibleHistory = computed(() => visibleHistory.value.length > 0)
const latestPeriod = computed(() => historyResult.value?.latestPeriod ?? null)

const monthCards = computed(() => {
  return visibleHistory.value.map(item => ({
    item,
    metrics: [
      createAmountMetric('NSC', item.nsc, item.nscSum),
      createAmountMetric('CASE', item.netCase, item.netCaseSum),
      createQualificationMetric(
        item.isQualified,
        item.qualifiedGap,
        item.isQualifiedNextMonth,
        item.qualifiedGapNextMonth,
      ),
    ],
  }))
})

function chooseYear(year: number) {
  if (selectedYear.value === year) {
    return
  }

  selectedMonth.value = null
  selectedYear.value = year
}

const REGEXP_INTEGER = /^\d+$/
function normalizeYearValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string' && REGEXP_INTEGER.test(value)) {
    return Number(value)
  }

  return null
}

function handleMoreYearChange(
  event: WechatMiniprogram.CustomEvent<{ value?: number | string }>
    | { value?: number | string },
) {
  const nextYear = 'detail' in event
    ? normalizeYearValue(event.detail?.value)
    : normalizeYearValue(event.value)

  if (nextYear == null) {
    return
  }

  chooseYear(nextYear)
}

function isLatestHistoryItem(item: PersonalHistoryItem): boolean {
  return latestPeriod.value?.year === item.year
    && latestPeriod.value?.month === item.month
}

function openMonthDetail(item: PersonalHistoryItem) {
  selectedMonth.value = item
}

function handlePopupVisibleChange(visible: boolean) {
  if (visible) {
    return
  }

  selectedMonth.value = null
}

function handleRetryHistory() {
  void refetchHistory()
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view v-if="pageError && !meta" class="card p-4">
      <t-empty icon="error-circle" :description="pageError || '数据加载失败'" />
    </view>

    <view v-else-if="meta" class="space-y-3">
      <view v-if="viewContextLabel" class="card bg-hero p-4">
        <view class="text-lg font-semibold text-foreground">
          {{ pageTitle }}
        </view>
        <view class="mt-1 text-sm text-muted-foreground">
          {{ viewContextLabel }}
        </view>
      </view>

      <view v-if="availableYears.length > 0">
        <view class="flex flex-wrap items-center gap-2">
          <view
            v-for="year in quickYears"
            :key="year"
            class="pill pill-lg"
            :class="activeYear === year
              ? 'pill-selected'
              : 'pill-card'"
            @tap="chooseYear(year)"
          >
            {{ year }} 年
          </view>

          <t-dropdown-menu
            v-if="overflowYears.length > 0"
            class="year-dropdown"
            :t-class="overflowDropdownBarClass"
            t-class-item="year-dropdown-item"
            :t-class-label="overflowDropdownLabelClass"
            :t-class-icon="overflowDropdownIconClass"
          >
            <t-dropdown-item
              placement="right"
              :label="overflowDropdownLabel"
              :options="overflowYears"
              :value="overflowActiveYear"
              @change="handleMoreYearChange"
            />
          </t-dropdown-menu>
        </view>
      </view>

      <view class="space-y-3">
        <view
          v-if="historyError && !historyResult"
          class="card flex h-40 flex-col items-center justify-center gap-3 p-4"
        >
          <t-empty icon="error-circle" :description="historyError.message || '月度数据加载失败'" />
          <view class="pill pill-card" @tap="handleRetryHistory">
            重试
          </view>
        </view>

        <view v-else-if="!hasVisibleHistory && !isHistoryLoading" class="card p-4">
          <t-empty icon="view-list" description="暂无个人业绩数据" />
        </view>

        <view
          v-for="card in monthCards"
          :key="`${card.item.year}-${card.item.month}`"
          class="card p-4"
          @tap="openMonthDetail(card.item)"
        >
          <view class="flex items-center justify-between gap-3 mb-2">
            <view class="text-base font-semibold text-foreground">
              {{ formatMonth(card.item.month) }}
            </view>
          </view>

          <MetricRows :rows="card.metrics" />
        </view>
      </view>
    </view>

    <view v-else-if="!isMetaLoading" class="card p-4">
      <t-empty icon="view-list" description="暂无个人业绩数据" />
    </view>

    <MonthDetailPopup
      :visible="Boolean(selectedMonth)"
      :item="selectedMonth"
      :show-next-qualification="selectedMonth ? isLatestHistoryItem(selectedMonth) : false"
      @visible-change="handlePopupVisibleChange"
    />

    <t-toast id="t-toast" />
  </view>
</template>

<style lang="postcss">
.year-dropdown {
  display: inline-flex;
  width: auto;
  --td-dropdown-menu-height: 72rpx;
  --td-dropdown-menu-border-width: 0;
  --td-dropdown-menu-icon-size: 28rpx;
}

.year-dropdown-bar {
  display: flex;
  align-items: center;
  height: 72rpx;
  border-radius: 9999px;
  background: var(--card);
  box-shadow: 0 12rpx 32rpx rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.year-dropdown-item {
  flex: none !important;
  min-height: 72rpx;
  height: 72rpx;
  padding: 0 30rpx 0 26rpx !important;
}

.year-dropdown-label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--muted-foreground);
  line-height: 1.2;
}

.year-dropdown-label-active {
  color: var(--primary-foreground);
}

.year-dropdown-icon {
  color: var(--muted-foreground);
  margin-left: 8rpx;
}

.year-dropdown-icon-active {
  color: var(--primary-foreground);
}

.year-dropdown-selected {
  --td-dropdown-menu-bg-color: var(--primary);
}
</style>
