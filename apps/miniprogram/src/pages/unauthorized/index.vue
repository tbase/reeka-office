<script setup lang="ts">
import { onShow, ref } from "wevu";

import { invalidateQueries } from "@/hooks/useQuery";
import { useToast } from "@/hooks/useToast";
import {
  bindByToken,
  refreshTenantCatalog,
  switchTenant,
} from "@/lib/center-api";
import { getActiveTenantCode, type TenantSummary } from "@/lib/tenant-session";

definePageJson({
  navigationBarTitleText: "身份绑定",
  navigationBarBackgroundColor: "#ff2056",
  navigationBarTextStyle: "white",
  usingComponents: {
    "t-cell": "tdesign-miniprogram/cell/cell",
    "t-cell-group": "tdesign-miniprogram/cell-group/cell-group",
    "t-input": "tdesign-miniprogram/input/input",
    "t-button": "tdesign-miniprogram/button/button",
    "t-icon": "tdesign-miniprogram/icon/icon",
    "t-radio-group": "tdesign-miniprogram/radio-group/radio-group",
    "t-radio": "tdesign-miniprogram/radio/radio",
    "t-toast": "tdesign-miniprogram/toast/toast",
  },
});

const { showToast } = useToast();
const token = ref("");
const loading = ref(false);
const tenants = ref<TenantSummary[]>([]);
const selectedTenantCode = ref("");

const reloadTenants = async (showError = false) => {
  try {
    const result = await refreshTenantCatalog();
    tenants.value = result.tenants;
    console.log(result.tenants);
    selectedTenantCode.value =
      getActiveTenantCode() ??
      result.activeTenant?.tenantCode ??
      result.tenants[0]?.tenantCode ??
      "";
  } catch (error) {
    if (showError) {
      showToast(
        error instanceof Error ? error.message : "租户加载失败",
        "error",
      );
    }
  }
};

const handleBind = async () => {
  const nextToken = token.value.trim().toUpperCase();
  if (!nextToken) {
    showToast("请输入绑定码", "warning");
    return;
  }

  loading.value = true;

  try {
    const result = await bindByToken(nextToken);
    tenants.value = result.tenants;
    selectedTenantCode.value = result.tenantCode;
    token.value = "";
    invalidateQueries();
    showToast("绑定成功");
    setTimeout(() => {
      wx.reLaunch({ url: "/pages/index/index" });
    }, 400);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "绑定失败", "error");
  } finally {
    loading.value = false;
  }
};

const handleTokenChange = (
  event: WechatMiniprogram.CustomEvent<{ value?: string }>,
) => {
  token.value = event.detail.value ?? "";
};

const handleUseTenant = () => {
  if (!selectedTenantCode.value) {
    showToast("请选择租户", "warning");
    return;
  }

  const tenant = switchTenant(selectedTenantCode.value);
  if (!tenant) {
    showToast("租户已失效，请刷新后重试", "error");
    return;
  }

  invalidateQueries();
  showToast(`已切换到${tenant.tenantName}`);
  setTimeout(() => {
    wx.reLaunch({ url: "/pages/index/index" });
  }, 300);
};

const handleTenantChange = (
  event: WechatMiniprogram.CustomEvent<{ value?: string }>,
) => {
  selectedTenantCode.value = event.detail.value ?? "";
};

onShow(() => {
  void reloadTenants();
});
</script>

<template>
  <view
    class="flex min-h-screen flex-col items-center justify-center bg-white px-4"
  >
    <view class="w-full max-w-sm">
      <view class="mb-8 text-center">
        <view class="block text-2xl font-semibold text-slate-900">
          身份绑定
        </view>
        <view class="mt-2 block text-sm text-slate-500">
          请输入绑定码，或直接选择已绑定的租户
        </view>
      </view>

      <t-cell-group theme="card" bordered>
        <t-input
          :value="token"
          @change="handleTokenChange"
          placeholder="请输入管理员提供的绑定码"
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
        绑定租户
      </t-button>

      <view v-if="tenants.length" class="mt-8 w-full">
        <view class="mb-3 flex items-center justify-between">
          <view class="text-sm font-medium text-slate-700">已绑定租户</view>
          <view
            class="flex items-center gap-1 text-xs text-slate-500"
            @tap="reloadTenants(true)"
          >
            <t-icon name="refresh" size="28rpx" />
            <view>刷新</view>
          </view>
        </view>

        <t-radio-group :value="selectedTenantCode" @change="handleTenantChange">
          <t-cell-group theme="card" bordered>
            <t-cell
              v-for="tenant in tenants"
              :key="tenant.tenantCode"
              :title="tenant.tenantName"
              :description="tenant.tenantCode"
              @click="selectedTenantCode = tenant.tenantCode"
            >
              <t-radio slot="note" :value="tenant.tenantCode" />
            </t-cell>
          </t-cell-group>
        </t-radio-group>

        <t-button
          class="mt-4"
          theme="default"
          size="large"
          block
          @click="handleUseTenant"
        >
          进入所选租户
        </t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
