import type { Ref } from 'wevu'

import type { RpcError } from '@/lib/rpc'
import { onUnload, onUnmounted, ref, shallowRef, watch } from 'wevu'
import { rpc } from '@/lib/rpc'
import type { SearchAgent } from './shared'
import {
  buildAgentCodeInput,
  DEFAULT_AGENT_SEARCH_LIMIT,
  DEFAULT_SEARCH_DEBOUNCE_MS,
} from './shared'

export interface AgentSearchStore {
  agents: Ref<SearchAgent[]>
  isLoading: Ref<boolean>
  error: Ref<RpcError | null>
  searchNow: () => Promise<void>
  reset: () => void
}

export function useAgentSearchStore(
  agentCode: Ref<string | null>,
  keyword: Ref<string>,
  enabled: Ref<boolean>,
): AgentSearchStore {
  const agents = ref<SearchAgent[]>([])
  const isLoading = ref(false)
  const error = shallowRef<RpcError | null>(null) as Ref<RpcError | null>

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let latestRequestId = 0

  function clearDebounceTimer() {
    if (debounceTimer == null) {
      return
    }

    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  function reset() {
    clearDebounceTimer()
    latestRequestId += 1
    isLoading.value = false
    error.value = null
    agents.value = []
  }

  async function search(options: { immediate?: boolean } = {}) {
    const normalizedKeyword = keyword.value.trim()

    clearDebounceTimer()

    if (!enabled.value || normalizedKeyword.length < 2) {
      reset()
      return
    }

    const requestId = ++latestRequestId

    if (!options.immediate) {
      debounceTimer = setTimeout(() => {
        void executeSearch(requestId, normalizedKeyword)
      }, DEFAULT_SEARCH_DEBOUNCE_MS)
      return
    }

    await executeSearch(requestId, normalizedKeyword)
  }

  async function executeSearch(requestId: number, normalizedKeyword: string) {
    isLoading.value = true
    error.value = null

    const result = await rpc('gege/searchAgents', {
      ...buildAgentCodeInput(agentCode.value),
      keyword: normalizedKeyword,
      limit: DEFAULT_AGENT_SEARCH_LIMIT,
    })

    if (requestId !== latestRequestId) {
      return
    }

    isLoading.value = false

    if (!result.success) {
      error.value = result.error
      return
    }

    agents.value = result.data.agents
  }

  watch(
    () => [agentCode.value, keyword.value, enabled.value],
    () => {
      void search()
    },
    { immediate: true },
  )

  onUnload(reset)
  onUnmounted(reset)

  return {
    agents,
    isLoading,
    error,
    searchNow: () => search({ immediate: true }),
    reset,
  }
}
