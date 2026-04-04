"use client"

import { RefreshCwIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PruCookieStatus } from "@/lib/pru-cookie"
import { cn } from "@/lib/utils"

import { refreshPruCookieAction } from "./actions"

interface PruCookieCardProps {
  status: PruCookieStatus
}

function getStatusLabel(status: PruCookieStatus): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
} {
  if (!status.ready) {
    return {
      label: "待配置",
      variant: "outline",
    }
  }

  if (!status.cache) {
    return {
      label: "未获取",
      variant: "secondary",
    }
  }

  if (status.cache.isExpired) {
    return {
      label: "已过期",
      variant: "destructive",
    }
  }

  return {
    label: "可用",
    variant: "default",
  }
}

export function PruCookieCard({ status }: PruCookieCardProps) {
  const router = useRouter()
  const badge = getStatusLabel(status)

  const { execute, isPending } = useAction(refreshPruCookieAction, {
    onSuccess: ({ data }) => {
      if (!data) {
        toast.error("刷新 PRU Cookie 失败")
        return
      }

      toast.success(
        `Cookie 已刷新，当前缓存 ${data.cookieCount} 个，过期时间 ${data.expiresAt}`,
      )
      router.refresh()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "刷新 PRU Cookie 失败")
    },
  })

  return (
    <Card size="sm">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle>PRU Cookie</CardTitle>
          <CardDescription>
            通过无头浏览器登录保诚后台并缓存 Cookie，供后续同步代理人数据复用。
          </CardDescription>
        </div>
        <CardAction className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <Button
            size="sm"
            variant="outline"
            disabled={!status.ready || isPending}
            onClick={() => execute({})}
          >
            <RefreshCwIcon
              className={cn("size-4", isPending && "animate-spin")}
            />
            {isPending ? "刷新中..." : "刷新 Cookie"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs uppercase">账号</div>
          <div className="font-medium">{status.accountLabel ?? "未配置"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs uppercase">缓存状态</div>
          <div className="font-medium">
            {status.cache
              ? `${status.cache.cookieCount} 个 Cookie`
              : "暂无缓存"}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs uppercase">最近刷新</div>
          <div className="font-medium">{status.cache?.updatedAt ?? "-"}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs uppercase">过期时间</div>
          <div className="font-medium">{status.cache?.expiresAt ?? "-"}</div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <div className="text-muted-foreground text-xs uppercase">目标地址</div>
          <div className="text-sm break-all">
            登录页：{status.loginUrl}
            <br />
            取 Cookie 页：{status.cookieUrl}
          </div>
        </div>
        {!status.ready && (
          <div className="space-y-1 md:col-span-2">
            <div className="text-muted-foreground text-xs uppercase">缺失配置</div>
            <div className="text-sm break-all">{status.missing.join("、")}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
