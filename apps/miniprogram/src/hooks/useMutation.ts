import { ref, shallowRef, type Ref, type ShallowRef } from 'wevu'
import { rpc, type RpcMethodName, type RpcInput, type RpcOutput, type RpcError, type RpcResult } from '@/lib/rpc'

export interface UseMutationOptions<T, TInput> {
  /** 显示 loading，传 string 自定义提示文案，传 true 使用默认 "处理中..." */
  showLoading?: boolean | string
  onSuccess?: (data: T, params: TInput) => void
  onError?: (error: RpcError) => void
}

export interface UseMutationReturn<T, TInput> {
  data: ShallowRef<T | undefined>
  loading: Ref<boolean>
  error: ShallowRef<RpcError | undefined>
  mutate: TInput extends void ? () => Promise<T | undefined> : (params: TInput) => Promise<T | undefined>
  reset: () => void
}

export function useMutation<M extends RpcMethodName>(
  method: M,
  options: UseMutationOptions<RpcOutput<M>, RpcInput<M>> = {}
): UseMutationReturn<RpcOutput<M>, RpcInput<M>> {
  type TOutput = RpcOutput<M>
  type TInput = RpcInput<M>

  const { showLoading, onSuccess, onError } = options

  const data = shallowRef<TOutput | undefined>(undefined) as ShallowRef<TOutput | undefined>
  const loading = ref(false)
  const error = shallowRef<RpcError | undefined>(undefined) as ShallowRef<RpcError | undefined>

  async function mutate(params?: TInput): Promise<TOutput | undefined> {
    loading.value = true
    error.value = undefined

    if (showLoading) {
      const title = typeof showLoading === 'string' ? showLoading : '处理中...'
      wx.showLoading({ title, mask: true })
    }

    const rpcMethod = rpc as (method: M, params?: TInput) => Promise<RpcResult<TOutput>>
    const result = await rpcMethod(method, params)

    loading.value = false

    if (showLoading) {
      wx.hideLoading()
    }

    if (result.success) {
      data.value = result.data
      onSuccess?.(result.data, params)
      return result.data
    } else {
      error.value = result.error
      onError?.(result.error)
      return undefined
    }
  }

  function reset(): void {
    data.value = undefined
    loading.value = false
    error.value = undefined
  }

  const mutateWithType = mutate as TInput extends void
    ? () => Promise<TOutput | undefined>
    : (params: TInput) => Promise<TOutput | undefined>

  return {
    data,
    loading,
    error,
    mutate: mutateWithType,
    reset,
  }
}
