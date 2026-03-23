<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import { useMutation } from "@/hooks/useMutation";
import { invalidateQueries } from "@/hooks/useQuery";
import type { RpcOutput } from "@/lib/rpc";
import { usePointSummaryStore, useRedeemItemsStore } from "@/stores/points";
import RedeemPopup from "./redeem-popup.vue";

definePageJson({
  navigationBarTitleText: "我的积分",
  backgroundColor: "#f6f7fb",
  usingComponents: {
    "t-button": "tdesign-miniprogram/button/button",
    "t-empty": "tdesign-miniprogram/empty/empty",
    "t-grid": "tdesign-miniprogram/grid/grid",
    "t-grid-item": "tdesign-miniprogram/grid-item/grid-item",
  },
});

type RedeemItem = RpcOutput<"points/listRedeemItems">[number];

const { summary, refetch: refetchSummary } = usePointSummaryStore();
const { items, refetch: refetchRedeemItems } = useRedeemItemsStore();

const member = computed(
  () =>
    summary.value ?? {
      agentCode: "",
      currentPoints: 0,
    },
);

const redeemItems = computed<RedeemItem[]>(() => items.value ?? []);
const redeemPopupVisible = ref(false);
const selectedRedeemItemId = ref("");

let hasEntered = false;
onShow(() => {
  if (!hasEntered) {
    hasEntered = true;
    return;
  }

  void Promise.all([refetchSummary(), refetchRedeemItems()]);
});

const selectedRedeemItem = computed(
  () =>
    redeemItems.value.find((item) => item.id === selectedRedeemItemId.value) ??
    null,
);

const redeemLimitReached = computed(
  () =>
    selectedRedeemItem.value != null &&
    selectedRedeemItem.value.redeemedCount >=
      selectedRedeemItem.value.maxRedeemPerAgent,
);

const pointsAfterRedeem = computed(() => {
  if (!selectedRedeemItem.value) {
    return member.value.currentPoints;
  }

  return member.value.currentPoints - selectedRedeemItem.value.redeemPoints;
});

const canRedeemSelectedItem = computed(
  () =>
    selectedRedeemItem.value != null &&
    member.value.currentPoints >= selectedRedeemItem.value.redeemPoints &&
    selectedRedeemItem.value.stock > 0 &&
    !redeemLimitReached.value,
);

const openRedeemPopup = (item: RedeemItem) => {
  if (getRedeemDisabledReason(item)) {
    return;
  }

  selectedRedeemItemId.value = item.id;
  redeemPopupVisible.value = true;
};

const closeRedeemPopup = () => {
  redeemPopupVisible.value = false;
};

const handlePopupVisibleChange = (
  payload:
    | {
        detail?: {
          visible?: boolean;
        };
        visible?: boolean;
      }
    | boolean
    | undefined,
) => {
  if (typeof payload === "boolean") {
    redeemPopupVisible.value = payload;
    return;
  }

  if (typeof payload?.visible === "boolean") {
    redeemPopupVisible.value = payload.visible;
    return;
  }

  if (typeof payload?.detail?.visible === "boolean") {
    redeemPopupVisible.value = payload.detail.visible;
  }
};

const getRedeemDisabledReason = (item: RedeemItem): string | null => {
  if (item.stock <= 0) {
    return "库存不足";
  }

  if (item.redeemedCount >= item.maxRedeemPerAgent) {
    return "已达兑换上限";
  }

  return null;
};

const { mutate: submitRedeem, loading: redeeming } = useMutation(
  "points/submitRedeem",
  {
    showLoading: "兑换中...",
    onSuccess: async (result) => {
      wx.showToast({
        title: result.message,
        icon: result.success ? "success" : "none",
      });

      invalidateQueries("points/getMineSummary");
      invalidateQueries("points/listRedeemItems");
      await Promise.all([refetchSummary(), refetchRedeemItems()]);

      if (result.success) {
        closeRedeemPopup();
      }
    },
    onError: (error) => {
      wx.showToast({
        title: error.message || "兑换失败",
        icon: "none",
      });
    },
  },
);

const handleRedeem = async () => {
  if (
    !selectedRedeemItem.value ||
    !canRedeemSelectedItem.value ||
    redeeming.value
  ) {
    return;
  }

  await submitRedeem({
    itemId: selectedRedeemItem.value.id,
  });
};
</script>

<template>
  <view class="min-h-screen px-4 pb-16 pt-4">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <view class="block text-sm text-slate-500">当前积分总额</view>
      <view class="mt-1 block text-3xl font-bold text-slate-900">{{
        member.currentPoints
      }}</view>

      <t-grid class="mt-4" :column="2" theme="card">
        <t-grid-item
          text="积分明细"
          description="查看积分记录"
          url="/pages/mine/points-detail/index"
          jump-type="navigate-to"
        />
        <t-grid-item
          text="赚取积分"
          description="了解积分规则"
          url="/pages/mine/earn-points/index"
          jump-type="navigate-to"
        />
      </t-grid>
    </view>

    <view class="mt-4 rounded-xl bg-white p-4 shadow-lg">
      <view class="flex items-end justify-between">
        <view class="text-lg font-semibold">积分兑换专区</view>
      </view>

      <t-empty
        v-if="redeemItems.length === 0"
        class="mt-4"
        icon="view-list"
        description="暂无可兑换商品"
      />

      <view v-else class="mt-3 grid grid-cols-2 gap-3">
        <view
          v-for="item in redeemItems"
          :key="item.id"
          class="flex min-w-0 flex-col rounded-lg border border-slate-200 p-3 h-48"
        >
          <view class="flex flex-col items-center justify-center">
            <image
              v-if="item.imageUrl"
              class="h-20 w-20 rounded-md"
              :src="item.imageUrl"
            />
            <view
              v-else
              class="flex h-20 w-20 items-center justify-center rounded-md"
            >
              <view class="text-xs text-slate-400">暂无商品图</view>
            </view>
            <view class="mt-2 block font-semibold text-sm">{{
              item.title
            }}</view>
          </view>
          <view class="mt-auto flex">
            <t-button
              block
              :theme="getRedeemDisabledReason(item) ? 'default' : 'light'"
              variant="base"
              :disabled="Boolean(getRedeemDisabledReason(item))"
              @click="openRedeemPopup(item)"
            >
              <view class="space-y-1">
                <view class="text-xs leading-none"
                  >{{ item.redeemPoints }} 积分</view
                >
                <view class="text-sm leading-none">{{
                  getRedeemDisabledReason(item) ?? "去兑换"
                }}</view>
              </view>
            </t-button>
          </view>
        </view>
      </view>
    </view>
    <RedeemPopup
      :visible="redeemPopupVisible"
      :item="selectedRedeemItem"
      :member-points="member.currentPoints"
      :points-after-redeem="pointsAfterRedeem"
      :can-redeem="canRedeemSelectedItem"
      :redeeming="redeeming"
      @visible-change="handlePopupVisibleChange"
      @redeem="handleRedeem"
    />
  </view>
</template>
