<script setup lang="ts">
import { computed, onShow, ref } from 'wevu'

import AvatarPicker from '@/components/avatar-picker/index.vue'
import { useMutation } from '@/hooks/useMutation'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import { unbindTenant } from '@/lib/rpc/center'
import { getActiveTenant, getActiveTenantCode } from '@/lib/tenant-session'
import { uploadFile } from '@/lib/upload-file'
import { useUserStore } from '@/stores/user'

definePageJson({
  navigationBarTitleText: '代理人设置',
  backgroundColor: '#f6f7fb',
})

const { user, refetch: refetchUser } = useUserStore()
const { hideLoading, showLoading, showToast } = useToast()
const { mutate: updateAvatar, loading: avatarUpdating } = useMutation('identity/updateAvatar')
const { mutate: updateNickname, loading: nicknameUpdating } = useMutation('identity/updateNickname')

const requestingAvatar = ref(false)
const unbinding = ref(false)
const activeTenant = ref(getActiveTenant())

const profile = computed(() => {
  return {
    agentName: user.value?.agentName ?? '',
    agentCode: user.value?.agentCode ?? '',
    nickname: user.value?.nickname ?? '',
    avatar: user.value?.avatar ?? null,
    tenantName: activeTenant.value?.tenantName ?? '',
    tenantCode: activeTenant.value?.tenantCode ?? getActiveTenantCode() ?? '',
  }
})

type NicknameEvent = {
  detail?: {
    value?: string
  }
}

async function syncAvatar(avatar: string) {
  if (!profile.value.agentCode) {
    showToast('代理人编码缺失，无法更新头像', 'error')
    return
  }

  const cloudPath = await uploadFile(avatar, `agent/${profile.value.agentCode}`)
  const result = await updateAvatar({ avatar: cloudPath })
  if (!result) {
    showToast('头像更新失败', 'error')
    return
  }

  await refetchUser()
}

async function onChooseAvatar(event: { avatarUrl?: string }) {
  if (requestingAvatar.value || avatarUpdating.value || unbinding.value) {
    return
  }

  const avatarUrl = event.avatarUrl
  if (!avatarUrl) {
    showToast('未获取到头像', 'warning')
    return
  }

  requestingAvatar.value = true
  showLoading('更新头像中...')
  try {
    await syncAvatar(avatarUrl)
  }
  catch {
    showToast('头像更新失败', 'error')
  }
  finally {
    requestingAvatar.value = false
    hideLoading()
  }
}

async function saveNickname(nickname: string) {
  if (nicknameUpdating.value || requestingAvatar.value || unbinding.value) {
    return
  }

  const nextNickname = nickname.trim()
  if (nextNickname === profile.value.nickname.trim()) {
    return
  }

  showLoading('保存中...')
  try {
    const result = await updateNickname({ nickname: nextNickname || null })
    if (!result) {
      showToast('昵称保存失败', 'error')
      return
    }

    await refetchUser()
    showToast('昵称已保存')
  }
  catch {
    showToast('昵称保存失败', 'error')
  }
  finally {
    hideLoading()
  }
}

function onNicknameSave(event: NicknameEvent) {
  void saveNickname(event.detail?.value ?? '')
}

function confirmUnbind() {
  if (unbinding.value) {
    return
  }

  const tenantCode = profile.value.tenantCode
  if (!tenantCode) {
    showToast('当前身份无效，请刷新后重试', 'warning')
    return
  }

  wx.showModal({
    title: '解绑代理人',
    content: '确认解绑当前代理人？',
    confirmText: '解绑',
    confirmColor: '#e23a3b',
    cancelText: '取消',
    success: (result) => {
      if (result.confirm) {
        void handleUnbind(tenantCode)
      }
    },
  })
}

async function handleUnbind(tenantCode: string) {
  unbinding.value = true
  showLoading('解绑中...')

  try {
    await unbindTenant(tenantCode)
    invalidateQueries()
    hideLoading()
    showToast('解绑成功')
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/unauthorized/index' })
    }, 300)
  }
  catch (error) {
    hideLoading()
    showToast(error instanceof Error ? error.message : '解绑失败', 'error')
  }
  finally {
    unbinding.value = false
  }
}

onShow(() => {
  activeTenant.value = getActiveTenant()
  void refetchUser()
})
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-8 pt-4">
    <view>
      <t-cell-group bordered class="bg-white">
        <t-cell title="头像" align="middle">
          <template #note>
            <AvatarPicker
              :src="profile.avatar"
              :size="64"
              :disabled="requestingAvatar || avatarUpdating || unbinding"
              :loading="requestingAvatar || avatarUpdating"
              @choose="onChooseAvatar"
            />
          </template>
        </t-cell>
        <t-cell
          title="用户昵称"
          align="middle"
        >
          <template #note>
            <input
              class="w-40 text-right text-sm text-foreground"
              type="nickname"
              :value="profile.nickname"
              placeholder="选择昵称"
              :disabled="nicknameUpdating || requestingAvatar || unbinding"
              @blur="onNicknameSave"
              @confirm="onNicknameSave"
            >
          </template>
        </t-cell>
        <t-cell title="代理人姓名" :note="profile.agentName || '-'" />
        <t-cell title="代理人编码" :note="profile.agentCode || '-'" />
        <t-cell title="当前团队" :note="profile.tenantName || profile.tenantCode || '-'" />
      </t-cell-group>
    </view>

    <view class="mt-4">
      <t-cell-group bordered class="bg-white">
        <t-cell
          arrow
          :hover="!unbinding"
          @click="confirmUnbind"
        >
          <template #title>
            <view class="text-destructive">
              {{ unbinding ? "解绑中..." : "解绑代理人" }}
            </view>
          </template>
        </t-cell>
      </t-cell-group>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
