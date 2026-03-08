<script setup lang="ts">
import type { UploadFile } from "tdesign-miniprogram/upload/type";

import { ref, watch } from "wevu";

import { useToast } from "@/hooks/useToast";
import { uploadFile } from "@/lib/upload-file";

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
  taskId: number | null;
  storagePathPrefix: string;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submit", fileIds: string[]): void;
}>();

const evidenceFiles = ref<UploadFile[]>([]);
const uploading = ref(false);

const { showToast } = useToast({ theme: "error" });

const resetForm = () => {
  evidenceFiles.value = [];
  uploading.value = false;
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

const handleSubmit = async () => {
  if (!props.taskId || props.taskId <= 0) {
    showToast("任务参数缺失，请返回后重试", "error");
    return;
  }

  if (evidenceFiles.value.length === 0) {
    emit("submit", []);
    return;
  }

  if (!props.storagePathPrefix.trim()) {
    showToast("当前用户信息未就绪，请稍后再试", "error");
    return;
  }

  uploading.value = true;
  wx.showLoading({
    title: "上传中...",
    mask: true,
  });

  try {
    const uploadedFileIds = await Promise.all(
      evidenceFiles.value.map(async (file) => {
        const dir = `plans-newbie`;
        return uploadFile(file, dir);
      }),
    );

    emit("submit", uploadedFileIds);
  } catch (error) {
    console.error("uploadFile error", error);
    showToast(
      error instanceof Error ? error.message : "图片上传失败，请重试",
      "error",
    );
  } finally {
    uploading.value = false;
    wx.hideLoading();
  }
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
              可选上传完成任务的图片凭证，最多 3 张，支持相册和拍照。
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
        <t-button theme="primary" block :loading="uploading" @tap="handleSubmit"
          >提交打卡</t-button
        >
      </view>
    </view>

    <t-toast id="t-toast" />
  </t-popup>
</template>
