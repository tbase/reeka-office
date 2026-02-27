import { rpc, type RpcError, type RpcInput, type RpcMethodName, type RpcOutput, type RpcResult } from '@/lib/rpc';
import { onShow, ref, shallowRef, watchEffect, type Ref, type ShallowRef } from 'wevu';

const cache = new Map<string, { data: unknown; timestamp: number }>()

const DEFAULT_STALE_TIME = 5 * 60 * 1000

function serializeKey(key: [RpcMethodName, unknown]): string {
  return JSON.stringify(key)
}

type GlobalErrorHandler = (error: RpcError, method: RpcMethodName) => void

let globalErrorHandler: GlobalErrorHandler | undefined

export function setQueryErrorHandler(handler: GlobalErrorHandler): void {
  globalErrorHandler = handler
}

export interface UseQueryOptions<M extends RpcMethodName> {
  queryKey: [M, RpcInput<M>] | (() => [M, RpcInput<M>] | undefined)
  initialData?: RpcOutput<M>
  staleTime?: number
  skipGlobalErrorHandler?: boolean
  refetchOnShow?: boolean
}

export interface UseQueryReturn<T> {
  data: ShallowRef<T | null>
  loading: Ref<boolean>
  error: ShallowRef<RpcError | null>
  isStale: Ref<boolean>
  refetch: () => Promise<T | null>
  invalidate: () => void
}

export function useQuery<M extends RpcMethodName>(
  options: UseQueryOptions<M>
): UseQueryReturn<RpcOutput<M>> {
  type TOutput = RpcOutput<M>

  const {
    queryKey,
    initialData,
    staleTime = DEFAULT_STALE_TIME,
    skipGlobalErrorHandler = false,
    refetchOnShow = false,
  } = options

  const data = shallowRef<TOutput | null>(initialData ?? null) as ShallowRef<TOutput | null>
  const loading = ref(false)
  const error = shallowRef<RpcError | null>(null) as ShallowRef<RpcError | null>
  const isStale = ref(false)

  let lastKey: [M, RpcInput<M>] | undefined
  let lastCacheKey: string | undefined

  function getCachedData(cacheKey: string): TOutput | null {
    const cached = cache.get(cacheKey)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > staleTime
    isStale.value = isExpired
    return cached.data as TOutput
  }

  function setCachedData(cacheKey: string, value: TOutput): void {
    cache.set(cacheKey, { data: value, timestamp: Date.now() })
    isStale.value = false
  }

  async function execute(key: [M, RpcInput<M>]): Promise<TOutput | null> {
    const [method, params] = key
    const cacheKey = serializeKey(key)
    lastCacheKey = cacheKey

    const cachedData = getCachedData(cacheKey)
    const hasCachedData = cachedData !== undefined
    if (hasCachedData) {
      data.value = cachedData
    }

    loading.value = !hasCachedData
    error.value = null

    const rpcMethod = rpc as (method: M, params?: RpcInput<M>) => Promise<RpcResult<TOutput>>
    const result = await rpcMethod(method, params)

    loading.value = false

    if (result.success) {
      data.value = result.data
      setCachedData(cacheKey, result.data)
      return result.data
    } else {
      error.value = result.error
      if (!skipGlobalErrorHandler && globalErrorHandler) {
        globalErrorHandler(result.error, method)
      }
      return cachedData
    }
  }

  async function refetch(): Promise<TOutput | null> {
    if (!lastKey) return null
    if (lastCacheKey) {
      cache.delete(lastCacheKey)
    }
    return execute(lastKey)
  }

  function invalidate(): void {
    if (lastCacheKey) {
      cache.delete(lastCacheKey)
      isStale.value = true
    }
  }

  watchEffect(() => {
    const key = typeof queryKey === 'function' ? queryKey() : queryKey
    if (!key) return

    lastKey = key
    execute(key)
  })

  if (refetchOnShow) {
    onShow(() => {
      if (lastKey) refetch()
    })
  }

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidate,
  }
}

export function invalidateQueries(keyPrefix?: RpcMethodName): void {
  if (!keyPrefix) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.startsWith(`["${keyPrefix}"`)) {
      cache.delete(key)
    }
  }
}

export async function prefetchQuery<M extends RpcMethodName>(
  method: M,
  params: RpcInput<M>
): Promise<void> {
  const cacheKey = serializeKey([method, params])

  const rpcMethod = rpc as (method: M, params?: RpcInput<M>) => Promise<RpcResult<RpcOutput<M>>>
  const result = await rpcMethod(method, params)

  if (result.success) {
    cache.set(cacheKey, { data: result.data, timestamp: Date.now() })
  }
}
