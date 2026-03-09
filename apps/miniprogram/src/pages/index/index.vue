<script setup lang="ts">
definePageJson({
  navigationBarTitleText: '首页',
  backgroundColor: '#f6f7fb',
})

const goNewbieHome = () => {
  wx.navigateTo({
    url: '/packages/newbie/index/index',
  })
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-12 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="text-xl font-semibold text-slate-900">
        首页
      </text>
      <text class="mt-2 block text-sm text-slate-500">
        快捷进入常用业务页面。
      </text>
    </view>

    <view
      class="mt-4 rounded-xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-4 text-white shadow-lg shadow-rose-200/70"
      @tap="goNewbieHome"
    >
      <text class="rounded-full bg-white/20 px-3 py-1 text-xs tracking-[0.25em]">
        NEWBIE
      </text>
      <text class="mt-4 block text-xl font-semibold">
        新手任务
      </text>
      <text class="mt-2 block text-sm leading-6 text-white/90">
        查看阶段任务与积分说明，按步骤完成新手成长动作。
      </text>
      <text class="mt-4 block text-sm font-medium text-white">
        立即查看
      </text>
    </view>
  </view>
</template>
