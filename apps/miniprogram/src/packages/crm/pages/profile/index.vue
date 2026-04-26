<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'
import { useNavTitle } from '@/hooks/useNavTitle'
import { useCustomerDetailStore, useCustomerTypesStore } from '../../store'

definePageJson({
  navigationBarTitleText: '画像信息',
  backgroundColor: '#f6f7fb',
})

const customerId = ref<number | null>(null)
const { customer, error } = useCustomerDetailStore(customerId)
const { customerTypes, error: typesError } = useCustomerTypesStore()

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

  return error.value?.message ?? typesError.value?.message ?? null
})
const currentType = computed(() => {
  const detail = customer.value
  if (!detail) {
    return null
  }

  return (customerTypes.value ?? []).find(type => type.id === detail.customerTypeId) ?? null
})
const profileRows = computed(() => {
  const detail = customer.value
  if (!detail) {
    return []
  }

  const fields = currentType.value?.profileFields ?? []
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
</script>

<template>
  <view class="flex min-h-screen flex-col bg-background pb-10 pt-4">
    <t-empty
      v-if="pageError && (!customer || !customerTypes)"
      class="bg-card py-10"
      icon="error-circle"
      :description="pageError"
    />

    <template v-else-if="customer">
      <t-empty
        v-if="profileRows.length === 0"
        class="bg-card py-10"
        icon="view-list"
        description="暂无画像字段"
      />

      <view v-else>
        <view
          v-for="row in profileRows"
          :key="row.fieldId"
          class="pb-4"
        >
          <view class="px-4 pb-1 text-xs text-muted-foreground">
            {{ row.name }}
          </view>
          <view class="bg-card px-4 py-3 text-sm leading-6 text-foreground">
            {{ row.value || '未填写' }}
          </view>
        </view>
      </view>
    </template>

    <view v-if="customer" class="mt-auto px-4 pt-6 text-center text-xs leading-5 text-muted-foreground opacity-70">
      由 AI 根据跟进记录生成
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
