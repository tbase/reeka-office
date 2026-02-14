import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>管理端首页</CardTitle>
          <CardDescription>当前阶段已完成登录页与 CMS 服务管理页的基础结构。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">UI Ready</Badge>
          <Button variant="outline" render={<a href="/cms/services" />}>
            前往服务管理
            <ArrowRightIcon className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
