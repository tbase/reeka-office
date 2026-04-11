<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'

import { useNavTitle } from '@/hooks/useNavTitle'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  formatDesignation,
  formatMonth,
  formatNumber,
  formatPeriod,
  formatQualified,
  formatRate,
} from '../../lib/format'
import { useGegeMemberDetailStore } from '../../store'

definePageJson({
  navigationBarTitleText: '成员详情',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})

const agentCode = ref('')
const selectedYear = ref<number | null>(null)

onLoad((options) => {
  agentCode.value = typeof options?.agentCode === 'string'
    ? options.agentCode.trim().toUpperCase()
    : ''
})

const { detail, isLoading, error, refetch } = useGegeMemberDetailStore(agentCode, selectedYear)

usePullDownRefresh(async () => {
  await refetch()
})

useNavTitle(() => detail.value?.member.name ?? '成员详情')

const activeYear = computed(() => {
  return selectedYear.value
    ?? detail.value?.history[0]?.year
    ?? detail.value?.availableYears[0]
    ?? null
})

const profile = computed(() => ({
  name: detail.value?.member.name ?? '成员详情',
  agentCode: detail.value?.member.agentCode ?? agentCode.value,
  designationName: formatDesignation(detail.value?.member.designationName),
  relationLabel: detail.value?.relation.relationLabel ?? '',
  periodLabel: formatPeriod(detail.value?.period),
}))

const currentMetrics = computed(() => detail.value?.current)

const coreMetrics = computed(() => [
  {
    label: '本月 NSC',
    value: formatNumber(currentMetrics.value?.nsc),
    tone: 'text-[#d9485f]',
  },
  {
    label: '本月 CASE',
    value: formatNumber(currentMetrics.value?.netCase),
    tone: 'text-[#dd6b20]',
  },
  {
    label: '本月合资格',
    value: formatQualified(currentMetrics.value?.isQualified ?? false),
    tone: currentMetrics.value?.isQualified ? 'text-[#0f9d58]' : 'text-[#c2410c]',
  },
  {
    label: '年累计 NSC',
    value: formatNumber(currentMetrics.value?.nscSum),
    tone: 'text-foreground',
  },
  {
    label: '年累计 CASE',
    value: formatNumber(currentMetrics.value?.netCaseSum),
    tone: 'text-foreground',
  },
])

const extendedMetrics = computed(() => [
  { label: 'AFYP', value: formatNumber(currentMetrics.value?.netAfyp) },
  { label: 'AFYP SUM', value: formatNumber(currentMetrics.value?.netAfypSum) },
  { label: 'AFYC SUM', value: formatNumber(currentMetrics.value?.netAfycSum) },
  { label: 'NSC HP', value: formatNumber(currentMetrics.value?.nscHp) },
  { label: 'NSC HP SUM', value: formatNumber(currentMetrics.value?.nscHpSum) },
  { label: 'AFYP HP', value: formatNumber(currentMetrics.value?.netAfypHp) },
  { label: 'AFYP HP SUM', value: formatNumber(currentMetrics.value?.netAfypHpSum) },
  { label: 'AFYP H', value: formatNumber(currentMetrics.value?.netAfypH) },
  { label: 'AFYP H SUM', value: formatNumber(currentMetrics.value?.netAfypHSum) },
  { label: 'CASE H', value: formatNumber(currentMetrics.value?.netCaseH) },
  { label: 'CASE H SUM', value: formatNumber(currentMetrics.value?.netCaseHSum) },
  { label: '团队续保率', value: formatRate(currentMetrics.value?.renewalRateTeam) },
])

const history = computed(() => detail.value?.history ?? [])
const availableYears = computed(() => detail.value?.availableYears ?? [])
const canShowPerformance = computed(() => availableYears.value.length > 0)

