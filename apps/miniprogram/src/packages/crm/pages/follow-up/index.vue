<script setup lang="ts">
import type { CustomerDetail } from '../../store'
import { computed, onLoad, ref } from 'wevu'
import { useNavTitle } from '@/hooks/useNavTitle'
import { invalidateQueries } from '@/hooks/useQuery'
import { formatTime } from '@/lib/time'
import FollowUpEditor from '../../components/follow-up-editor.vue'
import { useCustomerDetailStore } from '../../store'

definePageJson({
  navigationBarTitleText: '跟进记录',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-icon': 'tdesign-miniprogram/icon/icon',
    't-step-item': 'tdesign-miniprogram/step-item/step-item',
    't-steps': 'tdesign-miniprogram/steps/steps',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

const customerId = ref<number | null>(null)
const followUpPopupVisible = ref(false)
const editingFollowUp = ref<CustomerDetail['followUps'][number] | null>(null)

const { customer, error, refetch } = useCustomerDetailStore(customerId)

useNavTitle(() => {
  const name = customer.value?.name.trim()
  return name ? `${name} - 跟进记录` : '跟进记录'
})

onLoad((options) => {
  const id = Number(options?.customerId)
  customerId.value = Number.isInteger(id) && id > 0 ? id : null
})

const pageError = computed(() => {
  if (!customerId.value) {
    return '客户 ID 无效'
  }

  return error.value?.message ?? null
})
const followUps = computed(() => customer.value?.followUps ?? [])
const completedStepIndex = computed(() => followUps.value.length)

function openFollowUpPopup() {
  if (!customer.value) {
    return
  }

  editingFollowUp.value = null
  followUpPopupVisible.value = true
}

function openEditFollowUp(record: CustomerDetail['followUps'][number]) {
  editingFollowUp.value = record
  followUpPopupVisible.value = true
}

function handlePopupVisibleChange(payload: { visible?: boolean }) {
  followUpPopupVisible.value = payload.visible ?? false
}

function handleStepChange(event: { current?: number, detail?: { current?: number } }) {
  const index = event.current ?? event.detail?.current
  if (typeof index !== 'number') {
    return
  }

  const record = followUps.value[index]
  if (record) {
    openEditFollowUp(record)
  }
}

async function handleFollowUpSuccess() {
  invalidateQueries('crm/getCustomer')
  invalidateQueries('crm/listCustomers')
  await refetch()
  followUpPopupVisible.value = false
}

function formatDateTime(value: string | Date | null): string {
  return formatTime(value, '-')
}

function truncateContent(value: string): string {
  return value.length > 30 ? `${value.slice(0, 30)}...` : value
}

function formatFollowUpMethodIcon(method: CustomerDetail['followUps'][number]['method']): string {
  if (method === 'face') {
    return 'user-talk'
  }
  if (method === 'phone') {
    return 'call'
  }
  if (method === 'wechat') {
    return 'logo-wechat-stroke'
  }
  return 'chat'
}
</script>

<template>
  <view class="min-h-screen bg-background pb-10 pt-3">
    <t-empty
      v-if="pageError && !customer"
      class="bg-card py-10"
      icon="error-circle"
      :description="pageError"
    />

    <template v-else-if="customer">
      <t-empty
        v-if="followUps.length === 0"
        class="bg-card py-10"
        icon="view-list"
        description="暂无跟进记录"
      />

      <view v-else class="bg-card px-4 py-4">
        <t-steps
          layout="vertical"
          :current="completedStepIndex"
          @change="handleStepChange"
        >
          <t-step-item
            v-for="record in followUps"
            :key="record.id"
            icon="slot"
          >
            <template #icon>
              <t-icon :name="formatFollowUpMethodIcon(record.method)" size="28rpx" />
            </template>
            <template #title>
              <view class="text-sm font-normal text-muted-foreground">
                {{ formatDateTime(record.followedAt) }}
              </view>
            </template>
            <template #content>
              <view class="text-sm text-foreground">
                {{ truncateContent(record.content) }}
              </view>
            </template>
          </t-step-item>
        </t-steps>
      </view>

      <view class="fixed bottom-8 right-4 z-10">
        <t-button theme="primary" shape="circle" size="large" @click="openFollowUpPopup">
          <t-icon name="add" size="44rpx" />
        </t-button>
      </view>
    </template>

    <FollowUpEditor
      :visible="followUpPopupVisible"
      :customer-id="customerId"
      :record="editingFollowUp"
      @visible-change="handlePopupVisibleChange"
      @success="handleFollowUpSuccess"
    />

    <t-toast id="t-toast" />
  </view>
</template>
