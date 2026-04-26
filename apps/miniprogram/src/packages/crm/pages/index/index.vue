<script setup lang="ts">
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref, watchEffect } from 'wevu'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import { formatDate as formatDateValue } from '@/lib/time'
import { useCustomersStore, useCustomerTypesStore } from '../../store'
import { formatCustomerDisplayName } from '../../utils/customer'

definePageJson({
  navigationBarTitleText: '客户管理',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-fab': 'tdesign-miniprogram/fab/fab',
    't-indexes': 'tdesign-miniprogram/indexes/indexes',
    't-indexes-anchor': 'tdesign-miniprogram/indexes-anchor/indexes-anchor',
    't-search': 'tdesign-miniprogram/search/search',
  },
})

const CONTACT_INDEX_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
const CHINESE_INITIAL_FALLBACKS: Record<string, string> = {
  艾: 'A',
  安: 'A',
  白: 'B',
  包: 'B',
  曹: 'C',
  陈: 'C',
  邓: 'D',
  丁: 'D',
  冯: 'F',
  傅: 'F',
  高: 'G',
  郭: 'G',
  何: 'H',
  黄: 'H',
  蒋: 'J',
  金: 'J',
  康: 'K',
  孔: 'K',
  李: 'L',
  刘: 'L',
  马: 'M',
  孟: 'M',
  倪: 'N',
  牛: 'N',
  欧: 'O',
  潘: 'P',
  彭: 'P',
  秦: 'Q',
  钱: 'Q',
  任: 'R',
  沈: 'S',
  孙: 'S',
  唐: 'T',
  田: 'T',
  王: 'W',
  吴: 'W',
  肖: 'X',
  徐: 'X',
  杨: 'Y',
  于: 'Y',
  张: 'Z',
  赵: 'Z',
  周: 'Z',
  朱: 'Z',
}

const PINYIN_BOUNDARIES = [
  { letter: 'A', sample: '阿' },
  { letter: 'B', sample: '八' },
  { letter: 'C', sample: '嚓' },
  { letter: 'D', sample: '哒' },
  { letter: 'E', sample: '饿' },
  { letter: 'F', sample: '发' },
  { letter: 'G', sample: '旮' },
  { letter: 'H', sample: '哈' },
  { letter: 'J', sample: '击' },
  { letter: 'K', sample: '咔' },
  { letter: 'L', sample: '垃' },
  { letter: 'M', sample: '妈' },
  { letter: 'N', sample: '拿' },
  { letter: 'O', sample: '哦' },
  { letter: 'P', sample: '啪' },
  { letter: 'Q', sample: '七' },
  { letter: 'R', sample: '然' },
  { letter: 'S', sample: '撒' },
  { letter: 'T', sample: '他' },
  { letter: 'W', sample: '哇' },
  { letter: 'X', sample: '夕' },
  { letter: 'Y', sample: '丫' },
  { letter: 'Z', sample: '匝' },
]

const zhCollator = typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
  ? new Intl.Collator('zh-Hans-CN')
  : null

const archived = ref(false)
const keyword = ref('')
const customerTypeId = ref<number | null>(null)

const filters = computed<RpcInput<'crm/listCustomers'>>(() => ({
  archived: archived.value,
  keyword: keyword.value || undefined,
  customerTypeId: customerTypeId.value,
}))

const { customerTypes } = useCustomerTypesStore()
const { customers, isLoading, error, refetch } = useCustomersStore(filters)

const rows = computed(() => customers.value ?? [])
const currentCustomerType = computed(() => {
  return (customerTypes.value ?? []).find(type => type.id === customerTypeId.value) ?? null
})
const pageError = computed(() => error.value?.message ?? null)
const customerSections = computed(() => buildCustomerSections(rows.value))
const customerIndexList = computed(() => customerSections.value.map(section => section.letter))

onLoad((options) => {
  const id = Number(options?.customerTypeId)
  customerTypeId.value = Number.isInteger(id) && id > 0 ? id : null
})

watchEffect(() => {
  const typeRows = customerTypes.value ?? []
  if (!customerTypeId.value && typeRows.length) {
    customerTypeId.value = typeRows[0].id
  }

  wx.setNavigationBarTitle({
    title: currentCustomerType.value?.name ?? '客户管理',
  })
})

usePullDownRefresh(async () => {
  await refetch()
})

function handleKeywordChange(event: { value?: string }) {
  keyword.value = event.value ?? ''
}

function showActiveCustomers() {
  archived.value = false
}