function chooseYear(year: number) {
  if (selectedYear.value === year) {
    return
  }

  selectedYear.value = year
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view class="card-hero p-5">
      <view class="flex items-start justify-between gap-3">
        <view class="min-w-0">
          <view class="text-xl font-semibold text-foreground">
            {{ profile.name }}
          </view>
          <view v-if="profile.agentCode" class="mt-1 text-sm text-muted-foreground">
            {{ profile.agentCode }}
          </view>
        </view>

        <view v-if="profile.relationLabel" class="pill pill-accent">
          {{ profile.relationLabel }}
        </view>
      </view>

      <view class="mt-3 flex items-center justify-between gap-3">
        <view class="pill pill-muted">
          {{ profile.designationName }}
        </view>
        <view class="text-xs text-muted-foreground">
          {{ profile.periodLabel }}
        </view>
      </view>
    </view>

    <view v-if="!agentCode" class="card mt-4 p-4">
      <t-empty icon="view-list" description="缺少成员编码" />
    </view>

    <view v-else-if="error && !detail" class="card mt-4 p-4">
      <t-empty icon="error-circle" :description="error.message || '数据加载失败'" />
    </view>

    <view v-else-if="!canShowPerformance && !isLoading" class="card mt-4 p-4">
      <t-empty icon="view-list" description="该成员暂无业绩数据" />
    </view>

    <view v-else class="space-y-4">
      <view v-if="availableYears.length > 0" class="mt-4">
        <view class="mb-3 text-sm font-semibold text-foreground">
          年份
        </view>
        <scroll-view scroll-x class="whitespace-nowrap">
          <view class="inline-flex gap-2">
            <view
              v-for="year in availableYears"
              :key="year"
              class="pill pill-lg"
              :class="activeYear === year
                ? 'pill-selected'
                : 'pill-card'"
              @tap="chooseYear(year)"
            >
              {{ year }} 年
            </view>
          </view>
        </scroll-view>
      </view>

      <view>
        <view class="mb-3 text-sm font-semibold text-foreground">
          当前核心指标
        </view>
        <view class="grid grid-cols-2 gap-3">
          <view
            v-for="item in coreMetrics"
            :key="item.label"
            class="card p-4"
          >
            <view class="text-xs text-muted-foreground">
              {{ item.label }}
            </view>
            <view class="mt-2 text-lg font-semibold" :class="item.tone">
              {{ item.value }}
            </view>
          </view>
        </view>
      </view>

      <view>
        <view class="mb-3 text-sm font-semibold text-foreground">
          扩展指标
        </view>
        <view class="card-list">
          <view
            v-for="item in extendedMetrics"
            :key="item.label"
            class="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-b-0"
          >
            <view class="text-sm text-muted-foreground">
              {{ item.label }}
            </view>
            <view class="text-sm font-semibold text-foreground">
              {{ item.value }}
            </view>
          </view>
        </view>
      </view>

      <view>
        <view class="mb-3 text-sm font-semibold text-foreground">
          {{ activeYear ? `${activeYear} 年月度趋势` : '月度趋势' }}
        </view>
        <view class="space-y-3">
          <view
            v-for="item in history"
            :key="`${item.year}-${item.month}`"
            class="card p-4"
          >
            <view class="flex items-center justify-between">
              <view class="text-base font-semibold text-foreground">
                {{ formatMonth(item.month) }}
              </view>
              <view
                class="pill"
                :class="item.isQualified
                  ? 'pill-success'
                  : 'pill-warning'"
              >
                {{ formatQualified(item.isQualified) }}
              </view>
            </view>

            <view class="mt-4 grid grid-cols-2 gap-3">
              <view class="rounded-2xl bg-muted/60 px-3 py-3">
                <view class="text-xs text-muted-foreground">
                  NSC
                </view>
                <view class="mt-1 text-lg font-semibold text-[#d9485f]">
                  {{ formatNumber(item.nsc) }}
                </view>
              </view>
              <view class="rounded-2xl bg-muted/60 px-3 py-3">
                <view class="text-xs text-muted-foreground">
                  CASE
                </view>
                <view class="mt-1 text-lg font-semibold text-[#dd6b20]">
                  {{ formatNumber(item.netCase) }}
                </view>
              </view>
              <view class="rounded-2xl bg-muted/60 px-3 py-3">
                <view class="text-xs text-muted-foreground">
                  累计 NSC
                </view>
                <view class="mt-1 text-lg font-semibold">
                  {{ formatNumber(item.nscSum) }}
                </view>
              </view>
              <view class="rounded-2xl bg-muted/60 px-3 py-3">
                <view class="text-xs text-muted-foreground">
                  累计 CASE
                </view>
                <view class="mt-1 text-lg font-semibold">
                  {{ formatNumber(item.netCaseSum) }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
