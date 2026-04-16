<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'

import { computed, onLoad, ref, watch } from 'wevu'
import DesignationBadge from '@/components/designation-badge/index.vue'
import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import { parseRouteAgentCode } from '../../lib/agent-code'
import { formatNumber } from '../../lib/format'
import { useOrgTreeStore } from '../../store'

definePageJson({
  navigationBarTitleText: '组织架构',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})

type OrgTree = NonNullable<RpcOutput<'gege/getOrgTree'>>
type OrgTreeNode = OrgTree['root']

interface VisibleOrgNode {
  agentCode: string
  name: string
  designationName: string | null
  hasChildren: boolean
  isExpanded: boolean
  depth: number
  childCount: number
}

const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const canQueryOrgTree = computed(() => routeReady.value && !routeError.value)
const expandedNodes = ref<Record<string, boolean>>({})

const { tree, isLoading, error, refetch } = useOrgTreeStore(
  routeAgentCode,
  canQueryOrgTree,
)

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error

  wx.setNavigationBarTitle({
    title: parsedAgentCode.agentCode ? '代理人组织架构' : '组织架构',
  })

  routeReady.value = true
})

usePullDownRefresh(async () => {
  if (!canQueryOrgTree.value) {
    return
  }

  await refetch()
})

watch(tree, (value) => {
  const root = value?.root

  if (!root) {
    expandedNodes.value = {}
    return
  }

  expandedNodes.value = {}
}, { immediate: true })

const pageError = computed(() => routeError.value ?? error.value?.message ?? null)
const rootNode = computed(() => tree.value?.root ?? null)
const summaryItems = computed(() => [
  {
    label: '成员数',
    value: formatNumber(tree.value?.totalMembers),
  },
  {
    label: '直属成员',
    value: formatNumber(rootNode.value?.children.length),
  },
])
const showEmpty = computed(() => {
  const root = rootNode.value

  if (!root) {
    return false
  }

  return root.children.length === 0 && !isLoading.value
})

const visibleNodes = computed<VisibleOrgNode[]>(() => {
  const root = rootNode.value

  if (!root) {
    return []
  }

  const items: VisibleOrgNode[] = []

  function visit(node: OrgTreeNode, depth: number) {
    const children = node.children ?? []
    const hasChildren = children.length > 0
    const isExpanded = Boolean(expandedNodes.value[node.agentCode])

    items.push({
      agentCode: node.agentCode,
      name: node.name,
      designationName: node.designationName,
      hasChildren,
      isExpanded,
      depth,
      childCount: children.length,
    })

    if (!hasChildren || !isExpanded) {
      return
    }

    for (const child of children) {
      visit(child, depth + 1)
    }
  }

  for (const child of root.children) {
    visit(child, 0)
  }

  return items
})

function toggleNode(agentCode: string, hasChildren: boolean) {
  if (!hasChildren) {
    return
  }

  expandedNodes.value = {
    ...expandedNodes.value,
    [agentCode]: !expandedNodes.value[agentCode],
  }
}

function createIndentStyle(depth: number) {
  const safeDepth = Math.max(depth, 0)

  return `padding-left: ${safeDepth * 32}rpx;`
}
</script>

<template>
  <view class="h-screen flex flex-col bg-background">
    <view v-if="pageError && !tree" class="px-4 pt-4">
      <view class="card p-4">
        <t-empty icon="error-circle" :description="pageError || '组织架构加载失败'" />
      </view>
    </view>

    <template v-else-if="tree && rootNode">
      <view class="shrink-0 px-4 pt-4">
        <view class="card bg-hero p-4">
            <view class="min-w-0">
              <view class="flex flex-wrap items-center gap-2">
                <view class="text-xl font-semibold text-foreground">
                  {{ rootNode.name }}
                </view>
                <DesignationBadge :designation-name="rootNode.designationName" />
              </view>
              <view class="mt-1 text-sm text-muted-foreground">
                {{ rootNode.agentCode }}
              </view>
          </view>

          <view class="mt-4 grid grid-cols-2 gap-3">
            <view
              v-for="item in summaryItems"
              :key="item.label"
              class="card bg-card p-3 shadow-none"
            >
              <view class="text-xs text-muted-foreground">
                {{ item.label }}
              </view>
              <view class="mt-1 text-lg font-semibold text-foreground">
                {{ item.value }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="px-4 pb-16 pt-4">
          <view v-if="isLoading && visibleNodes.length === 0" class="card p-4">
            <view class="text-center text-sm text-muted-foreground">
              加载组织架构中...
            </view>
          </view>

          <view v-else-if="showEmpty" class="card p-4">
            <t-empty icon="view-list" description="当前代理人暂无下属成员" />
          </view>

          <view v-else class="card overflow-hidden p-2">
            <view
              v-for="node in visibleNodes"
              :key="node.agentCode"
              hover-class="bg-muted"
              class="rounded-lg px-2 py-2 transition-colors"
              @tap="toggleNode(node.agentCode, node.hasChildren)"
            >
              <view
                class="flex items-start gap-3"
                :style="createIndentStyle(node.depth)"
              >
                <view
                  class="mt-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[18rpx] font-bold leading-none"
                  :class="node.hasChildren
                    ? 'border-primary bg-accent text-primary'
                    : 'border-success bg-success-soft text-success'"
                >
                  <view v-if="node.hasChildren" class="block leading-none pb-0.5">
                    {{ node.isExpanded ? '-' : '+' }}
                  </view>
                  <view v-else class="block leading-none">
                    •
                  </view>
                </view>

                <view
                  class="card min-w-0 flex-1 border border-border bg-card px-3 py-3 shadow-none"
                  :class="node.depth > 0 ? 'border-l-[6rpx] border-l-primary/35' : 'border-l-[6rpx] border-l-primary'"
                >
                  <view class="flex items-start justify-between gap-3">
                    <view class="min-w-0">
                      <view class="flex flex-wrap items-center gap-2">
                        <view class="text-sm font-semibold text-foreground">
                          {{ node.name }}
                        </view>
                        <DesignationBadge :designation-name="node.designationName" />
                      </view>
                      <view class="mt-1 text-xs tracking-[0.08em] text-muted-foreground">
                        {{ node.agentCode }}
                      </view>
                    </view>

                    <view
                      v-if="node.hasChildren"
                      class="pill pill-muted shrink-0"
                    >
                      {{ node.childCount }} 人
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </template>

    <t-toast id="t-toast" />
  </view>
</template>
