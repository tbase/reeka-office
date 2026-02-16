import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>管理端首页</CardTitle>
          <CardDescription>在这里可以进入 CMS 管理并维护分类与内容。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">UI Ready</Badge>
          <LinkButton href="/cms/services" variant="outline">
            前往服务管理
            <ArrowRightIcon className="size-4" />
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  )
}
