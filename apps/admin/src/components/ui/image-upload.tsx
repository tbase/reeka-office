"use client";

import {
  ImagePlusIcon,
  Loader2Icon,
  Trash2Icon,
  ZoomInIcon,
} from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as { path?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "上传失败");
  }

  const path = data.path?.trim().replace(/^\/+/, "") ?? "";

  if (!path) {
    throw new Error("服务器未返回文件路径");
  }

  return path;
}

type CommonProps = {
  id?: string;
  alt?: string;
  disabled?: boolean;
  className?: string;
  onError?: (err: Error) => void;
};

type SingleProps = CommonProps & {
  multiple?: false;
  value?: string;
  onChangeAction: (nextValue: string) => void;
};

type MultipleProps = CommonProps & {
  multiple: true;
  value?: string[];
  onChangeAction: (nextValue: string[]) => void;
};

function PickerContent({
  uploading,
  label,
}: {
  uploading: boolean;
  label: string;
}) {
  return (
    <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
      {uploading ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          上传中…
        </>
      ) : (
        <>
          <ImagePlusIcon className="size-4" />
          {label}
        </>
      )}
    </div>
  );
}

function RemoveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label="删除图片"
      className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 disabled:cursor-not-allowed"
    >
      <Trash2Icon className="size-3" />
    </button>
  );
}

function PreviewButton({ src }: { src: string }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label="预览大图"
      className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100"
    >
      <ZoomInIcon className="size-3" />
    </a>
  );
}

export function ImageUpload(props: SingleProps): React.ReactElement;
export function ImageUpload(props: MultipleProps): React.ReactElement;
export function ImageUpload(
  props: SingleProps | MultipleProps,
): React.ReactElement {
  const { id, alt, disabled, className, onError } = props;

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      if (props.multiple) {
        const paths = await Promise.all(files.map(uploadFile));
        props.onChangeAction([...(props.value ?? []), ...paths]);
      } else {
        const path = await uploadFile(files[0]!);
        props.onChangeAction(path);
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("上传失败"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  if (props.multiple) {
    const values = props.value ?? [];

    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={disabled || uploading}
          onChange={handleChange}
        />

        {values.map((src, index) => {
          const imgAlt = alt ? `${alt} ${index + 1}` : `图片 ${index + 1}`;
          return (
            <div key={index} className="group relative aspect-square w-28">
              <div className="bg-muted/40 relative h-full w-full overflow-hidden rounded-md border">
                <Image
                  src={`/${src}`}
                  alt={imgAlt}
                  unoptimized
                  fill
                  className="object-cover"
                />
              </div>
              {!uploading && (
                <>
                  <RemoveButton
                    onClick={() =>
                      props.onChangeAction(values.filter((_, i) => i !== index))
                    }
                    disabled={disabled}
                  />
                  <PreviewButton src={`/${src}`} />
                </>
              )}
            </div>
          );
        })}

        <div className="aspect-square w-28">
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || uploading}
            className="bg-muted/40 hover:bg-muted/60 h-full w-full overflow-hidden rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PickerContent uploading={uploading} label="添加图片" />
          </button>
        </div>
      </div>
    );
  }

  const value = props.value;
  const hasImage = Boolean(value?.trim());

  return (
    <div className={cn("inline-block", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={handleChange}
      />

      <div className="group relative aspect-square w-28">
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || uploading}
          className="bg-muted/40 hover:bg-muted/60 relative h-full w-full overflow-hidden rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {!uploading && hasImage ? (
            <Image
              src={`/${value}`}
              alt={alt ?? "上传图片"}
              unoptimized
              fill
              className="object-cover"
            />
          ) : (
            <PickerContent uploading={uploading} label="上传图片" />
          )}
        </button>

        {hasImage && !uploading && (
          <>
            <RemoveButton
              onClick={() => props.onChangeAction("")}
              disabled={disabled}
            />
            <PreviewButton src={`/${value}`} />
          </>
        )}
      </div>
    </div>
  );
}
