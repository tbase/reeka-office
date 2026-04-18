<script setup lang="ts">
import type { RecentViewedAgent } from '../../lib/search-history'

import { computed, onLoad, onShow, ref } from 'wevu'
import DesignationBadge from '@/components/designation-badge/index.vue'
import { useToast } from '@/hooks/useToast'
import { buildPageUrl, parseRouteAgentCode } from '../../lib/agent-code'
import {
  getRecentViewedAgents,
  pushRecentViewedAgent,

} from '../../lib/search-history'
import { useAgentSearchStore } from '../../store'

definePageJson({
  navigationBarTitleText: '搜索代理人',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-search': 'tdesign-miniprogram/search/search',
  },
})

interface SearchChangeEventDetail {
  value?: string
}

const routeReady = ref(false)
const routeAgentCode = ref<string | null>(null)
const routeError = ref<string | null>(null)
const keyword = ref('')
const recentViewedAgents = ref<RecentViewedAgent[]>([])
const isSearchFocused = ref(true)
const canSearch = computed(() => routeReady.value && !routeError.value)
const normalizedKeyword = computed(() => keyword.value.trim())
const hasSearchKeyword = computed(() => normalizedKeyword.value.length >= 2)
const showDefaultState = computed(() => !hasSearchKeyword.value)
const { showToast } = useToast({ theme: 'error' })

const {
  agents,
  isLoading,
  error,
  searchNow,
} = useAgentSearchStore(routeAgentCode, keyword, canSearch)

onLoad((options) => {
  const parsedAgentCode = parseRouteAgentCode(options?.agentCode)

  routeAgentCode.value = parsedAgentCode.agentCode
  routeError.value = parsedAgentCode.error
  routeReady.value = true
})

onShow(() => {
  refreshHistory()
})

const pageError = computed(() => routeError.value ?? null)
const showResultError = computed(() => {
  return Boolean(error.value) && !isLoading.value && hasSearchKeyword.value
})
const showEmpty = computed(() => {
  return hasSearchKeyword.value
    && !isLoading.value
    && !error.value
    && agents.value.length === 0
})

function refreshHistory() {
  recentViewedAgents.value = getRecentViewedAgents()
}

function getRelationText(hierarchy: number): string {
  if (hierarchy === 0) {
    return '本人'
  }

  if (hierarchy === 1) {
    return '直属'
  }

  return '下属'
}

function updateKeyword(value: string) {
  keyword.value = value
}

function handleKeywordChange(event: SearchChangeEventDetail) {
  updateKeyword(event.value ?? '')
}

async function handleSearchSubmit(event?: SearchChangeEventDetail) {
  if (event?.value != null) {
    updateKeyword(event.value)
  }

  const nextKeyword = normalizedKeyword.value

  if (nextKeyword.length < 2) {
    showToast('请输入至少 2 个字符')
    return
  }

  await searchNow()
}

function openAgentDashboard(agent: RecentViewedAgent) {
  wx.navigateTo({
    url: buildPageUrl('/packages/gege/pages/index/index', {
      agentCode: agent.agentCode,
    }),
  })
}

async function openSearchResult(agent: {
  agentCode: string
  name: string
  designationName: string | null
}) {
  recentViewedAgents.value = pushRecentViewedAgent({
    agentCode: agent.agentCode,
    name: agent.name,
    designationName: agent.designationName,
  })
  openAgentDashboard(agent)
}

async function retrySearch() {
  await searchNow()
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-12 pt-4">
    <view v-if="pageError" class="card p-4">
      <t-empty icon="error-circle" :description="pageError || '搜索范围无效'" />
    </view>

    <template v-else>
      <view>
        <t-search
          class="agent-search"
          :focus="isSearchFocused"
          :value="keyword"
          placeholder="搜索代理人姓名/编码"
          confirm-type="search"
          @change="handleKeywordChange"
          @submit="handleSearchSubmit"
        />
      </view>

      <view v-if="showDefaultState" class="mt-4 space-y-4">
        <view class="card p-4">
          <view class="flex items-center justify-between gap-3">
            <view class="text-base font-medium text-foreground">
              最近查看
            </view>
          </view>

          <view v-if="recentViewedAgents.length > 0" class="mt-3 space-y-3">
            <view
              v-for="agent in recentViewedAgents"
              :key="agent.agentCode"
              class="rounded-xl bg-card px-4 py-3 shadow-sm"
              @tap="openAgentDashboard(agent)"
            >
              <view class="flex items-start justify-between gap-3">
                <view class="min-w-0">
                  <view class="text-base font-medium text-foreground">
                    {{ agent.name }}
                  </view>
                  <view class="mt-1 text-sm text-muted-foreground">
                    {{ agent.agentCode }}
                  </view>
                </view>

                <DesignationBadge :designation-name="agent.designationName" />
              </view>
            </view>
          </view>

          <view v-else class="mt-4">
            <t-empty icon="view-list" description="暂无最近查看" />
          </view>
        </view>
      </view>

      <view v-else class="mt-4 space-y-4">
        <view v-if="isLoading" class="card p-4">
          <view class="text-center text-sm text-muted-foreground">
            搜索中...
          </view>
        </view>

        <view v-else-if="showResultError" class="card p-4">
          <t-empty icon="error-circle" :description="error?.message || '搜索失败'" />
          <view class="mt-4 flex justify-center">
            <view class="pill pill-primary" @tap="retrySearch">
              重试
            </view>
          </view>
        </view>

        <view v-else-if="showEmpty" class="card p-4">
          <t-empty icon="search" description="没有找到匹配的代理人" />
        </view>

        <view v-else class="space-y-3">
          <view
            v-for="agent in agents"
            :key="agent.agentCode"
            class="card p-4"
            @tap="openSearchResult(agent)"
          >
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0">
                <view class="text-base font-medium text-foreground">
                  {{ agent.name }}
                </view>
                <view class="mt-1 text-sm text-muted-foreground">
                  {{ agent.agentCode }}
                </view>
              </view>

              <view class="shrink-0 flex flex-wrap justify-end gap-2">
                <DesignationBadge :designation-name="agent.designationName" />
                <view class="pill pill-muted">
                  {{ getRelationText(agent.hierarchy) }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <t-toast id="t-toast" />
    </template>
  </view>
</template>

<style scoped lang="postcss">
.agent-search {
  @apply rounded-full shadow-md overflow-hidden;
  --td-search-bg-color: var(--card);
  --td-search-square-radius: 999rpx;
}
</style>
