<script setup lang="ts">
import { computed } from 'wevu'

import {
  formatMetricValue,
  formatQualified,
} from '../../lib/format'

type BadgeTone = 'success' | 'warning' | 'muted'

interface BadgeState {
  label: string
  tone: BadgeTone
}

const props = defineProps<{
  qualified?: boolean | null
  gap?: number | null
}>()

const badge = computed<BadgeState>(() => {
  if (props.qualified === true) {
    return {
      label: formatQualified(true),
      tone: 'success',
    }
  }

  if (props.qualified === false) {
    return {
      label: props.gap == null ? formatQualified(false) : formatMetricValue(props.gap),
      tone: 'warning',
    }
  }

  return {
    label: '-',
    tone: 'muted',
  }
})
</script>

<template>
  <view
    class="flex items-center justify-center rounded-full w-5 h-5 text-xs"
    :class="`pill-${badge.tone}`"
  >
    {{ badge.label }}
  </view>
</template>
