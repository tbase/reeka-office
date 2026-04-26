<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'
import { computed } from 'wevu'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import { useQuery } from '@/hooks/useQuery'

definePageJson({
  navigationBarTitleText: '客户',
  backgroundColor: '#f6f7fb',
})

type CustomerTypes = RpcOutput<'crm/listCustomerTypes'>

const {
  data: customerTypes,
  loading: isLoading,
  error,
  refetch,
} = useQuery({
  queryKey: ['crm/listCustomerTypes', undefined],
  showLoading: '加载客户类型中...',
  refetchOnShow: true,
})

const rows = computed<CustomerTypes>(() => customerTypes.value ?? [])
const pageError = computed(() => error.value?.message ?? null)

usePullDownRefresh(async () => {
  await refetch()
})

function goCustomerType(customerTypeId: number) {
  wx.navigateTo({
    url: `/packages/crm/pages/index/index?customerTypeId=${customerTypeId}`,
  })
}
</script>

<template>
  <view class="min-h-screen bg-background pb-10 pt-4">
    <t-empty
      v-if="pageError && !customerTypes"
      class="mx-4 rounded-xl bg-card py-10 shadow-md"
      icon="error-circle"
      :description="pageError"
    />

    <t-empty
      v-else-if="rows.length === 0 && !isLoading"
      class="mx-4 rounded-xl bg-card py-10 shadow-md"
      icon="view-list"
      description="暂无客户类型"
    />

    <t-cell-group v-else bordered class="bg-white">
      <t-cell
        v-for="type in rows"
        :key="type.id"
        :title="type.name"
        left-icon="usergroup"
        arrow
        @click="goCustomerType(type.id)"
      />
    </t-cell-group>

    <t-toast id="t-toast" />
  </view>
</template>
