<script setup lang="ts">
import { computed } from 'wevu'

type BadgeTone = 'group-a' | 'group-b' | 'group-c' | 'group-d' | 'unknown'

interface BadgeState {
  label: string
  tone: BadgeTone
}

const props = defineProps<{
  designationName?: string | null
}>()

const DESIGNATION_TONE_MAP: Record<string, BadgeTone> = {
  LA: 'group-a',
  FC: 'group-a',
  UM: 'group-a',
  SUM: 'group-b',
  BM: 'group-b',
  RM: 'group-c',
  SRM: 'group-c',
  RD: 'group-d',
  SRD: 'group-d',
}

const badge = computed<BadgeState>(() => {
  const designationName = props.designationName?.trim().toUpperCase()

  if (!designationName) {
    return {
      label: '未设职级',
      tone: 'unknown',
    }
  }

  return {
    label: designationName,
    tone: DESIGNATION_TONE_MAP[designationName] ?? 'unknown',
  }
})
</script>

<template>
  <view
    class="designation-badge"
    :class="`designation-badge-${badge.tone}`"
  >
    {{ badge.label }}
  </view>
</template>

<style scoped lang="postcss">
.designation-badge {
  @apply inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold;

  letter-spacing: 0.02em;
  line-height: 1.2;
}

.designation-badge-group-a {
  background: var(--td-gray-color-2);
  color: var(--td-gray-color-10);
  border-color: var(--td-gray-color-4);
}

.designation-badge-group-b {
  background: #f3ecff;
  color: #7a3ff2;
  border-color: #dcc9ff;
}

.designation-badge-group-c {
  background: var(--td-warning-color-light);
  color: var(--td-warning-color);
  border-color: var(--td-warning-color-light-active);
}

.designation-badge-group-d {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  border-color: var(--td-brand-color-light-active);
}

.designation-badge-unknown {
  background: var(--muted);
  color: var(--muted-foreground);
  border-color: var(--border);
}
</style>
