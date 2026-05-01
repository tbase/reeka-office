<script setup lang="ts">
import type { CustomerDetail } from '../../store'
import type { CustomerGender } from '../../utils/customer'
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatTime } from '@/lib/time'
import FollowUpEditor from '../../components/follow-up-editor.vue'
import { useCustomerDetailStore, useCustomerTypeConfigStore } from '../../store'
import { formatCustomerDisplayName } from '../../utils/customer'

definePageJson({
  navigationBarTitleText: '客户详情',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell': 'tdesign-miniprogram/cell/cell',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-icon': 'tdesign-miniprogram/icon/icon',
    't-input': 'tdesign-miniprogram/input/input',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

type EditableField = 'name' | 'birthday' | 'city' | 'phone' | 'tags'

const customerId = ref<number | null>(null)
const editField = ref<EditableField | null>(null)
const editPopupVisible = ref(false)
const editValue = ref('')
const editGender = ref<CustomerGender>('M')
const selectedTags = ref<string[]>([])
const followUpPopupVisible = ref(false)
const today = formatDate(new Date())

const { customer, error, refetch } = useCustomerDetailStore(customerId)
const customerTypeId = computed(() => customer.value?.customerTypeId ?? null)
const { customerType, error: typeError } = useCustomerTypeConfigStore(customerTypeId)
const { showToast } = useToast()
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

  return error.value?.message ?? typeError.value?.message ?? null
})

