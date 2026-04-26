import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  /** Nút chính (tuỳ chọn) — hoặc truyền `children` để tự dựng hành động */
  actionLabel?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  )
}
