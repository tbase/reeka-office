"use client";

import { DownloadIcon, KeyRoundIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createDivisionBindingTokensAction } from "./actions";

const defaultBindingTokenExpiresInHours = 24 * 7;

interface DivisionBindingTokenDialogProps {
  triggerAgentId: number;
  triggerAgentName: string;
  division: string;
}

interface GeneratedBindingTokenItem {
  agentId: number;
  name: string;
  agentCode: string | null;
  token: string;
  expiresAt: string;
}

interface DivisionBindingTokenResult {
  division: string;
  generated: GeneratedBindingTokenItem[];
  skippedCount: number;
  totalCount: number;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

function createCsvContent(result: DivisionBindingTokenResult) {
  const rows = [
    ["division", "name", "agentCode", "token", "expiresAt"],
    ...result.generated.map((item) => [
      result.division,
      item.name,
      item.agentCode ?? "",
      item.token,
      item.expiresAt,
    ]),
  ];

  return `\uFEFF${rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n")}`;
}

function formatTimestampForFilename(date: Date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ];

  return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`;
}

function sanitizeFilenamePart(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-") || "division";
}

function downloadCsv(result: DivisionBindingTokenResult) {
  const blob = new Blob([createCsvContent(result)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = formatTimestampForFilename(new Date());

  link.href = url;
  link.download = `binding-tokens-${sanitizeFilenamePart(result.division)}-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DivisionBindingTokenDialog({
  triggerAgentId,
  triggerAgentName,
  division,
}: DivisionBindingTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DivisionBindingTokenResult | null>(null);

  const generatedCount = result?.generated.length ?? 0;
  let summaryText = `将为 ${division} 分区内尚未激活的代理人批量生成绑定码。`;

  if (result) {
    if (generatedCount === 0) {
      summaryText = `该分区成员均已激活，本次跳过 ${result.skippedCount} 人。`;
    } else {
      summaryText = `本次生成 ${generatedCount} 人，跳过 ${result.skippedCount} 人。`;
    }
  }

  const { execute, reset, isPending } = useAction(createDivisionBindingTokensAction, {
    onSuccess: ({ data }) => {
      const nextResult = data as DivisionBindingTokenResult;
      setResult(nextResult);

      if (nextResult.generated.length === 0) {
        toast.success("该分区成员均已激活，无需生成");
        return;
      }

      downloadCsv(nextResult);
      toast.success(`已生成 ${nextResult.generated.length} 个绑定码，并开始下载 CSV`);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "批量生成绑定码失败");
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset();
      setResult(null);
    }
  };

  const handleGenerate = () => {
    reset();
    setResult(null);
    execute({
      triggerAgentId,
      expiresInHours: defaultBindingTokenExpiresInHours,
    });
  };

  const handleDownload = () => {
    if (!result || result.generated.length === 0) {
      return;
    }

    downloadCsv(result);
    toast.success("CSV 已开始下载");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            title={`按 ${division} 分区批量生成绑定码`}
          >
            <KeyRoundIcon className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>批量生成分区绑定码</DialogTitle>
          <DialogDescription>
            为代理人 {triggerAgentName} 所在的 {division} 分区批量生成绑定码。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
            <div className="font-medium">{division}</div>
            <div className="text-muted-foreground mt-1">{summaryText}</div>
          </div>

          {result ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="text-muted-foreground">
                  总人数 {result.totalCount}，已生成 {generatedCount}，跳过 {result.skippedCount}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={generatedCount === 0}
                >
                  <DownloadIcon className="size-4" />
                  下载 CSV
                </Button>
              </div>

              {generatedCount > 0 ? (
                <div className="max-h-[24rem] overflow-auto rounded-lg border">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">姓名</th>
                        <th className="px-3 py-2 text-left font-medium">代理人编码</th>
                        <th className="px-3 py-2 text-left font-medium">绑定码</th>
                        <th className="px-3 py-2 text-left font-medium">过期时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.generated.map((item) => (
                        <tr key={item.agentId} className="border-b last:border-b-0">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 font-mono">{item.agentCode ?? "-"}</td>
                          <td className="px-3 py-2 font-mono font-medium">{item.token}</td>
                          <td className="px-3 py-2">{formatDateTime(item.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            关闭
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
          >
            {isPending ? "生成中..." : "生成并下载 CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
