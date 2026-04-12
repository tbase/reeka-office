<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'

import { computed } from 'wevu'
import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { useMutation } from '@/hooks/useMutation'

const props = defineProps<{
  visible: boolean
  item: RedeemItem | null
  memberPoints: number
}>()

const emit = defineEmits(['visible-change', 'redeemed'])

defineComponentJson({
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell': 'tdesign-miniprogram/cell/cell',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
  },
})

type RedeemItem = RpcOutput<'points/listRedeemItems'>[number]

const redeemLimitReached = computed(
  () =>
    props.item != null
    && props.item.redeemedCount >= props.item.maxRedeemPerAgent,
)

const pointsAfterRedeem = computed(() => {
  if (!props.item) {
    return props.memberPoints
  }

  return props.memberPoints - props.item.redeemPoints
})

const canRedeem = computed(
  () =>
    props.item != null
    && props.memberPoints >= props.item.redeemPoints
    && props.item.stock > 0
    && !redeemLimitReached.value,
)

function handleVisibleChange(event: {
  detail?: {
    visible?: boolean
  }
}) {
  emit('visible-change', event.detail?.visible ?? false)
}

const { mutate: submitRedeem, loading: redeeming } = useMutation(
  'points/submitRedeem',
  {
    showLoading: '兑换中...',
    onSuccess: (result) => {
      wx.showToast({
        title: result.message,
        icon: result.success ? 'success' : 'none',
      })

      if (!result.success) {
        return
      }

      emit('redeemed')
      emit('visible-change', false)
    },
    onError: (error) => {
      wx.showToast({
        title: error.message || '兑换失败',
        icon: 'none',
      })
    },
  },
)

async function handleRedeem() {
  if (!props.item || !canRedeem.value || redeeming.value) {
    return
  }

  await submitRedeem({
    itemId: props.item.id,
  })
}
</script>

<template>
  <HalfScreenPopup
    v-if="props.item"
    :visible="props.visible"
    :title="props.item.title"
    use-footer-slot
    @visible-change="handleVisibleChange"
  >
    <image
      v-if="props.item.imageUrl"
      class="h-36 w-full"
      mode="aspectFit"
      :src="props.item.imageUrl"
    />
    <view class="mt-2 space-y-1 text-sm text-muted-foreground">
      <view v-for="line in props.item.description.split('\n')" :key="line">
        {{ line }}
      </view>
    </view>

    <t-cell-group class="mt-4" bordered>
      <t-cell title="积分消耗" :note="`${props.item.redeemPoints}`" />
      <t-cell title="当前积分" :note="`${props.memberPoints}`" />
      <t-cell title="兑换后剩余" :note="`${pointsAfterRedeem}`" />
      <t-cell title="剩余库存" :note="`${props.item.stock}`" />
      <t-cell title="每人限兑" :note="`${props.item.maxRedeemPerAgent} 次`" />
      <t-cell title="已兑换次数" :note="`${props.item.redeemedCount} 次`" />
    </t-cell-group>

    <template #footer>
      <t-button
        theme="primary"
        block
        :disabled="!canRedeem || redeeming"
        @click="handleRedeem"
      >
        确认兑换
      </t-button>

      <view
        v-if="!canRedeem"
        class="mt-2 text-center text-xs text-muted-foreground"
      >
        积分不足、库存不足或已达限兑次数，暂不可兑换
      </view>
    </template>

    <t-toast id="t-toast" />
  </HalfScreenPopup>
</template>
