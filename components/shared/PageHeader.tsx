import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type PageHeaderBreadcrumbItem = {
  label: string
  href?: string
}

export type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: PageHeaderBreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-zinc-800 pb-4 md:flex-row md:items-start md:justify-between md:gap-4",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {breadcrumbs?.length ? (
          <nav
            className="flex flex-wrap items-center gap-1 text-xs text-zinc-500"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((item, i) => {
              const isLast = i === breadcrumbs.length - 1
              return (
                <span key={`${item.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? (
                    <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
                  ) : null}
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="truncate text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "truncate",
                        isLast ? "font-medium text-zinc-300" : "text-zinc-500"
                      )}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </span>
              )
            })}
          </nav>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50 md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-zinc-400 md:max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
