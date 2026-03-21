"use client";

import { CopyIcon, KeyRoundIcon } from "lucide-react";
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
import { Field, FieldContent, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { createBindingTokenAction } from "./actions";

interface GenerateBindingTokenDialogProps {
  agentId: number;
  agentCode: string | null;
  agentName: string;
}

export function GenerateBindingTokenDialog({
  agentId,
  agentCode,
  agentName,
}: GenerateBindingTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { execute, reset, result, isPending } = useAction(
    createBindingTokenAction,
    {
      onSuccess: ({ data }) => {
        setToken(data.token);
        setExpiresAt(data.expiresAt);
        toast.success("绑定码已生成");
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "生成绑定码失败");
      },
    },
  );

  const handleGenerate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reset();
    setToken("");
    setExpiresAt("");
    execute({
      agentId,
      expiresInHours: 24,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setToken("");
      setExpiresAt("");
    }
  };

  const handleCopy = async () => {
    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      toast.success("绑定码已复制");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <KeyRoundIcon className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>生成绑定码</DialogTitle>
          <DialogDescription>
            为代理人 {agentName}
            {agentCode ? `（${agentCode}）` : ""}{" "}
            生成一次性绑定码。生成后可直接发给用户
          </DialogDescription>
        </DialogHeader>

        <form
          id="generate-binding-token-form"
          onSubmit={handleGenerate}
          className="space-y-4"
        >
          <Field>
            <FieldContent>
              <div className="flex items-center gap-2">
                <Input value={token} disabled placeholder="点击下方按钮生成" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  disabled={!token}
                  aria-label="复制绑定码"
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
              <FieldDescription>
                {expiresAt &&
                  `过期时间：${new Date(expiresAt).toLocaleString("zh-CN", { hour12: false })}`}
              </FieldDescription>
            </FieldContent>
          </Field>
        </form>

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
            type="submit"
            form="generate-binding-token-form"
            disabled={isPending}
          >
            {isPending ? "生成中..." : "生成绑定码"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
