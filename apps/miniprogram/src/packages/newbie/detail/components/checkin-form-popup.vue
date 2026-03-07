<script setup lang="ts">
import type { UploadFile } from "tdesign-miniprogram/upload/type";

import { ref, watch } from "wevu";

import { useToast } from "@/hooks/useToast";

defineComponentJson({
  component: true,
  usingComponents: {
    "t-button": "tdesign-miniprogram/button/button",
    "t-popup": "tdesign-miniprogram/popup/popup",
    "t-tag": "tdesign-miniprogram/tag/tag",
    "t-upload": "tdesign-miniprogram/upload/upload",
    "t-toast": "tdesign-miniprogram/toast/toast",
  },
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submit", files: UploadFile[]): void;
}>();

const evidenceFiles = ref<UploadFile[]>([]);

const { showToast } = useToast({ theme: "error" });

const resetForm = () => {
  evidenceFiles.value = [];
};

const handleVisibleChange = (
  event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>,
) => {
  if (event.detail.visible === false) {
    emit("close");
  }
};

const handleUploadSuccess = (
  event: WechatMiniprogram.CustomEvent<{ files?: UploadFile[] }>,
) => {
  evidenceFiles.value = event.detail.files ?? [];
};

const handleUploadRemove = (
  event: WechatMiniprogram.CustomEvent<{ index?: number }>,
) => {
  const index = event.detail.index;

  if (typeof index !== "number") {
    return;
  }

  evidenceFiles.value = evidenceFiles.value.filter(
    (_, itemIndex) => itemIndex !== index,
  );
};

const handleUploadFail = () => {
  showToast("图片选择失败，请重试", "error");
};

const handleSubmit = () => {
  if (!evidenceFiles.value.length) {
    showToast("请先上传 evidence 图片", "warning");
    return;
  }

  console.log(evidenceFiles.value);

  emit("submit", evidenceFiles.value);
  showToast("evidence 已保存，提交功能开发中", "success");
  emit("close");
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      resetForm();
    }
  },
);
</script>

<template>
  <t-popup
    placement="bottom"
    :visible="visible"
    :show-overlay="true"
    :close-on-overlay-click="true"
    :prevent-scroll-through="true"
    :close-btn="true"
    @visible-change="handleVisibleChange"
  >
    <view class="flex max-h-[80vh] min-h-[50vh] flex-col rounded-t-lg bg-white">
      <scroll-view scroll-y class="min-h-0 flex-1 px-4 pt-4">
        <view class="space-y-4 pb-6">
          <view>
            <text class="block text-lg font-semibold">打卡</text>
            <text class="mt-2 block text-xs leading-6 text-slate-500">
              上传完成任务的图片凭证，最多 3 张，支持相册和拍照。
            </text>
          </view>

          <t-upload
            :media-type="['image']"
            source="media"
            :files="evidenceFiles"
            :max="3"
            :preview="true"
            :config="{
              sourceType: ['album', 'camera'],
              sizeType: ['compressed'],
            }"
            @success="handleUploadSuccess"
            @remove="handleUploadRemove"
            @fail="handleUploadFail"
          />
        </view>
      </scroll-view>

      <view class="px-4 pb-[calc(env(safe-area-inset-bottom)+16rpx)] pt-3">
        <t-button theme="primary" block @tap="handleSubmit">提交打卡</t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </t-popup>
</template>
