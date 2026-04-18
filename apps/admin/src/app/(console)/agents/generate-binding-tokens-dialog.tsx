"use client";

import {
  DESIGNATION_NAMES,
  getDesignationName,
} from "@reeka-office/domain-agent";
import { DownloadIcon, KeyRoundIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterBox } from "@/components/ui/filter-box";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { SimpleSelect, type SimpleSelectItem } from "@/components/ui/simple-select";

import { createScopedBindingTokensAction } from "./actions";

const defaultBindingTokenExpiresInHours = 24 * 7;
const scopeModeItems: SimpleSelectItem[] = [
  { value: "division", label: "按分区" },
  { value: "designation", label: "按职级" },
];
const designationFilterItems = DESIGNATION_NAMES.map((item, index) => ({
  value: String(index),
  label: item,
}));

interface GenerateBindingTokensDialogProps {
  divisions: string[];
}

interface BindingTokenItem {
  agentId: number;
  name: string;
  agentCode: string | null;
  division: string | null;
  designation: number | null;
  token: string;
  expiresAt: string;
}

interface ScopedBindingTokenResult {
  mode: "division" | "designation";
  division: string | null;
  designations: number[];
  generatedCount: number;
  tokens: BindingTokenItem[];
  totalCount: number;
  skippedActivatedCount: number;
  skippedExistingTokenCount: number;
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/"/g, "\"\"");
  return `"${normalized}"`;
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
  return value.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-") || "scope";
}

function createCsvContent(result: ScopedBindingTokenResult) {
  const rows = [
    ["agentCode", "name", "token"],
    ...result.tokens.map((item) => [
      item.agentCode ?? "",
      item.name,
      item.token,
    ]),
  ];

  return `\uFEFF${rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n")}`;
}

function getFilenameScope(result: ScopedBindingTokenResult) {
  if (result.mode === "division") {
    return result.division ?? "division";
  }

  return result.designations
    .map((item) => getDesignationName(item) ?? String(item))
    .join("-");
}

function downloadCsv(result: ScopedBindingTokenResult) {
  const blob = new Blob([createCsvContent(result)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = formatTimestampForFilename(new Date());

  link.href = url;
  link.download = `激活码-${sanitizeFilenamePart(getFilenameScope(result))}-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function GenerateBindingTokensDialog({
  divisions,
}: GenerateBindingTokensDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"division" | "designation">("division");
  const [division, setDivision] = useState(divisions[0] ?? "");
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [result, setResult] = useState<ScopedBindingTokenResult | null>(null);
  const selectedDivision = divisions.includes(division) ? division : (divisions[0] ?? "");
  const selectedDesignationValues = useMemo(
    () => [...selectedDesignations].sort((left, right) => Number(left) - Number(right)),
    [selectedDesignations],
  );

  const { execute, reset, isPending } = useAction(createScopedBindingTokensAction, {
    onSuccess: ({ data }) => {
      const nextResult = data as ScopedBindingTokenResult;
      setResult(nextResult);

      if (nextResult.totalCount === 0) {
        toast.success("当前条件下没有可生成的代理人");
        return;
      }

      if (nextResult.tokens.length === 0) {
        toast.success("当前条件下没有可用的激活码");
        return;
      }

      toast.success(
        nextResult.generatedCount > 0
          ? `已整理 ${nextResult.tokens.length} 个激活码，其中新增 ${nextResult.generatedCount} 个`
          : `已整理 ${nextResult.tokens.length} 个激活码`,
      );
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "生成激活码失败");
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
    if (mode === "division" && !selectedDivision) {
      toast.error("请先选择 division");
      return;
    }

    if (mode === "designation" && selectedDesignationValues.length === 0) {
      toast.error("请至少选择一个职级");
      return;
    }

    reset();
    setResult(null);
    execute({
      mode,
      division: mode === "division" ? selectedDivision : undefined,
      designations: mode === "designation"
        ? selectedDesignationValues.map((item) => Number(item))
        : [],
      expiresInHours: defaultBindingTokenExpiresInHours,
    });
  };

  const handleDownload = () => {
    if (!result || result.tokens.length === 0) {
      return;
    }

    downloadCsv(result);
    toast.success("CSV 已开始下载");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <KeyRoundIcon className="size-4" />
            生成激活码
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>批量生成激活码</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FieldGroup className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <Field>
              <FieldContent>
                <FieldLabel>生成方式</FieldLabel>
                <SimpleSelect
                  items={scopeModeItems}
                  value={mode}
                  onValueChange={(value) => setMode((value as "division" | "designation") ?? "division")}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldContent>
                <FieldLabel>{mode === "division" ? "分区" : "职级"}</FieldLabel>
                {mode === "division" ? (
                  <SimpleSelect
                    items={divisions.map((item) => ({ value: item, label: item }))}
                    placeholder={divisions.length > 0 ? "请选择分区" : "暂无分区"}
                    value={selectedDivision}
                    onValueChange={(value) => setDivision(value as string)}
                    triggerClassName="w-full"
                    disabled={divisions.length === 0}
                  />
                ) : (
                  <FilterBox
                    title="选择职级"
                    options={designationFilterItems}
                    value={selectedDesignationValues}
                    onChange={setSelectedDesignations}
                    disabled={designationFilterItems.length === 0}
                    className="w-full justify-start"
                  />
                )}
              </FieldContent>
            </Field>
          </FieldGroup>

          {result ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="text-muted-foreground">
                  以下是当前可用的激活码。
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={result.tokens.length === 0}
                >
                  <DownloadIcon className="size-4" />
                  下载 CSV
                </Button>
              </div>

              {result.tokens.length > 0 ? (
                <div className="max-h-[24rem] overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">代理人编码</th>
                        <th className="px-3 py-2 text-left font-medium">姓名</th>
                        <th className="px-3 py-2 text-left font-medium">激活码</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.tokens.map((item) => (
                        <tr key={item.agentId} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-mono">{item.agentCode ?? "-"}</td>
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2 font-mono font-medium">{item.token}</td>
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
            disabled={isPending || (mode === "division" ? divisions.length === 0 : false)}
          >
            {isPending ? "生成中..." : "生成激活码"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
