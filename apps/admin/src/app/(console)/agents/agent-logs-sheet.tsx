import { HistoryIcon } from "lucide-react"

import { LinkButton } from "@/components/ui/link-button"

interface AgentLogsSheetProps {
  href: string
}

export function AgentLogsSheet({ href }: AgentLogsSheetProps) {
  return (
    <LinkButton href={href} variant="outline" size="sm">
      <HistoryIcon />
      查看日志
    </LinkButton>
  )
}
