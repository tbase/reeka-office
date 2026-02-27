<script setup lang="ts">
import { useFormBinder } from "@/hooks/useFormBinder"
import { useMutation } from "@/hooks/useMutation"
import { useToast } from "@/hooks/useToast"
import { ref } from "wevu"

definePageJson({
  navigationBarTitleText: '代理人验证',
  navigationBarBackgroundColor: '#ff2056',
  navigationBarTextStyle: 'white',
  usingComponents: {
    "t-input": "tdesign-miniprogram/input/input",
    "t-button": "tdesign-miniprogram/button/button",
    "t-toast": "tdesign-miniprogram/toast/toast"
  }
})

const { changeModel } = useFormBinder()
const { showToast } = useToast()
const token = ref("")
const tokenModel = changeModel<string>("token")


const { mutate, loading } = useMutation("user/bindAgent", {
  onSuccess: () => {
    showToast("绑定成功")
    setTimeout(() => {
      wx.reLaunch({ url: "/pages/index/index" })
    }, 500)
  },
  onError: (error) => {
    showToast(error.message || "绑定失败")
  }
})


const handleBind = async () => {
  const value = token.value.trim()
  if (!value) {
    showToast("请输入 token")
    return
  }
  try {
    await mutate({ token: value })
  } catch {
    showToast("网络错误，请稍后重试")
  }
}
</script>

<template>
  <view class="flex min-h-screen flex-col items-center justify-center bg-white px-8">
    <view class="w-full max-w-sm">
      <view class="text-center mb-8">
        <text class="block text-2xl font-semibold text-slate-900">代理人验证</text>
      </view>
      
      <view class="mb-6">
        <t-input
          :value="tokenModel.value"
          @change="tokenModel.onChange"
          placeholder="请输入您的代理人 token"
          :disabled="loading"
        />
      </view>
      
      <t-button
        theme="primary"
        size="large"
        block
        :loading="loading"
        :disabled="loading"
        @click="handleBind"
      >
        验证并绑定
      </t-button>
    </view>
    
    <t-toast id="t-toast" />
  </view>
</template>
