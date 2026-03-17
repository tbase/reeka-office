<script setup lang="ts">
import { computed, onShow } from "wevu";

import type { RpcOutput } from "@/lib/rpc";
import { usePointSummaryStore, useRedeemItemsStore } from "@/stores/points";

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

const canRedeemCount = computed(
  () =>
    redeemItems.value.filter(
      (item: RedeemItem) =>
        member.value.currentPoints >= item.redeemPoints &&
        item.stock > 0 &&
        item.redeemedCount < item.maxRedeemPerAgent,
    ).length,
);

let hasEntered = false;
onShow(() => {
  if (!hasEntered) {
    hasEntered = true;
    return;
  }

  void Promise.all([refetchSummary(), refetchRedeemItems()]);
});

const goPointDetail = () => {
  wx.navigateTo({
    url: "/pages/mine/points-detail/index",
  });
};

const goEarnPoints = () => {
  wx.navigateTo({
    url: "/pages/mine/earn-points/index",
  });
};

const goRedeemDetail = (id: string) => {
  wx.setStorageSync("mine_redeem_item_id", id);
  wx.navigateTo({
    url: "/pages/mine/redeem-detail/index",
  });
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
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="block text-sm text-slate-500">{{ member.agentCode }}</text>
      <text class="mt-1 block text-3xl font-bold text-slate-900">{{
        member.currentPoints
      }}</text>
      <text class="text-sm text-slate-500">当前积分总额</text>

      <view class="mt-4 grid grid-cols-2 gap-3">
        <view class="rounded-lg bg-slate-50 px-3 py-3" @tap="goPointDetail">
          <text class="block text-sm text-slate-500">查看积分明细</text>
        </view>
        <view class="rounded-lg bg-slate-50 px-3 py-3" @tap="goEarnPoints">
          <text class="block text-sm text-slate-500">如何赚取积分？</text>
        </view>
      </view>
    </view>

    <view class="mt-4 rounded-xl bg-white p-4 shadow-lg">
      <view class="flex items-end justify-between">
        <text class="text-lg font-semibold text-slate-900">积分兑换专区</text>
        <text class="text-xs text-slate-400"
          >可兑换 {{ canRedeemCount }} 项</text
        >
      </view>

      <view class="mt-3 grid grid-cols-2 gap-3">
        <view
          v-for="item in redeemItems"
          :key="item.id"
          class="flex h-full flex-col rounded-lg border border-slate-100 p-3"
          @tap="goRedeemDetail(item.id)"
        >
          <image
            v-if="item.imageUrl"
            class="h-24 w-full rounded-md bg-slate-100"
            mode="aspectFill"
            :src="item.imageUrl"
          />
          <view
            v-else
            class="flex h-24 w-full items-center justify-center rounded-md bg-slate-100"
          >
            <text class="text-xs text-slate-400">暂无商品图</text>
          </view>
          <text class="mt-2 block text-base font-semibold text-slate-900">{{
            item.title
          }}</text>
          <view class="mt-2 flex items-center justify-between">
            <text class="text-sm text-rose-500"
              >{{ item.redeemPoints }} 积分</text
            >
            <text class="text-xs text-slate-400">库存 {{ item.stock }}</text>
          </view>
          <text class="mt-1 block text-xs text-slate-400"
            >每人限兑 {{ item.maxRedeemPerAgent }} 次</text
          >
          <text class="mt-1 block text-xs text-slate-400"
            >你已兑换 {{ item.redeemedCount }} 次</text
          >
          <view class="mt-auto pt-3">
            <text
              class="block rounded-md py-2 text-center text-sm font-medium"
              :class="
                getRedeemDisabledReason(item)
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-rose-50 text-rose-500'
              "
            >
              {{ getRedeemDisabledReason(item) ?? "去兑换" }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
