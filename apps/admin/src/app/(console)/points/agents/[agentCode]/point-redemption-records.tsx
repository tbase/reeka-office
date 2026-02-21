import { ListAgentRedemptionRecordsQuery } from "@reeka-office/domain-point"

import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/datetime"

type PointRedemptionRecordsProps = {
  agentCode: string
}

export async function PointRedemptionRecords({
  agentCode,
}: PointRedemptionRecordsProps) {
  const redemptionResult = await new ListAgentRedemptionRecordsQuery({ agentCode }).query()

  if (redemptionResult.records.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
        暂无兑换记录。
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium">兑换商品</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">类别</th>
            <th className="px-4 py-2.5 text-right font-medium">消耗积分</th>
            <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">状态</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">兑换时间</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">备注</th>
          </tr>
        </thead>
        <tbody>
          {redemptionResult.records.map((record) => (
            <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-medium">{record.productTitle}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{record.redeemCategory}</td>
              <td className="px-4 py-2.5 text-right">
                <Badge variant="outline">-{record.pointsCost}</Badge>
              </td>
              <td className="px-4 py-2.5 text-center">
                {record.status === "success" ? (
                  <Badge variant="secondary">成功</Badge>
                ) : (
                  <Badge variant="destructive">已取消</Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">
                {formatDateTime(record.redeemedAt)}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{record.remark || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
