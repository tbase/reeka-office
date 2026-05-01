<script setup lang="ts">
import type { CustomerDetail } from '../../store'
import type { RpcInput } from '@/lib/rpc'
import { computed, onLoad, ref } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useMutation } from '@/hooks/useMutation'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { useCustomerDetailStore, useCustomerTypeConfigStore } from '../../store'

interface ProfileRow {
  fieldId: number
  name: string
  value: string
}

type EditTarget =
  | { kind: 'profile', fieldId: number, name: string }
  | { kind: 'note' }

definePageJson({
  navigationBarTitleText: '画像信息',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-textarea': 'tdesign-miniprogram/textarea/textarea',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

const customerId = ref<number | null>(null)
const editPopupVisible = ref(false)
const editTarget = ref<EditTarget | null>(null)
const editValue = ref('')
const { customer, error, refetch } = useCustomerDetailStore(customerId)
const customerTypeId = computed(() => customer.value?.customerTypeId ?? null)
const { customerType, error: typeError } = useCustomerTypeConfigStore(customerTypeId)
const { showToast } = useToast()
const updateMutation = useMutation('crm/updateCustomer', {
  showLoading: '保存中...',
  onError: err => showToast(err.message || '保存失败', 'error'),
})

useNavTitle(() => {
  const name = customer.value?.name.trim()
  return name ? `${name} - 画像信息` : '画像信息'
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
const profileRows = computed<ProfileRow[]>(() => {
  const detail = customer.value
  if (!detail) {
    return []
  }

  const fields = customerType.value?.profileFields ?? []
  if (fields.length === 0) {
    return detail.currentProfileValues.map(row => ({
      fieldId: row.fieldId,
      name: row.fieldName || '画像字段',
      value: row.value,
    }))
  }

  const valuesByFieldId = new Map(
    detail.allProfileValues
      .filter(row => row.customerTypeId === detail.customerTypeId)
      .map(row => [row.fieldId, row.value]),
  )

  return fields.map(field => ({
    fieldId: field.id,
    name: field.name,
    value: valuesByFieldId.get(field.id)?.trim() ?? '',
  }))
})
const editPopupTitle = computed(() => {
  if (editTarget.value?.kind === 'profile') {
    return `编辑${editTarget.value.name}`
  }

  return '编辑备注'
})
const editPlaceholder = computed(() => {
  if (editTarget.value?.kind === 'profile') {
    return `填写${editTarget.value.name}`
  }

  return '补充客户画像备注'
})

function openNoteEditor() {
  if (!customer.value) {
    return
  }

  editTarget.value = { kind: 'note' }
  editValue.value = customer.value.note ?? ''
  editPopupVisible.value = true
}

function openProfileEditor(row: ProfileRow) {
  if (!customer.value) {
    return
  }

  editTarget.value = {
    kind: 'profile',
    fieldId: row.fieldId,
    name: row.name,
  }
  editValue.value = row.value
  editPopupVisible.value = true
}

function handleEditPopupVisibleChange(payload: { visible?: boolean }) {
  editPopupVisible.value = payload.visible ?? false
}

function handleEditValueChange(event: { value?: string }) {
  editValue.value = event.value ?? ''
}

function buildProfileValues(detail: CustomerDetail): RpcInput<'crm/updateCustomer'>['profileValues'] {
  const valuesByFieldId = new Map(
    detail.allProfileValues
      .filter(item => item.customerTypeId === detail.customerTypeId)
      .map(item => [item.fieldId, item.value]),
  )

  const target = editTarget.value
  if (target?.kind === 'profile') {
    valuesByFieldId.set(target.fieldId, editValue.value.trim())
  }

  return profileRows.value.map(row => ({
    fieldId: row.fieldId,
    value: valuesByFieldId.get(row.fieldId) ?? '',
  }))
}

function buildProfileValuesFromDetail(detail: CustomerDetail) {
  return detail.allProfileValues
    .filter(item => item.customerTypeId === detail.customerTypeId)
    .map(item => ({
      fieldId: item.fieldId,
      value: item.value,
    }))
}

async function saveEditedContent() {
  const detail = customer.value
  const target = editTarget.value
  if (!detail || !target) {
    return
  }

  const result = await updateMutation.mutate({
    customerId: detail.id,
    customerTypeId: detail.customerTypeId,
    name: detail.name,
    gender: detail.gender,
    birthday: detail.birthday,
    city: detail.city,
    phone: detail.phone,
    wechat: detail.wechat,
    tags: detail.tags,
    note: target.kind === 'note' ? editValue.value.trim() || null : detail.note,
    profileValues: target.kind === 'profile' ? buildProfileValues(detail) : buildProfileValuesFromDetail(detail),
    allowDuplicate: true,
  } satisfies RpcInput<'crm/updateCustomer'>)
  if (!result) {
    return
  }

  invalidateQueries('crm/getCustomer')
  await refetch()
  editPopupVisible.value = false
  showToast(target.kind === 'profile' ? '画像已保存' : '备注已保存')
}
</script>

<template>
  <view class="flex min-h-screen flex-col bg-background pb-10 pt-4">
    <t-empty
      v-if="pageError && (!customer || !customerType)"
      class="bg-card py-10"
      icon="error-circle"
      :description="pageError"
    />

    <template v-else-if="customer">
      <view>
        <view
          v-for="row in profileRows"
          :key="row.fieldId"
          class="pb-4"
        >
          <view class="px-4 pb-1 text-xs text-muted-foreground">
            {{ row.name }}
          </view>
          <view
            class="bg-card px-4 py-3 text-sm leading-6 text-foreground"
            hover-class="bg-muted"
            @tap="openProfileEditor(row)"
          >
            {{ row.value || '未填写' }}
          </view>
        </view>

        <view class="pb-4">
          <view class="px-4 pb-1 text-xs text-muted-foreground">
            备注
          </view>
          <view
            class="bg-card px-4 py-3 text-sm leading-6 text-foreground"
            hover-class="bg-muted"
            @tap="openNoteEditor"
          >
            {{ customer.note || '未填写' }}
          </view>
        </view>
      </view>
    </template>

    <view v-if="customer" class="mt-auto px-4 pt-6 text-center text-xs leading-5 text-muted-foreground opacity-70">
      由 AI 根据跟进记录生成
    </view>

    <HalfScreenPopup
      :visible="editPopupVisible"
      :title="editPopupTitle"
      use-footer-slot
      :footer-border="false"
      @visible-change="handleEditPopupVisibleChange"
    >
      <view class="-mx-4">
        <t-textarea
          :value="editValue"
          :placeholder="editPlaceholder"
          :autosize="{ minHeight: 180, maxHeight: 320 }"
          :maxlength="500"
          @change="handleEditValueChange"
        />
      </view>

      <template #footer>
        <t-button theme="primary" block @click="saveEditedContent">
          保存
        </t-button>
      </template>
    </HalfScreenPopup>

    <t-toast id="t-toast" />
  </view>
</template>
