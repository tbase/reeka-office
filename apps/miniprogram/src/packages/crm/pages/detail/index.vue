<script setup lang="ts">
import type { CustomerDetail } from '../../store'
import type { CustomerGender } from '../../utils/customer'
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { formatTime } from '@/lib/time'
import { useCustomerDetailStore } from '../../store'
import { formatCustomerDisplayName } from '../../utils/customer'

definePageJson({
  navigationBarTitleText: '客户详情',
  backgroundColor: '#f6f7fb',
})

type EditableField = 'name' | 'phone' | 'tags' | 'note'

const customerId = ref<number | null>(null)
const editField = ref<EditableField | null>(null)
const editValue = ref('')
const editGender = ref<CustomerGender>('M')

const { customer, error, refetch } = useCustomerDetailStore(customerId)
const { showToast } = useToast()
const archiveMutation = useMutation('crm/archiveCustomer', {
  showLoading: '归档中...',
  onSuccess: async () => {
    invalidateQueries('crm/listCustomers')
    await refetch()
    showToast('客户已归档')
  },
  onError: err => showToast(err.message || '归档失败', 'error'),
})
const updateMutation = useMutation('crm/updateCustomer', {
  showLoading: '保存中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

onLoad((options) => {
  const id = Number(options?.id)
  customerId.value = Number.isInteger(id) && id > 0 ? id : null
})

const pageError = computed(() => {
  if (!customerId.value) {
    return '客户 ID 无效'
  }

  return error.value?.message ?? null
})

const profileRows = computed(() => customer.value?.currentProfileValues ?? [])
const isArchived = computed(() => Boolean(customer.value?.archivedAt))
const editPopupVisible = computed(() => Boolean(editField.value))
const editTitle = computed(() => {
  if (editField.value === 'name') {
    return '编辑称呼'
  }
  if (editField.value === 'phone') {
    return '编辑手机号'
  }
  if (editField.value === 'tags') {
    return '编辑标签'
  }
  return '编辑备注'
})
const editPlaceholder = computed(() => {
  if (editField.value === 'name') {
    return '必填'
  }
  if (editField.value === 'tags') {
    return '用逗号或空格分隔'
  }
  return '选填'
})

function goProfile() {
  if (!customerId.value) {
    return
  }

  wx.navigateTo({ url: `/packages/crm/pages/profile/index?id=${customerId.value}` })
}

function goFollowUp() {
  if (!customerId.value) {
    return
  }

  wx.navigateTo({ url: `/packages/crm/pages/follow-up/index?customerId=${customerId.value}` })
}

function openEditField(field: EditableField) {
  if (!customer.value || isArchived.value) {
    return
  }

  editField.value = field
  if (field === 'name') {
    editValue.value = customer.value.name
    editGender.value = customer.value.gender ?? 'M'
    return
  }

  if (field === 'tags') {
    editValue.value = customer.value.tags.join('，')
    return
  }

  editValue.value = customer.value[field] ?? ''
}

function handleEditPopupVisibleChange(payload: { visible?: boolean }) {
  if (!payload.visible) {
    editField.value = null
    editValue.value = ''
    editGender.value = 'M'
  }
}

function handleEditValueChange(event: { value?: string }) {
  editValue.value = event.value ?? ''
}

function selectEditGender(value: CustomerGender) {
  editGender.value = value
}

const tagSeparator = /[\s,，]+/
function buildTags(value: string): string[] {
  return value
    .split(tagSeparator)
    .map(tag => tag.trim())
    .filter(Boolean)
}

function buildProfileValues(detail: CustomerDetail) {
  return detail.allProfileValues
    .filter(item => item.customerTypeId === detail.customerTypeId)
    .map(item => ({
      fieldId: item.fieldId,
      value: item.value,
    }))
}

function buildUpdatePayload(detail: CustomerDetail, allowDuplicate: boolean): RpcInput<'crm/updateCustomer'> | null {
  const field = editField.value
  if (!field) {
    return null
  }

  const nextName = field === 'name' ? editValue.value.trim() : detail.name
  if (!nextName) {
    showToast('请填写客户称呼', 'warning')
    return null
  }

  return {
    customerId: detail.id,
    customerTypeId: detail.customerTypeId,
    name: nextName,
    gender: field === 'name' ? editGender.value : detail.gender,
    phone: field === 'phone' ? editValue.value.trim() || null : detail.phone,
    wechat: detail.wechat,
    tags: field === 'tags' ? buildTags(editValue.value) : detail.tags,
    note: field === 'note' ? editValue.value.trim() || null : detail.note,
    profileValues: buildProfileValues(detail),
    allowDuplicate,
  }
}

async function saveEditedField(allowDuplicate = false) {
  const detail = customer.value
  if (!detail || !editField.value) {
    return
  }

  const payload = buildUpdatePayload(detail, allowDuplicate)
  if (!payload) {
    return
  }

  const result = await updateMutation.mutate(payload)
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
          void saveEditedField(true)
        }
      },
    })
    return
  }

  invalidateQueries('crm/listCustomers')
  invalidateQueries('crm/getCustomer')
  await refetch()
  editField.value = null
  editValue.value = ''
  editGender.value = 'M'
  showToast('客户已保存')
}

