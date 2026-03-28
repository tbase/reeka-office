<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import { invalidateQueries } from "@/hooks/useQuery";
import type { RpcOutput } from "@/lib/rpc";
import { usePointSummaryStore, useRedeemItemsStore } from "@/stores/points";
import RedeemPopup from "./redeem-popup.vue";

definePageJson({
  navigationBarTitleText: "我的积分",
  backgroundColor: "#f6f7fb",
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

const openRedeemPopup = (item: RedeemItem) => {
  if (getRedeemDisabledReason(item)) {
    return;
  }

  selectedRedeemItemId.value = item.id;
  redeemPopupVisible.value = true;
};

const closeRedeemPopup = () => {
  redeemPopupVisible.value = false;
  selectedRedeemItemId.value = "";
};

const handlePopupVisibleChange = (visible: boolean) => {
  if (!visible) {
    closeRedeemPopup();
    return;
  }

  redeemPopupVisible.value = true;
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

const handleRedeemed = async () => {
  invalidateQueries("points/getMineSummary");
  invalidateQueries("points/listRedeemItems");
  await Promise.all([refetchSummary(), refetchRedeemItems()]);
};
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view class="rounded-xl bg-card p-4 shadow-lg">
      <view class="block text-sm text-muted-foreground">当前积分总额</view>
      <view class="mt-1 block text-center text-3xl font-bold">{{
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

    <view class="mt-4 rounded-xl bg-card p-4 shadow-lg">
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
          class="flex h-48 min-w-0 flex-col rounded-lg border border-border p-3"
        >
          <view class="flex flex-col items-center justify-center">
            <image
              v-if="item.imageUrl"
              class="h-20 w-20 rounded-md"
              :src="item.imageUrl"
            />
            <view
              v-else
              class="flex h-20 w-20 items-center justify-center rounded-md bg-muted"
            >
              <view class="text-xs text-muted-foreground">暂无商品图</view>
            </view>
            <view class="mt-2 block text-sm font-semibold">{{
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
      @visible-change="handlePopupVisibleChange"
      @redeemed="handleRedeemed"
    />
  </view>
</template>
