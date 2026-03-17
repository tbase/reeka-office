<script setup lang="ts">
import { ref } from "wevu";

import { useFormBinder } from "@/hooks/useFormBinder";
import { useMutation } from "@/hooks/useMutation";
import { useToast } from "@/hooks/useToast";

definePageJson({
  navigationBarTitleText: "代理人验证",
  navigationBarBackgroundColor: "#ff2056",
  navigationBarTextStyle: "white",
  usingComponents: {
    "t-cell-group": "tdesign-miniprogram/cell-group/cell-group",
    "t-input": "tdesign-miniprogram/input/input",
    "t-button": "tdesign-miniprogram/button/button",
    "t-toast": "tdesign-miniprogram/toast/toast",
  },
});

const { changeModel } = useFormBinder();
const { showToast } = useToast();
const code = ref("");
const leaderCode = ref("");
const unit = ref("");
// biome-ignore lint/correctness/noUnusedVariables: used in template bindings
const codeModel = changeModel<string>("code");
// biome-ignore lint/correctness/noUnusedVariables: used in template bindings
const leaderCodeModel = changeModel<string>("leaderCode");
// biome-ignore lint/correctness/noUnusedVariables: used in template bindings
const unitModel = changeModel<string>("unit");

// biome-ignore lint/correctness/noUnusedVariables: used in template bindings
const { mutate, loading } = useMutation("user/bindAgent", {
  onSuccess: () => {
    showToast("绑定成功");
    setTimeout(() => {
      wx.reLaunch({ url: "/pages/index/index" });
    }, 500);
  },
  onError: (error) => {
    showToast(error.message || "绑定失败");
  },
});

// biome-ignore lint/correctness/noUnusedVariables: used in template bindings
const handleBind = async () => {
  const nextCode = code.value.trim();
  const nextLeaderCode = leaderCode.value.trim();
  const nextUnit = unit.value.trim();

  if (!nextCode) {
    showToast("请输入代理人 code");
    return;
  }

  if (!nextLeaderCode) {
    showToast("请输入直属上级 code");
    return;
  }

  if (!nextUnit) {
    showToast("请输入 unit");
    return;
  }

  try {
    await mutate({
      code: nextCode,
      leaderCode: nextLeaderCode,
      unit: nextUnit,
    });
  } catch {
    showToast("网络错误，请稍后重试");
  }
};
</script>

<template>
  <view
    class="flex min-h-screen flex-col items-center justify-center bg-white px-4"
  >
    <view class="w-full max-w-sm">
      <view class="text-center mb-8">
        <text class="block text-2xl font-semibold text-slate-900"
          >代理人验证</text
        >
        <text class="mt-2 block text-sm text-slate-500"
          >请填写代理人信息完成绑定</text
        >
      </view>

      <t-cell-group theme="card" bordered>
        <t-input
          :value="codeModel.value"
          @change="codeModel.onChange"
          placeholder="请输入您的代理人 code"
          clearable
          :disabled="loading"
        />

        <t-input
          :value="leaderCodeModel.value"
          @change="leaderCodeModel.onChange"
          placeholder="请输入直属上级 code"
          clearable
          :disabled="loading"
        />

        <t-input
          :value="unitModel.value"
          @change="unitModel.onChange"
          placeholder="请输入您的 unit"
          clearable
          :disabled="loading"
        />
      </t-cell-group>

      <t-button
        class="mt-6"
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