function archiveCustomer() {
  if (!customerId.value || customer.value?.archivedAt) {
    return
  }

  wx.showModal({
    title: '归档客户',
    content: `确认归档「${customer.value?.name ?? ''}」？`,
    success: (result) => {
      if (result.confirm && customerId.value) {
        archiveMutation.mutate({ customerId: customerId.value })
      }
    },
  })
}

function formatTags(tags: string[]): string {
  return tags.length ? tags.join('，') : '-'
}

function formatLastFollowedAt(value: string | Date | null): string {
  return formatTime(value, '暂无跟进记录')
}
</script>

<template>
  <view class="min-h-screen bg-background pb-16 pt-3">
    <t-empty
      v-if="pageError && !customer"
      class="bg-card py-10"
      icon="error-circle"
      :description="pageError"
    />

    <template v-else-if="customer">
      <t-cell-group bordered>
        <t-cell
          title="称呼"
          :note="formatCustomerDisplayName(customer)"
          :arrow="!isArchived"
          @click="openEditField('name')"
        />
        <t-cell
          title="手机号"
          :note="customer.phone || '-'"
          :arrow="!isArchived"
          @click="openEditField('phone')"
        />
        <t-cell
          title="标签"
          :note="formatTags(customer.tags)"
          :arrow="!isArchived"
          @click="openEditField('tags')"
        />
        <t-cell
          title="备注"
          :note="customer.note || '-'"
          :arrow="!isArchived"
          @click="openEditField('note')"
        />
        <t-cell title="状态" :note="customer.archivedAt ? '已归档' : '正常'" />
      </t-cell-group>

      <t-cell-group class="mt-3" bordered>
        <t-cell
          title="画像信息"
          :note="profileRows.length ? `${profileRows.length} 项` : '暂无画像信息'"
          arrow
          @click="goProfile"
        />
      </t-cell-group>

      <t-cell-group class="mt-3" bordered>
        <t-cell
          title="跟进记录"
          :note="formatLastFollowedAt(customer.lastFollowedAt)"
          arrow
          @click="goFollowUp"
        />
      </t-cell-group>

      <t-cell-group class="mt-3" bordered>
        <t-cell
          v-if="!customer.archivedAt"
          arrow
          @click="archiveCustomer"
        >
          <template #title>
            <view class="text-destructive">
              归档客户
            </view>
          </template>
        </t-cell>
      </t-cell-group>
    </template>

    <HalfScreenPopup
      :visible="editPopupVisible"
      :title="editTitle"
      use-footer-slot
      :footer-border="false"
      @visible-change="handleEditPopupVisibleChange"
    >
      <view class="-mx-4">
        <t-cell-group bordered>
          <template v-if="editField === 'name'">
            <t-input
              :value="editValue"
              label="称呼"
              placeholder="必填"
              t-class-label="customer-detail-label"
              @change="handleEditValueChange"
            >
              <template #suffix>
                <view class="flex gap-2">
                  <view
                    class="pill"
                    :class="editGender === 'M' ? 'pill-selected' : 'pill-muted'"
                    @tap="selectEditGender('M')"
                  >
                    先生
                  </view>
                  <view
                    class="pill"
                    :class="editGender === 'F' ? 'pill-selected' : 'pill-muted'"
                    @tap="selectEditGender('F')"
                  >
                    女士
                  </view>
                </view>
              </template>
            </t-input>
          </template>
          <t-input
            v-else
            :value="editValue"
            :label="editTitle.replace('编辑', '')"
            :placeholder="editPlaceholder"
            @change="handleEditValueChange"
          />
        </t-cell-group>
      </view>

      <template #footer>
        <t-button theme="primary" block @click="saveEditedField()">
          保存
        </t-button>
      </template>
    </HalfScreenPopup>

    <t-toast id="t-toast" />
  </view>
</template>

<style lang="postcss">
.customer-detail-label {
  flex: 0 0 112rpx;
  width: 112rpx;
}
</style>
