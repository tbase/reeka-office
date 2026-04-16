import { Fragment, type ReactNode } from "react"
import { LoaderCircle, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SALESFORCE_HOME_URL } from "@/lib/pru/contract"

const URL_PATTERN = /(https?:\/\/[^\s，。,]+)/g

function renderLink(url: string, index: number) {
  const label = url === SALESFORCE_HOME_URL ? "点击登录 Salesforce" : url

  return (
    <a
      key={`${url}-${index}`}
      href={url}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
    >
      {label}
    </a>
  )
}

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_PATTERN)

  return parts.map((part, index) => {
    if (!part) {
      return null
    }

    if (part.startsWith("http://") || part.startsWith("https://")) {
      return renderLink(part, index)
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>
  })
}

function ResultPanel({
  title,
  busy,
  stage,
  error,
  rowCount,
  fetchAction,
  controls,
  previewMeta,
  children,
}: {
  title: string
  busy: boolean
  stage: string
  error: string
  rowCount: number
  fetchAction?: (() => void | Promise<void>) | undefined
  controls?: ReactNode
  previewMeta?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="flex min-h-0 min-w-0 flex-col border-border/70 bg-white/90">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
          </div>
          {busy ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">抓取中</Badge>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          {controls ?? <div />}
          {fetchAction ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={fetchAction} disabled={busy}>
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                开始抓取
              </Button>
            </div>
          ) : null}
        </div>

        {stage ? (
          <Alert className="border-amber-200 bg-amber-50/80">
            <AlertTitle>执行状态</AlertTitle>
            <AlertDescription>{stage}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert className="border-red-200 bg-red-50/90">
            <AlertTitle>执行失败</AlertTitle>
            <AlertDescription>{renderTextWithLinks(error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/75">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div className="min-w-0 text-sm text-muted-foreground">
              {previewMeta ? <span className="block truncate">{previewMeta}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={rowCount > 0 ? "success" : "outline"}>{rowCount} rows</Badge>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ResultPanel }
