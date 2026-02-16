"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";
import { signIn } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message ?? "登录失败")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-xs">
        请输入账号密码登录后继续操作。
      </CardFooter>
    </Card>
  )
}
