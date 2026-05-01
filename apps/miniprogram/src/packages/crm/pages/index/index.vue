<script setup lang="ts">
import type { CustomerGender } from '../../utils/customer'
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { formatDate as formatDateValue } from '@/lib/time'
import { useCustomersStore } from '../../store'
import { formatCustomerDisplayName } from '../../utils/customer'

definePageJson({
  navigationBarTitleText: '客户管理',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-fab': 'tdesign-miniprogram/fab/fab',
    't-icon': 'tdesign-miniprogram/icon/icon',
    't-input': 'tdesign-miniprogram/input/input',
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

const keyword = ref('')
const customerTypeId = ref<number | null>(null)
const createPopupVisible = ref(false)
const createName = ref('')
const createGender = ref<CustomerGender>('M')

const filters = computed<RpcInput<'crm/listCustomers'>>(() => customerTypeId.value
  ? ({
      keyword: keyword.value || undefined,
      customerTypeId: customerTypeId.value,
    })
  : undefined)

const { showToast } = useToast()
const { customers, isLoading, error, refetch } = useCustomersStore(filters)
const createMutation = useMutation('crm/createCustomer', {
  showLoading: '保存客户中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

const rows = computed(() => customers.value ?? [])
const pageError = computed(() => {
  if (!customerTypeId.value) {
    return '客户类型 ID 无效'
  }

  return error.value?.message ?? null
})
const hasBlockingPageError = computed(() =>
  Boolean(pageError.value && (!customers.value || !customerTypeId.value)),
)
const customerSections = computed(() => buildCustomerSections(rows.value))
const customerIndexList = computed(() => customerSections.value.map(section => section.letter))
const isCreatingCustomer = computed(() => createMutation.loading.value)
const createPopupTitle = '新建客户'

onLoad((options) => {
  const id = Number(options?.customerTypeId)
  customerTypeId.value = Number.isInteger(id) && id > 0 ? id : null
})

usePullDownRefresh(async () => {
  await refetch()
})

function handleKeywordChange(event: { value?: string }) {
  keyword.value = event.value ?? ''
}

function goCreate() {
  if (!customerTypeId.value) {
    showToast('客户类型无效', 'warning')
    return
  }

  createName.value = ''
  createGender.value = 'M'
  createPopupVisible.value = true
}

function goDetail(customerId: number) {
  wx.navigateTo({ url: `/packages/crm/pages/detail/index?id=${customerId}` })
}

function handleCreatePopupVisibleChange(payload: { visible?: boolean }) {
  createPopupVisible.value = payload.visible ?? false
}

function handleCreateNameChange(event: { value?: string }) {
  createName.value = event.value ?? ''
}

function selectCreateGender(value: CustomerGender) {
  createGender.value = value
}

function buildCreatePayload(allowDuplicate: boolean): RpcInput<'crm/createCustomer'> | null {
  if (!customerTypeId.value) {
    showToast('客户类型无效', 'warning')
    return null
  }

  const customerName = createName.value.trim()
  if (!customerName) {
    showToast('请填写客户称呼', 'warning')
    return null
  }

  return {
    customerTypeId: customerTypeId.value,
    name: customerName,
    gender: createGender.value,
    birthday: null,
    city: null,
    phone: null,
    wechat: null,
    tags: [],
    note: null,
    profileValues: [],
    allowDuplicate,
  }
}

async function saveCreatedCustomer(allowDuplicate = false) {
  const payload = buildCreatePayload(allowDuplicate)
  if (!payload) {
    return
  }

  const result = await createMutation.mutate(payload)
  if (!result) {
    return
  }

  if (result.duplicates.length > 0 && !allowDuplicate) {
    wx.showModal({
      title: '发现重复客户',
      content: `已存在 ${result.duplicates.length} 个同类型客户，仍然保存？`,
      confirmText: '继续保存',
      success: (modalResult) => {
        if (modalResult.confirm) {
          void saveCreatedCustomer(true)
        }
      },
    })
    return
  }

  invalidateQueries('crm/listCustomers')
  invalidateQueries('crm/getCustomer')
  await refetch()
  createPopupVisible.value = false
  showToast('客户已创建')
}

function handleSaveCreatedCustomer() {
  void saveCreatedCustomer(false)
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
        placeholder="搜索姓名、手机、城市、微信、标签"
        confirm-type="search"
        clearable
        @change="handleKeywordChange"
      />

    </view>

    <view class="pb-16">
      <t-empty
        v-if="hasBlockingPageError"
        class="mx-4 mt-4 rounded-xl bg-card py-10 shadow-sm"
        icon="error-circle"
        :description="pageError"
      />

      <t-empty
        v-else-if="rows.length === 0 && !isLoading"
        description="暂无客户"
      />

      <t-indexes
        v-else
        class="customer-indexes"
        :index-list="customerIndexList"
        show-full-index
        :sticky-offset="64"
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

    <t-fab>
      <t-button theme="primary" shape="circle" size="large" @click="goCreate">
        <t-icon name="add" size="44rpx" />
      </t-button>
    </t-fab>

    <HalfScreenPopup
      :visible="createPopupVisible"
      :title="createPopupTitle"
      use-footer-slot
      :footer-border="false"
      max-content-height="52vh"
      @visible-change="handleCreatePopupVisibleChange"
    >
      <view class="-mx-4">
        <t-cell-group bordered>
          <t-input
            :value="createName"
            label="称呼"
            placeholder="必填"
            t-class-label="customer-create-label"
            @change="handleCreateNameChange"
          >
            <template #suffix>
              <view class="flex gap-2">
                <view
                  class="pill"
                  :class="createGender === 'M' ? 'pill-selected' : 'pill-muted'"
                  @tap="selectCreateGender('M')"
                >
                  先生
                </view>
                <view
                  class="pill"
                  :class="createGender === 'F' ? 'pill-selected' : 'pill-muted'"
                  @tap="selectCreateGender('F')"
                >
                  女士
                </view>
              </view>
            </template>
          </t-input>
        </t-cell-group>
      </view>

      <template #footer>
        <t-button theme="primary" block :disabled="isCreatingCustomer" @click="handleSaveCreatedCustomer">
          新建客户
        </t-button>
      </template>
    </HalfScreenPopup>

    <t-toast id="t-toast" />
  </view>
</template>

<style lang="postcss">
.customer-search {
  --td-search-bg-color: var(--card);
}

.customer-create-label {
  flex: 0 0 112rpx;
  width: 112rpx;
}
</style>
