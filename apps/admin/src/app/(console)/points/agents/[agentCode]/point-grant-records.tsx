import { ListAgentPointRecordsQuery } from "@reeka-office/domain-point"

import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/datetime"

type PointGrantRecordsProps = {
  agentCode: string
}

export async function PointGrantRecords({ agentCode }: PointGrantRecordsProps) {
  const pointResult = await new ListAgentPointRecordsQuery({ agentCode }).query()

  if (pointResult.records.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
        暂无发放记录。
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium">积分事项</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">类别</th>
            <th className="px-4 py-2.5 text-right font-medium">积分</th>
            <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">年份</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">发放时间</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">备注</th>
          </tr>
        </thead>
        <tbody>
          {pointResult.records.map((record) => (
            <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-medium">{record.pointItemName}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{record.pointItemCategory}</td>
              <td className="px-4 py-2.5 text-right">
                <Badge variant="secondary">+{record.points}</Badge>
              </td>
              <td className="px-4 py-2.5 text-center text-muted-foreground">{record.occurredYear}</td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">
                {formatDateTime(record.createdAt)}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{record.remark || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
