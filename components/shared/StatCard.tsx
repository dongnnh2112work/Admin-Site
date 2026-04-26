import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export type StatCardTone = "default" | "success" | "warning" | "danger"

const subtextToneClass: Record<StatCardTone, string> = {
  default: "text-zinc-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
}

export type StatCardProps = {
  label: string
  value: string | number
  subtext?: string
  /** Màu dòng phụ (trend / gợi ý) */
  subtextTone?: StatCardTone
  className?: string
}

export function StatCard({
  label,
  value,
  subtext,
  subtextTone = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900/60 text-zinc-50 shadow-none",
        className
      )}
    >
      <CardHeader className="pb-1">
        <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
          {label}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold tabular-nums text-zinc-50 md:text-3xl">
          {value}
        </p>
        {subtext ? (
          <p
            className={cn(
              "mt-1 text-sm",
              subtextToneClass[subtextTone]
            )}
          >
            {subtext}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
