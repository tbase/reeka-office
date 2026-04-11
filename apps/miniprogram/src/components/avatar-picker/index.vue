<script setup lang="ts">
import { computed } from 'wevu'

const props = withDefaults(
  defineProps<{
    src?: string | null
    size?: number
    loading?: boolean
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    src: '',
    size: 96,
    loading: false,
    disabled: false,
    placeholder: '选择头像',
  },
)

const emit = defineEmits(['choose'])

const hasAvatar = computed(() => Boolean(props.src))
const isDisabled = computed(() => props.disabled || props.loading)
const sizeStyle = computed(
  () => `width: ${props.size}rpx; height: ${props.size}rpx;`,
)
const emptyButtonLabel = computed(() =>
  props.loading ? '上传中...' : props.placeholder,
)

function handleChooseAvatar(event: {
  detail?: {
    avatarUrl?: string
  }
  avatarUrl?: string
}) {
  const avatarUrl = event.detail?.avatarUrl ?? event.avatarUrl
  if (!avatarUrl) {
    return
  }

  emit('choose', {
    avatarUrl,
  })
}
</script>

<template>
  <view class="avatar-picker" :style="sizeStyle">
    <image
      v-if="hasAvatar"
      class="avatar-picker__image"
      mode="aspectFill"
      :src="props.src || ''"
    />

    <view v-else class="avatar-picker__placeholder">
      <view class="avatar-picker__placeholder-icon">
        头像
      </view>
    </view>

    <button
      open-type="chooseAvatar"
      class="avatar-picker__button"
      :class="{
        'avatar-picker__button--empty': !hasAvatar,
        'avatar-picker__button--disabled': isDisabled,
      }"
      :disabled="isDisabled"
      @chooseavatar="handleChooseAvatar"
    >
      {{ hasAvatar ? "" : emptyButtonLabel }}
    </button>
  </view>
</template>

<style scoped>
.avatar-picker {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  background: #f1f5f9;
}

.avatar-picker__image,
.avatar-picker__placeholder,
.avatar-picker__button,
.avatar-picker__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.avatar-picker__image {
  display: block;
  background: #e2e8f0;
}

.avatar-picker__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

.avatar-picker__placeholder-icon {
  padding: 10rpx 16rpx;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.08);
  color: #475569;
  font-size: 22rpx;
  line-height: 1;
}

.avatar-picker__button {
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: transparent;
  font-size: 24rpx;
  line-height: 1.2;
}

.avatar-picker__button::after {
  border: 0;
}

.avatar-picker__button--empty {
  background: transparent;
  color: #0f172a;
}

.avatar-picker__button--disabled {
  pointer-events: none;
}

.avatar-picker__overlay {
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8rpx;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 42%, rgba(15, 23, 42, 0.55) 100%);
}

.avatar-picker__overlay-text {
  color: #fff;
  font-size: 20rpx;
  line-height: 1;
}
</style>
