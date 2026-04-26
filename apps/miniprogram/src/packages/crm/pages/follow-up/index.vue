<script setup lang="ts">
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref, watchEffect } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useNavTitle } from '@/hooks/useNavTitle'
import { invalidateQueries } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { useToast } from '@/hooks/useToast'
import { formatTime } from '@/lib/time'
import { useCustomerDetailStore, useCustomerTypesStore, type CustomerDetail } from '../../store'

definePageJson({
  navigationBarTitleText: '跟进记录',
  backgroundColor: '#f6f7fb',
})

const customerId = ref<number | null>(null)
const followUpPopupVisible = ref(false)
const timePickerVisible = ref(false)
const editingFollowUpId = ref<number | null>(null)
const statusId = ref<number | null>(null)
const followedAt = ref(formatHourInputDate(new Date()))
const latestFollowedAt = ref(formatHourInputDate(new Date()))
const earliestFollowedAt = ref(formatHourInputDate(shiftMonths(new Date(), -3)))
const content = ref('')
const initializedFor = ref<number | null>(null)

const { showToast } = useToast()
const { customerTypes, error: typesError } = useCustomerTypesStore()
const { customer, error, refetch } = useCustomerDetailStore(customerId)
const mutation = useMutation('crm/createFollowUp', {
  showLoading: '保存跟进中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})
const updateMutation = useMutation('crm/updateFollowUp', {
  showLoading: '保存跟进中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

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
const popupTitle = computed(() => editingFollowUpId.value ? '编辑跟进' : '添加跟进')
const saveButtonText = computed(() => editingFollowUpId.value ? '保存跟进' : '保存跟进')
const statuses = computed(() => {
  const typeId = customer.value?.customerTypeId
  if (!typeId) {
    return []
  }

  return (customerTypes.value ?? [])
    .find(type => type.id === typeId)
    ?.followUpStatuses ?? []
})
const isArchived = computed(() => Boolean(customer.value?.archivedAt))

watchEffect(() => {
  const detail = customer.value
  if (!detail || statuses.value.length === 0 || initializedFor.value === detail.id) {
    return
  }

  initializedFor.value = detail.id
  statusId.value = statuses.value[0].id
})

function openFollowUpPopup() {
  if (!customer.value || isArchived.value) {
    return
  }

  followedAt.value = formatHourInputDate(new Date())
  latestFollowedAt.value = followedAt.value
  earliestFollowedAt.value = formatHourInputDate(shiftMonths(new Date(), -3))
  editingFollowUpId.value = null
  content.value = ''
  statusId.value = statuses.value[0]?.id ?? statusId.value
  followUpPopupVisible.value = true
}

function openEditFollowUp(record: CustomerDetail['followUps'][number]) {
  if (isArchived.value) {
    return
  }

  followedAt.value = formatDateTime(record.followedAt)
  latestFollowedAt.value = formatHourInputDate(new Date())
  earliestFollowedAt.value = formatHourInputDate(shiftMonths(new Date(), -3))
  editingFollowUpId.value = record.id
  statusId.value = record.statusId
  content.value = record.content
  followUpPopupVisible.value = true
}

function handlePopupVisibleChange(payload: { visible?: boolean }) {
  followUpPopupVisible.value = payload.visible ?? false
  if (!payload.visible) {
    timePickerVisible.value = false
  }
}

function selectStatus(id: number) {
  statusId.value = id
}

function openTimePicker() {
  timePickerVisible.value = true
}

function closeTimePicker() {
  timePickerVisible.value = false
}

function handleFollowedAtConfirm(event: { value?: string | number, detail?: { value?: string | number } }) {
  const value = event.value ?? event.detail?.value
  if (value != null) {
    followedAt.value = String(value)
  }
  timePickerVisible.value = false
}

function handleContentChange(event: { value?: string }) {
  content.value = event.value ?? ''
}

async function saveFollowUp() {
  if (!customerId.value) {
    return
  }
  if (typesError.value) {
    showToast(typesError.value.message || '跟进配置加载失败', 'error')
    return
  }
  if (!statusId.value) {
    showToast('请选择跟进状态', 'warning')
    return
  }

  const payload = {
    customerId: customerId.value,
    statusId: statusId.value,
    followedAt: followedAt.value,
    content: content.value,
  }

  const result = editingFollowUpId.value
    ? await updateMutation.mutate({
        ...payload,
        followUpId: editingFollowUpId.value,
      } satisfies RpcInput<'crm/updateFollowUp'>)
    : await mutation.mutate(payload satisfies RpcInput<'crm/createFollowUp'>)

  if (!result) {
    return
  }

  invalidateQueries('crm/getCustomer')
  invalidateQueries('crm/listCustomers')
  await refetch()
  followUpPopupVisible.value = false
  editingFollowUpId.value = null
  showToast('跟进已保存')
}

function formatDateTime(value: string | Date | null): string {
  return formatTime(value, '-')
}

function truncateContent(value: string): string {
  return value.length > 30 ? `${value.slice(0, 30)}...` : value
}

function formatHourInputDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:00`
}

function shiftMonths(value: Date, offset: number): Date {
  const date = new Date(value)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + offset)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return date
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

      <t-cell-group v-else bordered>
        <t-cell
          v-for="record in followUps"
          :key="record.id"
          arrow
          @click="openEditFollowUp(record)"
        >
          <template #title>
            <view>
              <view class="flex items-center justify-between gap-3">
                <view class="text-xs text-muted-foreground">
                  {{ formatDateTime(record.followedAt) }}
                </view>
                <view class="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {{ record.statusNameSnapshot }}
                </view>
              </view>
              <view class="mt-2 text-sm text-foreground">
                {{ truncateContent(record.content) }}
              </view>
            </view>
          </template>
        </t-cell>
      </t-cell-group>

      <view v-if="!isArchived" class="fixed bottom-8 right-4 z-10">
        <t-button theme="primary" shape="circle" size="large" @click="openFollowUpPopup">
          <t-icon name="add" size="44rpx" />
        </t-button>
      </view>
    </template>

    <HalfScreenPopup
      :visible="followUpPopupVisible"
      :title="popupTitle"
      use-footer-slot
      :footer-border="false"
      @visible-change="handlePopupVisibleChange"
    >
      <view class="flex flex-wrap gap-2">
        <view
          v-for="status in statuses"
          :key="status.id"
          class="pill"
          :class="statusId === status.id ? 'pill-selected' : 'pill-muted'"
          @tap="selectStatus(status.id)"
        >
          {{ status.name }}
        </view>
      </view>

      <view class="-mx-4 mt-4">
        <t-cell-group bordered>
          <t-cell
            title="跟进时间"
            :note="followedAt"
            arrow
            @click="openTimePicker"
          />
          <t-textarea
            :value="content"
            placeholder="请输入跟进内容"
            :autosize="{ minHeight: 96, maxHeight: 180 }"
            :maxlength="500"
            @change="handleContentChange"
          />
        </t-cell-group>
      </view>

      <t-date-time-picker
        :visible="timePickerVisible"
        :value="followedAt"
        :start="earliestFollowedAt"
        :end="latestFollowedAt"
        title="选择跟进时间"
        format="YYYY-MM-DD HH:00"
        :mode="['date', 'hour']"
        @confirm="handleFollowedAtConfirm"
        @cancel="closeTimePicker"
        @close="closeTimePicker"
      />

      <template #footer>
        <t-button theme="primary" block @click="saveFollowUp">
          {{ saveButtonText }}
        </t-button>
      </template>
    </HalfScreenPopup>

    <t-toast id="t-toast" />
  </view>
</template>
