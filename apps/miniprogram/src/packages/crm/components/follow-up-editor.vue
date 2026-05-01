<script setup lang="ts">
import type { RpcInput } from '@/lib/rpc'
import type { CustomerDetail } from '../store'
import { computed, ref, watchEffect } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { useToast } from '@/hooks/useToast'

defineComponentJson({
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
    't-date-time-picker': 'tdesign-miniprogram/date-time-picker/date-time-picker',
    't-textarea': 'tdesign-miniprogram/textarea/textarea',
  },
})

type FollowUpRecord = CustomerDetail['followUps'][number]
type FollowUpMethod = NonNullable<FollowUpRecord['method']>

const METHOD_OPTIONS: Array<{ value: FollowUpMethod, label: string }> = [
  { value: 'face', label: '面聊' },
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'other', label: '其他' },
]

const props = defineProps<{
  visible: boolean
  customerId: number | null
  record?: FollowUpRecord | null
}>()

const emit = defineEmits(['visible-change', 'success'])

const timePickerVisible = ref(false)
const followedAt = ref(formatHourInputDate(new Date()))
const latestFollowedAt = ref(formatHourInputDate(new Date()))
const earliestFollowedAt = ref(formatHourInputDate(shiftMonths(new Date(), -3)))
const method = ref<FollowUpMethod | null>(null)
const content = ref('')
const initializedKey = ref('')

const { showToast } = useToast()
const createMutation = useMutation('crm/createFollowUp', {
  showLoading: '保存跟进中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})
const updateMutation = useMutation('crm/updateFollowUp', {
  showLoading: '保存跟进中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

const isEditing = computed(() => Boolean(props.record))
const popupTitle = computed(() => isEditing.value ? '编辑跟进' : '添加跟进')
const isSaving = computed(() => createMutation.loading.value || updateMutation.loading.value)

watchEffect(() => {
  if (!props.visible) {
    initializedKey.value = ''
    timePickerVisible.value = false
    return
  }

  const key = props.record ? `edit:${props.record.id}` : `create:${props.customerId ?? ''}`
  if (initializedKey.value === key) {
    return
  }

  initializedKey.value = key
  latestFollowedAt.value = formatHourInputDate(new Date())
  earliestFollowedAt.value = formatHourInputDate(shiftMonths(new Date(), -3))

  if (props.record) {
    followedAt.value = formatDateTime(props.record.followedAt)
    method.value = props.record.method
    content.value = props.record.content
    return
  }

  followedAt.value = formatHourInputDate(new Date())
  method.value = null
  content.value = ''
})

function handleVisibleChange(payload: { visible?: boolean }) {
  emit('visible-change', {
    visible: payload.visible ?? false,
  })
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

function selectMethod(value: FollowUpMethod) {
  method.value = method.value === value ? null : value
}

async function saveFollowUp() {
  if (!props.customerId || isSaving.value) {
    return
  }

  const record = props.record
  const payload = {
    customerId: props.customerId,
    method: method.value,
    followedAt: followedAt.value,
    content: content.value,
  }

  if (record) {
    const result = await updateMutation.mutate({
      ...payload,
      followUpId: record.id,
    } satisfies RpcInput<'crm/updateFollowUp'>)

    if (result) {
      emit('success', { mode: 'update' })
    }
    return
  }

  const result = await createMutation.mutate(payload satisfies RpcInput<'crm/createFollowUp'>)
  if (result) {
    emit('success', { mode: 'create', followUpId: result.followUpId })
  }
}

function formatDateTime(value: string | Date | null): string {
  if (!value) {
    return formatHourInputDate(new Date())
  }

  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) {
    return formatHourInputDate(new Date())
  }

  return formatHourInputDate(date)
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
  <HalfScreenPopup
    :visible="props.visible"
    :title="popupTitle"
    use-footer-slot
    :footer-border="false"
    @visible-change="handleVisibleChange"
  >
    <view class="-mx-4">
      <t-cell-group bordered>
        <view class="flex min-h-[96rpx] items-center border-b border-border bg-card px-4 py-3" @tap="openTimePicker">
          <view class="w-[160rpx] shrink-0 text-base text-foreground">
            跟进时间
          </view>
          <view class="flex min-w-0 flex-1 items-center justify-end gap-2">
            <view class="truncate text-base text-muted-foreground">
              {{ followedAt }}
            </view>
            <view class="text-2xl leading-none text-muted-foreground">
              ›
            </view>
          </view>
        </view>
        <view class="flex min-h-[96rpx] items-center border-b border-border bg-card px-4 py-3">
          <view class="w-[160rpx] shrink-0 text-base text-foreground">
            跟进方式
          </view>
          <view class="flex min-w-0 flex-1 flex-wrap justify-end gap-2">
            <view
              v-for="option in METHOD_OPTIONS"
              :key="option.value"
              class="pill"
              :class="method === option.value ? 'pill-selected' : 'pill-muted'"
              @tap="selectMethod(option.value)"
            >
              {{ option.label }}
            </view>
          </view>
        </view>
        <t-textarea
          :value="content"
          placeholder="请输入跟进内容"
          :autosize="{ minHeight: 160, maxHeight: 260 }"
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
      <t-button theme="primary" block :disabled="isSaving" @click="saveFollowUp">
        保存跟进
      </t-button>
    </template>
  </HalfScreenPopup>
</template>
