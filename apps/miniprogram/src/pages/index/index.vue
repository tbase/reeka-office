<script setup lang="ts">
import { useQuery } from '@/hooks/useQuery'
import { watchEffect } from 'wevu'

definePageJson({
  navigationBarTitleText: '首页',
  backgroundColor: '#f6f7fb',
})

const { data } = useQuery({
  queryKey: ['cms/listServiceCategories', undefined],
})
watchEffect(() => {
  console.log(data.value)
})
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-12 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="text-xl font-semibold text-slate-900">
        首页占位
      </text>
      <text class="mt-2 block text-sm text-slate-500">
        该页面为占位内容，后续可在此接入首页看板、公告与快捷入口
      </text>
    </view>
  </view>
</template>
