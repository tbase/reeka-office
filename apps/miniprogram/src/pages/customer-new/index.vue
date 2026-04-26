<script setup lang="ts">
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref, watchEffect } from 'wevu'
import { invalidateQueries } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { useToast } from '@/hooks/useToast'
import { useCustomerTypesStore } from '@/packages/crm/store'
import type { CustomerGender } from '@/packages/crm/utils/customer'

definePageJson({
  navigationBarTitleText: '新建客户',
  backgroundColor: '#f6f7fb',
})

const routeCustomerTypeId = ref<number | null>(null)
const selectedCustomerTypeId = ref<number | null>(null)
const name = ref('')
const gender = ref<CustomerGender>('M')
const phone = ref('')
const initializedKey = ref('')

const { showToast } = useToast()
const { customerTypes, error: typesError } = useCustomerTypesStore()
const createMutation = useMutation('crm/createCustomer', {
  showLoading: '保存客户中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

onLoad((options) => {
  const customerTypeId = Number(options?.customerTypeId)
  routeCustomerTypeId.value = Number.isInteger(customerTypeId) && customerTypeId > 0
    ? customerTypeId
    : null
})

const pageError = computed(() => typesError.value?.message ?? null)

watchEffect(() => {
  const typeRows = customerTypes.value ?? []
  const preferredTypeId = routeCustomerTypeId.value && typeRows.some(type => type.id === routeCustomerTypeId.value)
    ? routeCustomerTypeId.value
    : typeRows[0]?.id

  if (preferredTypeId && !selectedCustomerTypeId.value && initializedKey.value !== `create:${preferredTypeId}`) {
    initializedKey.value = `create:${preferredTypeId}`
    selectedCustomerTypeId.value = preferredTypeId
  }
})

function handleNameChange(event: { value?: string }) {
  name.value = event.value ?? ''
}

function selectGender(value: CustomerGender) {
  gender.value = value
}

function handlePhoneChange(event: { value?: string }) {
  phone.value = event.value ?? ''
}

function buildPayload(allowDuplicate: boolean) {
  const customerTypeId = selectedCustomerTypeId.value
  if (!customerTypeId) {
    showToast('客户类型无效', 'warning')
    return null
  }

  const customerName = name.value.trim()
  if (!customerName) {
    showToast('请填写客户称呼', 'warning')
    return null
  }

  return {
    customerTypeId,
    name: customerName,
    gender: gender.value,
    phone: phone.value.trim() || null,
    wechat: null,
    tags: [],
    note: null,
    profileValues: [],
    allowDuplicate,
  }
}

async function saveCustomer(allowDuplicate = false) {
  const payload = buildPayload(allowDuplicate)
  if (!payload) {
    return
  }

  const result = await createMutation.mutate(payload as RpcInput<'crm/createCustomer'>)

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
          void saveCustomer(true)
        }
      },
    })
    return
  }

  const customerId = result.customerId
  if (!customerId) {
    return
  }

  invalidateQueries('crm/listCustomers')
  invalidateQueries('crm/getCustomer')
  showToast('客户已创建')
  setTimeout(() => {
    wx.redirectTo({ url: `/packages/crm/pages/detail/index?id=${customerId}` })
  }, 300)
}

function handleSaveCustomer() {
  void saveCustomer(false)
}
</script>

<template>
  <view class="min-h-screen bg-background pb-16 pt-3">
    <t-empty
      v-if="pageError && !customerTypes"
      class="rounded-xl bg-card py-10 shadow-lg"
      icon="error-circle"
      :description="pageError"
    />

    <template v-else>
      <view>
        <t-cell-group bordered>
          <t-input
            :value="name"
            label="称呼"
            placeholder="必填"
            t-class-label="customer-new-label"
            @change="handleNameChange"
          >
            <template #suffix>
              <view class="flex gap-2">
                <view
                  class="pill"
                  :class="gender === 'M' ? 'pill-selected' : 'pill-muted'"
                  @tap="selectGender('M')"
                >
                  先生
                </view>
                <view
                  class="pill"
                  :class="gender === 'F' ? 'pill-selected' : 'pill-muted'"
                  @tap="selectGender('F')"
                >
                  女士
                </view>
              </view>
            </template>
          </t-input>
          <t-input
            :value="phone"
            label="手机号"
            placeholder="选填"
            t-class-label="customer-new-label"
            @change="handlePhoneChange"
          />
        </t-cell-group>
      </view>

      <view class="mt-4 px-4">
        <t-button theme="primary" size="large" block @click="handleSaveCustomer">
          新建客户
        </t-button>
      </view>
    </template>

    <t-toast id="t-toast" />
  </view>
</template>

<style lang="postcss">
.customer-new-label {
  flex: 0 0 112rpx;
  width: 112rpx;
}
</style>
