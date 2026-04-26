"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Building2,
  LayoutDashboard,
  Package,
  Settings,
  Store,
} from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import type { AppUser, BrandOption } from "@/lib/types"

function navItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function brandIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/brands\/([^/]+)/)
  return m?.[1] ?? null
}

type TabDef = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

export function BottomTabBar({
  user,
  brands,
}: {
  user: AppUser
  brands: BrandOption[]
}) {
  const pathname = usePathname()
  const pathBrandId = brandIdFromPath(pathname)
  const primaryBrandId =
    pathBrandId ?? user.brand_id ?? brands[0]?.id ?? null

  const productsHref = primaryBrandId
    ? ROUTES.brandProducts(primaryBrandId)
    : ROUTES.brands
  const notifHref = primaryBrandId
    ? ROUTES.brandNotifications(primaryBrandId)
    : ROUTES.brands
  const fifthHref =
    user.role === "super_admin"
      ? ROUTES.settings
      : primaryBrandId
        ? ROUTES.brand(primaryBrandId)
        : ROUTES.brands
  const fifthLabel =
    user.role === "super_admin" ? "Hệ thống" : "Chi tiết TH"
  const FifthIcon = user.role === "super_admin" ? Settings : Store

  const tabs: TabDef[] = [
    { href: ROUTES.dashboard, label: "Tổng quan", icon: LayoutDashboard },
    { href: ROUTES.brands, label: "Thương hiệu", icon: Building2 },
    { href: productsHref, label: "Sản phẩm", icon: Package },
    { href: notifHref, label: "Thông báo", icon: Bell },
    { href: fifthHref, label: fifthLabel, icon: FifthIcon },
  ]

  return (
    <nav
      className="flex shrink-0 border-t border-zinc-800 bg-zinc-900 md:hidden"
      aria-label="Điều hướng dưới cùng"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = navItemActive(pathname, tab.href)
        return (
          <Link
            key={`${tab.href}-${tab.label}`}
            href={tab.href}
            className={cn(
              "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
              active
                ? "text-[#E8FF47]"
                : "text-zinc-500 hover:text-zinc-300"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="line-clamp-2 w-full text-center leading-tight">
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
