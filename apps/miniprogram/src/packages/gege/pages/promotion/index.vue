<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'
import DesignationBadge from '@/components/designation-badge/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import { useToast } from '@/hooks/useToast'
import { parseRouteAgentCode } from '../../lib/agent-code'
import {
  formatMetricValue,
  formatNumber,
  formatPeriod,
  formatRate,
} from '../../lib/format'
import { usePromotionStore } from '../../store'

definePageJson({
  navigationBarTitleText: '我的晋级',
  backgroundColor: '#f6f7fb',
})

type PromotionMetricFormat = 'amount' | 'count' | 'percent'

const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const canQueryPromotion = computed(() => routeReady.value && !routeError.value)
const currentMonth = new Date().toISOString().slice(0, 7)

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error

  wx.setNavigationBarTitle({
    title: parsedAgentCode.agentCode ? '代理人晋级' : '我的晋级',
  })

  routeReady.value = true
})

const {
  promotion,
  isLoading,
  error,
  refetch,
} = usePromotionStore(routeAgentCode, canQueryPromotion)
const { hideLoading, showLoading, showToast } = useToast()
const { mutate: updateLastPromotionDate, loading: updatingLastPromotionDate } = useMutation(
  'gege/updateLastPromotionDate',
)

usePullDownRefresh(async () => {
  if (!canQueryPromotion.value) {
    return
  }

  await refetch()
})

const pageError = computed(() => routeError.value ?? error.value?.message ?? null)
const pageTitle = computed(() => routeAgentCode.value ? '代理人晋级' : '我的晋级')
const viewContextLabel = computed(() => {
  return routeAgentCode.value
    ? `当前查看 ${routeAgentCode.value}`
    : null
})
const actualDesignationName = computed(() => promotion.value?.designation.actualName ?? null)
const targetDesignationName = computed(() => promotion.value?.designation.targetName ?? null)
const saleCalculateStartLabel = computed(() => formatPeriod(promotion.value?.saleCalculateStartPeriod))
const lastPromotionDateLabel = computed(() => formatLastPromotionMonth(promotion.value?.lastPromotionDate))
const pickerLastPromotionDate = computed(() => toMonthValue(promotion.value?.lastPromotionDate) ?? currentMonth)
const isReady = computed(() => promotion.value?.status === 'ready')

const emptyDescription = computed(() => {
  if (promotion.value?.status === 'no-target') {
    return '当前职级没有可展示的晋级目标'
  }

  if (promotion.value?.status === 'no-performance') {
    return '暂无业绩数据，无法计算晋级进度'
  }

  return '暂无晋级信息'
})

const metricCards = computed(() => {
  return (promotion.value?.metrics ?? []).map((metric) => {
    const progressPercent = clampPercent(metric.progress * 100)

    return {
      ...metric,
      progressPercent,
      progressLabel: metric.progress >= 1
        ? '已达标'
        : `${Math.round(progressPercent)}%`,
      actualLabel: formatPromotionValue(metric.actual, metric.format),
      targetLabel: formatPromotionValue(metric.target, metric.format),
      differenceLabel: formatSignedPromotionValue(metric.difference, metric.format),
      differenceTone: metric.difference >= 0 ? 'success' : 'danger',
    }
  })
})

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value <= 0) {
    return 0
  }

  if (value >= 100) {
    return 100
  }

  return value
}

function formatPromotionValue(value: number, format: PromotionMetricFormat): string {
  if (format === 'amount') {
    return formatMetricValue(value)
  }

  if (format === 'percent') {
    return formatRate(value)
  }

  return formatNumber(value)
}

function formatSignedPromotionValue(value: number, format: PromotionMetricFormat): string {
  const formattedValue = formatPromotionValue(Math.abs(value), format)

  if (value > 0) {
    return `+${formattedValue}`
  }

  if (value < 0) {
    return `-${formattedValue}`
  }

  return formattedValue
}

function toMonthValue(value: string | null | undefined): string | null {
  const matched = value?.match(/^(\d{4})-(\d{2})-\d{2}$/)

  if (!matched) {
    return null
  }

  return `${matched[1]}-${matched[2]}`
}

function formatLastPromotionMonth(value: string | null | undefined): string {
  const monthValue = toMonthValue(value)

  if (!monthValue) {
    return '-'
  }

  const [year, month] = monthValue.split('-')
  return `${year} 年 ${month} 月`
}

type PickerDateEvent = {
  detail?: {
    value?: string
  }
}

async function saveLastPromotionDate(lastPromotionDate: string | null) {
  if (!promotion.value || updatingLastPromotionDate.value) {
    return
  }

  if (lastPromotionDate === promotion.value.lastPromotionDate) {
    return
  }

  showLoading('保存中...')
  try {
    const result = await updateLastPromotionDate({
      agentCode: routeAgentCode.value ?? undefined,
      lastPromotionDate,
    })

    if (!result) {
      showToast('上次晋级日期保存失败', 'error')
      return
    }

    await refetch()
    showToast(lastPromotionDate ? '上次晋级日期已保存' : '上次晋级日期已清空')
  }
  catch {
    showToast('上次晋级日期保存失败', 'error')
  }
  finally {
    hideLoading()
  }
}