function showArchivedCustomers() {
  archived.value = true
}

function goCreate() {
  const query = customerTypeId.value ? `?customerTypeId=${customerTypeId.value}` : ''
  wx.navigateTo({ url: `/pages/customer-new/index${query}` })
}

function goDetail(customerId: number) {
  wx.navigateTo({ url: `/packages/crm/pages/detail/index?id=${customerId}` })
}

function formatDate(value: string | Date | null): string {
  return formatDateValue(value, '未跟进')
}

function buildCustomerSections(items: typeof rows.value) {
  const sectionMap = new Map<string, typeof rows.value>()

  for (const customer of items) {
    const letter = getCustomerInitial(customer.name)
    const sectionRows = sectionMap.get(letter) ?? []
    sectionRows.push(customer)
    sectionMap.set(letter, sectionRows)
  }

  return CONTACT_INDEX_LETTERS
    .map(letter => ({
      letter,
      customers: [...(sectionMap.get(letter) ?? [])].sort(compareCustomerName),
    }))
    .filter(section => section.customers.length > 0)
}

function compareCustomerName(left: typeof rows.value[number], right: typeof rows.value[number]) {
  if (zhCollator) {
    return zhCollator.compare(left.name, right.name)
  }

  return left.name.localeCompare(right.name)
}

function getCustomerInitial(value: string): string {
  const firstChar = value.trim().charAt(0)
  if (!firstChar) {
    return '#'
  }

  const upperChar = firstChar.toUpperCase()
  if (upperChar >= 'A' && upperChar <= 'Z') {
    return upperChar
  }

  const fallbackInitial = CHINESE_INITIAL_FALLBACKS[firstChar]
  if (fallbackInitial) {
    return fallbackInitial
  }

  if (!zhCollator) {
    return '#'
  }

  let initial = '#'
  for (const boundary of PINYIN_BOUNDARIES) {
    if (zhCollator.compare(firstChar, boundary.sample) >= 0) {
      initial = boundary.letter
      continue
    }

    break
  }

  return initial
}
</script>

<template>
  <view class="min-h-screen bg-background">
    <view class="sticky top-0 z-10 bg-background pb-3 pt-4">
      <t-search
        class="customer-search"
        :value="keyword"
        placeholder="搜索姓名、手机、微信、标签"
        confirm-type="search"
        clearable
        @change="handleKeywordChange"
      />

      <view class="mt-3 flex flex-wrap gap-2 px-4">
        <view
          class="pill"
          :class="archived ? 'pill-muted' : 'pill-selected'"
          @tap="showActiveCustomers"
        >
          正常
        </view>
        <view
          class="pill"
          :class="archived ? 'pill-selected' : 'pill-muted'"
          @tap="showArchivedCustomers"
        >
          已归档
        </view>
      </view>
    </view>

    <view class="pb-16">
      <t-empty
        v-if="pageError && !customers"
        class="mx-4 mt-4 rounded-xl bg-card py-10 shadow-sm"
        icon="error-circle"
        :description="pageError"
      />

      <t-empty
        v-else-if="rows.length === 0 && !isLoading"
        class="mx-4 mt-4 rounded-xl bg-card py-10 shadow-sm"
        icon="view-list"
        description="暂无客户"
      />

      <t-indexes
        v-else
        class="customer-indexes"
        :index-list="customerIndexList"
        show-full-index
        :sticky-offset="96"
      >
        <t-indexes-anchor
          v-for="section in customerSections"
          :key="section.letter"
          :index="section.letter"
        >
          <view class="px-4 py-2 text-xs leading-4 text-muted-foreground">
            {{ section.letter }}
          </view>

          <view class="bg-card">
            <view
              v-for="customer in section.customers"
              :key="customer.id"
              class="flex min-h-[112rpx] items-center pl-4"
              hover-class="bg-muted"
              @tap="goDetail(customer.id)"
            >
              <view class="min-w-0 flex-1 border-b border-border py-3 pr-8">
                <view class="truncate text-base font-normal text-foreground">
                  {{ formatCustomerDisplayName(customer) }}
                  <text class="ml-2 text-xs text-muted-foreground">
                    {{ formatDate(customer.lastFollowedAt) }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </t-indexes-anchor>
      </t-indexes>
    </view>

    <t-fab icon="add" @click="goCreate" />

    <t-toast id="t-toast" />
  </view>
</template>

<style scoped>
.customer-search {
  --td-search-bg-color: var(--card);
}
</style>
