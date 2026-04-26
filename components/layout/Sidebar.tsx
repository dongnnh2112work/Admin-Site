"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ROUTES } from "@/constants/routes"
import { filterNavByRole, SIDEBAR_NAV } from "@/constants/navigation"
import type { AppUser } from "@/lib/types"
import { cn } from "@/lib/utils"

function navItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const items = filterNavByRole(SIDEBAR_NAV, user.role)

  return (
    <aside
      className={cn(
        "group/sidebar hidden shrink-0 flex-col overflow-hidden border-r border-[var(--hs-gray-700)] bg-[var(--hs-black)]",
        "w-11 transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:w-52 focus-within:w-52",
        "md:flex"
      )}
      aria-label="Thanh điều hướng chính"
    >
      <nav className="flex flex-1 flex-col gap-1 py-3 px-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = navItemActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 w-full min-w-0 items-center rounded-md outline-none transition-[gap,justify-content,padding]",
                "justify-center gap-0 px-0",
                "group-hover/sidebar:justify-start group-hover/sidebar:gap-2 group-hover/sidebar:px-2",
                "group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-2 group-focus-within/sidebar:px-2",
                "focus-visible:ring-2 focus-visible:ring-[var(--hs-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hs-black)]",
                active
                  ? "bg-[rgba(232,255,71,0.12)] text-[var(--hs-accent)]"
                  : "text-[var(--hs-gray-400)] hover:bg-[var(--hs-gray-800)] hover:text-[var(--hs-white)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span
                className={cn(
                  "min-w-0 truncate text-left text-[13px] font-medium text-inherit",
                  "max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "group-hover/sidebar:max-w-[11rem] group-hover/sidebar:opacity-100",
                  "group-focus-within/sidebar:max-w-[11rem] group-focus-within/sidebar:opacity-100"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
