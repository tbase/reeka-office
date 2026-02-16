import { ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkButton } from "@/components/ui/link-button"

export default function LoginPage() {
  return (
    <main className="from-muted/30 via-background to-background flex min-h-svh items-center justify-center bg-gradient-to-b px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3">
          <div className="text-primary bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <ShieldCheckIcon className="size-5" />
          </div>
          <CardTitle className="text-xl">后台登录</CardTitle>
          <CardDescription>
            登录后可进入 CMS 管理服务分类与服务条目。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" type="text" placeholder="请输入用户名" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="请输入密码" />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-muted-foreground justify-center text-xs">
          请输入账号密码登录后继续操作。
        </CardFooter>
      </Card>
      <LinkButton
        href="/dashboard"
        variant="link"
        className="fixed right-4 bottom-4"
      >
        直接查看管理端
      </LinkButton>
    </main>
  )
}
