import { type ReactNode } from "react"

function TabButton({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border px-3 py-2.5 text-left transition-all",
        active
          ? "border-orange-300 bg-orange-50 shadow-sm"
          : "border-border/60 bg-background/80 hover:border-orange-200 hover:bg-accent/70",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={active ? "text-orange-600" : "text-muted-foreground"}>{icon}</span>
        <span>{title}</span>
      </div>
    </button>
  )
}

export { TabButton }
