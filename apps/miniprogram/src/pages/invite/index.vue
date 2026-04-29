<script setup lang="ts">
import type { InviteInfo } from '@/lib/rpc/center'

import { computed, onLoad, ref } from 'wevu'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import {
  hydrateTenantCatalog,
  resolveInviteShareToken,
  switchTenant,
} from '@/lib/rpc/center'
import { bindByShareToken } from '@/lib/rpc/tenant-invite'

definePageJson({
  navigationBarTitleText: '加入团队',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-input': 'tdesign-miniprogram/input/input',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

const { hideLoading, showLoading, showToast } = useToast()

const routeShareToken = ref<string | null>(null)
const inviteInfo = ref<InviteInfo | null>(null)
const agentCode = ref('')
const joinMonth = ref('')
const loading = ref(false)
const binding = ref(false)
const errorMessage = ref<string | null>(null)
const alreadyMember = ref(false)

const inviterName = computed(() =>
  inviteInfo.value?.inviterName
  ?? inviteInfo.value?.inviterAgentCode
  ?? '上级代理人',
)
const tenantName = computed(() => inviteInfo.value?.tenantName ?? '团队')
const inviteCardInviterName = computed(() => inviterName.value.toUpperCase())

function normalizeShareToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const token = decodeURIComponent(value).trim()
  return token || null
}

function handleAgentCodeChange(event: { value?: string }) {
  agentCode.value = event.value ?? ''
}

function handleJoinMonthChange(event: { detail?: { value?: string }, target?: { value?: string } }) {
  joinMonth.value = event.detail?.value ?? event.target?.value ?? ''
}

function goHome() {
  wx.reLaunch({ url: '/pages/index/index' })
}

async function loadInvite() {
  loading.value = true
  errorMessage.value = null
  alreadyMember.value = false
  showLoading('加载邀请中...')

  try {
    if (!routeShareToken.value) {
      errorMessage.value = '邀请链接无效，请联系上级重新分享'
      return
    }

    const invite = await resolveInviteShareToken(routeShareToken.value)
    inviteInfo.value = invite

    if (invite.isExpired) {
      errorMessage.value = '邀请链接已过期，请联系上级重新分享'
      return
    }

    const { tenants } = await hydrateTenantCatalog()
    const matchedTenant = tenants.find(tenant => tenant.tenantCode === invite.tenantCode)
    if (matchedTenant) {
      switchTenant(matchedTenant.tenantCode)
      alreadyMember.value = true
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '邀请信息加载失败'
  }
  finally {
    loading.value = false
    hideLoading()
  }
}

async function handleBind() {
  if (!routeShareToken.value || !inviteInfo.value || binding.value) {
    return
  }

  const normalizedAgentCode = agentCode.value.trim().toUpperCase()
  if (!normalizedAgentCode) {
    showToast('请输入代理人编码', 'warning')
    return
  }

  if (!joinMonth.value) {
    showToast('请选择入职年月', 'warning')
    return
  }

  binding.value = true
  showLoading('绑定中...')

  try {
    await bindByShareToken({
      shareToken: routeShareToken.value,
      agentCode: normalizedAgentCode,
      joinMonth: joinMonth.value,
      invite: inviteInfo.value,
    })
    invalidateQueries()
    hideLoading()
    showToast('加入成功')
    setTimeout(() => {
      goHome()
    }, 400)
  }
  catch (error) {
    hideLoading()
    showToast(error instanceof Error ? error.message : '绑定失败', 'error')
  }
  finally {
    binding.value = false
    hideLoading()
  }
}

onLoad((options) => {
  routeShareToken.value = normalizeShareToken(options?.shareToken)
  void loadInvite()
})
</script>

<template>
  <view class="min-h-screen bg-background px-4 py-5">
    <view class="card bg-primary px-5 py-8 text-center text-primary-foreground">
      <view class="text-base">
        {{ inviteCardInviterName }}
      </view>
      <view class="mt-3 text-base font-medium">
        邀请你加入{{ tenantName }}
      </view>
    </view>

    <view v-if="loading" class="mt-5 card p-5 text-center text-sm text-muted-foreground">
      加载中...
    </view>

    <view v-else-if="errorMessage" class="mt-5 card p-5 text-center">
      <view class="text-base font-medium">
        邀请不可用
      </view>
      <view class="mt-2 text-sm text-muted-foreground">
        {{ errorMessage }}
      </view>
    </view>

    <view v-else-if="alreadyMember" class="mt-5 card p-5 text-center">
      <view class="text-base font-medium">
        你已是{{ tenantName }}成员
      </view>
      <view class="mt-2 text-sm text-muted-foreground">
        可直接进入首页使用
      </view>
      <view class="mt-5">
        <t-button theme="primary" size="large" block @click="goHome">
          进入首页
        </t-button>
      </view>
    </view>

    <view v-else class="mt-5 card p-4">
      <view class="text-base font-medium">
        填写本人信息
      </view>
      <view class="mt-4 overflow-hidden rounded-lg border border-border">
        <t-input
          :value="agentCode"
          placeholder="代理人编码"
          clearable
          :disabled="binding"
          @change="handleAgentCodeChange"
        />
        <picker
          mode="date"
          fields="month"
          :value="joinMonth"
          :disabled="binding"
          @change="handleJoinMonthChange"
        >
          <view class="flex min-h-12 items-center justify-between border-t border-border px-4 text-sm">
            <text :class="joinMonth ? 'text-foreground' : 'text-muted-foreground'">
              {{ joinMonth || '选择入职年月' }}
            </text>
            <text class="text-muted-foreground">
              选择
            </text>
          </view>
        </picker>
      </view>
      <view class="mt-5">
        <t-button
          theme="primary"
          size="large"
          block
          :disabled="binding || Boolean(inviteInfo?.isExpired)"
          @click="handleBind"
        >
          {{ binding ? '加入中...' : '确认加入' }}
        </t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
