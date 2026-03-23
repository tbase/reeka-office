<script setup lang="ts">
defineComponentJson({
  usingComponents: {
    "t-popup": "tdesign-miniprogram/popup/popup",
  },
});

const props = withDefaults(
  defineProps<{
    visible: boolean;
    title: string;
    maxHeight?: string;
    maxContentHeight?: string;
    closeBtn?: boolean;
    useFooterSlot?: boolean;
  }>(),
  {
    maxHeight: "85vh",
    maxContentHeight: "60vh",
    closeBtn: true,
    useFooterSlot: false,
  },
);

const emit = defineEmits(["visible-change"]);
const slots = defineSlots<{
  default?: () => unknown;
  footer?: () => unknown;
}>();

const handleVisibleChange = (event: {
  detail?: {
    visible?: boolean;
  };
}) => {
  emit("visible-change", {
    visible: event.detail?.visible ?? false,
  });
};
</script>

<template>
  <t-popup
    :visible="props.visible"
    placement="bottom"
    :close-btn="props.closeBtn"
    @visible-change="handleVisibleChange"
  >
    <view
      class="flex flex-col rounded-t-2xl bg-white pt-4"
      :style="`max-height: ${props.maxHeight}`"
    >
      <view class="shrink-0 px-4">
        <view class="flex items-center justify-center">
          <view class="text-base font-semibold">{{ props.title }}</view>
        </view>
      </view>

      <view
        class="mt-3 flex-1 overflow-y-auto px-4"
        :style="`min-height: 0; max-height: ${props.maxContentHeight}`"
      >
        <slot />
      </view>

      <view
        v-if="props.useFooterSlot"
        class="mt-4 shrink-0 border-t border-slate-100 bg-white px-4 pb-4 pt-3"
      >
        <slot name="footer" />
      </view>
    </view>
  </t-popup>
</template>