const profileRows = computed(() => customer.value?.currentProfileValues ?? [])
const profileSummary = computed(() => {
  const count = profileRows.value.length
  if (count > 0) {
    return `${count} 项`
  }

  return customer.value?.note ? '含备注' : '暂无画像信息'
})
const editFieldLabel = computed(() => {
  if (editField.value === 'name') {
    return '称呼'
  }
  if (editField.value === 'phone') {
    return '手机号'
  }
  if (editField.value === 'birthday') {
    return '生日'
  }
  if (editField.value === 'city') {
    return '城市'
  }
  if (editField.value === 'tags') {
    return '标签'
  }
  return ''
})
const editPopupTitle = computed(() => editFieldLabel.value ? `编辑${editFieldLabel.value}` : '')
const editPlaceholder = computed(() => {
  if (editField.value === 'name') {
    return '必填'
  }
  if (editField.value === 'tags') {
    return '用逗号或空格分隔'
  }
  return '选填'
})
const enabledTagNames = computed(() => customerType.value?.tags.map(tag => tag.name) ?? [])
const legacyTags = computed(() => {
  if (editField.value !== 'tags' || !customer.value) {
    return []
  }

  const enabled = new Set(enabledTagNames.value)
  return customer.value.tags.filter(tag => !enabled.has(tag))
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

function openFollowUpPopup() {
  if (!customer.value) {
    return
  }

  followUpPopupVisible.value = true
}

function handleFollowUpPopupVisibleChange(payload: { visible?: boolean }) {
  followUpPopupVisible.value = payload.visible ?? false
}

async function handleFollowUpSuccess() {
  invalidateQueries('crm/listCustomers')
  invalidateQueries('crm/getCustomer')
  await refetch()
  followUpPopupVisible.value = false
  goFollowUp()
}

function openEditField(field: EditableField) {
  if (!customer.value) {
    return
  }

  editField.value = field
  editPopupVisible.value = true
  if (field === 'name') {
    editValue.value = customer.value.name
    editGender.value = customer.value.gender ?? 'M'
    return
  }

  if (field === 'tags') {
    const enabled = new Set(enabledTagNames.value)
    selectedTags.value = customer.value.tags.filter(tag => enabled.has(tag))
    return
  }

  editValue.value = customer.value[field] ?? ''
}

function handleEditPopupVisibleChange(payload: { visible?: boolean }) {
  if (!payload.visible) {
    editPopupVisible.value = false
  }
}

function handleEditValueChange(event: { value?: string }) {
  editValue.value = event.value ?? ''
}

function selectEditGender(value: CustomerGender) {
  editGender.value = value
}

function toggleSelectedTag(tagName: string) {
  selectedTags.value = selectedTags.value.includes(tagName)
    ? selectedTags.value.filter(item => item !== tagName)
    : [...selectedTags.value, tagName]
}

function handleEditBirthdayChange(event: { detail?: { value?: string }, target?: { value?: string } }) {
  editValue.value = event.detail?.value ?? event.target?.value ?? ''
}

function clearEditBirthday() {
  editValue.value = ''
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
    birthday: field === 'birthday' ? editValue.value || null : detail.birthday,
    city: field === 'city' ? editValue.value.trim() || null : detail.city,
    phone: field === 'phone' ? editValue.value.trim() || null : detail.phone,
    wechat: detail.wechat,
    tags: field === 'tags' ? [...legacyTags.value, ...selectedTags.value] : detail.tags,
    note: detail.note,
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
  editPopupVisible.value = false
  showToast('客户已保存')
}

function formatTags(tags: string[]): string {
  return tags.length ? tags.join('，') : '-'
}

function formatBirthday(value: string | null): string {
  return value || '-'
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
          arrow
          @click="openEditField('name')"
        />
        <t-cell
          title="生日"
          :note="formatBirthday(customer.birthday)"
          arrow
          @click="openEditField('birthday')"
        />
        <t-cell
          title="城市"
          :note="customer.city || '-'"
          arrow
          @click="openEditField('city')"
        />
        <t-cell
          title="手机号"
          :note="customer.phone || '-'"
          arrow
          @click="openEditField('phone')"
        />
        <t-cell
          title="标签"
          :note="formatTags(customer.tags)"
          arrow
          @click="openEditField('tags')"
        />
      </t-cell-group>

      <t-cell-group class="mt-3" bordered>
        <t-cell
          title="画像信息"
          :note="profileSummary"
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

      <view class="fixed bottom-8 right-4 z-10">
        <t-button theme="primary" shape="circle" size="large" @click="openFollowUpPopup">
          <t-icon name="add" size="44rpx" />
        </t-button>
      </view>
    </template>

    <FollowUpEditor
      :visible="followUpPopupVisible"
      :customer-id="customerId"
      @visible-change="handleFollowUpPopupVisibleChange"
      @success="handleFollowUpSuccess"
    />

    <HalfScreenPopup
      :visible="editPopupVisible"
      :title="editPopupTitle"
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
          <picker
            v-else-if="editField === 'birthday'"
            mode="date"
            :value="editValue"
            :end="today"
            @change="handleEditBirthdayChange"
          >
            <view class="flex min-h-12 items-center justify-between px-4">
              <text class="customer-detail-label text-foreground">
                生日
              </text>
              <view class="flex min-w-0 flex-1 items-center justify-end gap-3">
                <text :class="editValue ? 'text-foreground' : 'text-muted-foreground'">
                  {{ editValue || '选择生日' }}
                </text>
                <text
                  v-if="editValue"
                  class="shrink-0 text-muted-foreground"
                  @tap.stop="clearEditBirthday"
                >
                  清空
                </text>
              </view>
            </view>
          </picker>
          <view
            v-else-if="editField === 'tags'"
            class="px-4 py-4"
          >
            <view
              v-if="customerType?.tags.length"
              class="flex flex-wrap gap-2"
            >
              <view
                v-for="tag in customerType.tags"
                :key="tag.id"
                class="pill"
                :class="selectedTags.includes(tag.name) ? 'pill-selected' : 'pill-surface'"
                @tap="toggleSelectedTag(tag.name)"
              >
                {{ tag.name }}
              </view>
            </view>
            <view
              v-else
              class="text-sm text-muted-foreground"
            >
              暂无可选标签
            </view>
            <view
              v-if="legacyTags.length > 0"
              class="mt-4 flex flex-wrap gap-2"
            >
              <view
                v-for="tag in legacyTags"
                :key="tag"
                class="pill pill-muted"
              >
                {{ tag }}
              </view>
            </view>
          </view>
          <t-input
            v-else
            :value="editValue"
            :label="editFieldLabel"
            :placeholder="editPlaceholder"
            t-class-label="customer-detail-label"
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