function handleLastPromotionDateChange(event: PickerDateEvent) {
  const nextDate = event.detail?.value?.trim()

  if (!nextDate) {
    return
  }

  const currentMonthValue = toMonthValue(promotion.value?.lastPromotionDate)
  if (nextDate === currentMonthValue) {
    return
  }

  void saveLastPromotionDate(nextDate)
}

function clearLastPromotionDate() {
  if (!promotion.value?.lastPromotionDate || updatingLastPromotionDate.value) {
    return
  }

  wx.showModal({
    title: '清空晋级日期',
    content: '确认清空上次晋级日期？',
    confirmText: '清空',
    confirmColor: '#e23a3b',
    cancelText: '取消',
    success: (result) => {
      if (result.confirm) {
        void saveLastPromotionDate(null)
      }
    },
  })
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view v-if="pageError && !promotion" class="card p-4">
      <t-empty icon="error-circle" :description="pageError || '数据加载失败'" />
    </view>

    <template v-else-if="promotion">
      <view class="card bg-hero p-4">
        <view class="flex items-start justify-between gap-3">
          <view class="min-w-0">
            <view class="text-lg font-semibold text-foreground">
              {{ pageTitle }}
            </view>
            <view v-if="viewContextLabel" class="mt-1 text-sm text-muted-foreground">
              {{ viewContextLabel }}
            </view>

            <view class="mt-4 flex items-center gap-2">
              <DesignationBadge :designation-name="actualDesignationName" />
              <view
                v-if="targetDesignationName"
                class="text-sm font-medium text-muted-foreground"
              >
                →
              </view>
              <DesignationBadge
                v-if="targetDesignationName"
                :designation-name="targetDesignationName"
              />
            </view>
          </view>
        </view>

        <view class="mt-4 grid grid-cols-1 gap-3">
          <picker
            mode="date"
            fields="month"
            :value="pickerLastPromotionDate"
            :end="currentMonth"
            @change="handleLastPromotionDateChange"
          >
            <view class="promotion-meta-item">
              <view class="promotion-meta-label">
                上次晋级日期
              </view>
              <view class="flex items-center gap-3">
                <view class="promotion-meta-value">
                  {{ updatingLastPromotionDate ? '保存中...' : lastPromotionDateLabel }}
                </view>
                <view
                  v-if="promotion.lastPromotionDate"
                  class="promotion-clear-link"
                  @tap.stop="clearLastPromotionDate"
                >
                  清空
                </view>
              </view>
            </view>
          </picker>

          <view class="promotion-meta-item">
            <view class="promotion-meta-label">
              业绩开始月份
            </view>
            <view class="promotion-meta-value">
              {{ saleCalculateStartLabel }}
            </view>
          </view>
        </view>
      </view>

      <view v-if="!isReady && !isLoading" class="card mt-4 p-4">
        <t-empty icon="view-list" :description="emptyDescription" />
      </view>

      <view v-else class="mt-4 space-y-4">
        <view
          v-for="metric in metricCards"
          :key="metric.key"
          class="card p-4"
        >
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0">
              <view class="text-base font-medium text-foreground">
                {{ metric.label }}
              </view>
            </view>

            <view class="pill" :class="metric.difference >= 0 ? 'pill-success' : 'promotion-pill-danger'">
              {{ metric.progressLabel }}
            </view>
          </view>

          <view class="mt-4 flex items-end justify-between gap-3">
            <view class="min-w-0">
              <view class="text-2xl font-semibold text-foreground">
                {{ metric.actualLabel }}
              </view>
              <view class="mt-2 text-sm text-muted-foreground">
                目标：{{ metric.targetLabel }}
              </view>
              <view
                class="mt-1 text-sm font-medium"
                :class="metric.differenceTone === 'success' ? 'text-success' : 'promotion-text-danger'"
              >
                差距：{{ metric.differenceLabel }}
              </view>
            </view>
          </view>

          <view class="mt-4">
            <view class="promotion-progress-track">
              <view
                class="promotion-progress-fill"
                :class="metric.difference >= 0 ? 'promotion-progress-fill-success' : 'promotion-progress-fill-danger'"
                :style="{ width: `${metric.progressPercent}%` }"
              />
            </view>
          </view>
        </view>
      </view>
    </template>
    <t-toast id="t-toast" />
  </view>
</template>

<style scoped lang="postcss">
.promotion-meta-item {
  @apply flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3;
}

.promotion-meta-label {
  @apply text-sm text-muted-foreground;
}

.promotion-meta-value {
  @apply text-sm font-medium text-foreground text-right;
}

.promotion-clear-link {
  color: #dc2626;
  font-size: 24rpx;
  line-height: 36rpx;
}

.promotion-progress-track {
  @apply h-3 w-full overflow-hidden rounded-full;

  background: rgba(15, 23, 42, 0.08);
}

.promotion-pill-danger {
  background: #fee2e2;
  color: #dc2626;
}

.promotion-text-danger {
  color: #dc2626;
}

.promotion-progress-fill {
  @apply h-full rounded-full;
}

.promotion-progress-fill-success {
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
}

.promotion-progress-fill-danger {
  background: linear-gradient(90deg, #fb7185 0%, #ef4444 100%);
}
</style>
