import * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyProps extends React.ComponentProps<"div"> {
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  centered?: boolean;
}

export function Empty({
  title,
  description,
  action,
  icon,
  centered = false,
  className,
  ...props
}: EmptyProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm",
        centered &&
          "flex flex-col items-center justify-center px-6 py-8 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-3 text-muted-foreground/70">{icon}</div>
      ) : null}
      <p>{title}</p>
      {description ? <p className="mt-1 text-xs">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
