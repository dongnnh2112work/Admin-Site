"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Check, ChevronsUpDown, LogOut } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { AppUser, BrandOption } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function roleLabel(role: AppUser["role"]): string {
  switch (role) {
    case "super_admin":
      return "Quản trị hệ thống"
    case "brand_admin":
      return "Quản lý thương hiệu"
    case "brand_editor":
      return "Biên tập viên"
    default:
      return role
  }
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase() || "?"
}

function brandIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/brands\/([^/]+)/)
  return m?.[1] ?? null
}

export function TopBar({
  user,
  brands,
}: {
  user: AppUser
  brands: BrandOption[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const pathBrandId = brandIdFromPath(pathname)
  const fallbackId = user.brand_id ?? brands[0]?.id ?? null
  const effectiveBrandId = pathBrandId ?? fallbackId
  const selectedBrand =
    brands.find((b) => b.id === (pathBrandId ?? fallbackId)) ??
    brands.find((b) => b.id === effectiveBrandId) ??
    brands[0] ??
    null

  const notifHref = effectiveBrandId
    ? ROUTES.brandNotifications(effectiveBrandId)
    : ROUTES.brands

  async function handleLogout() {
    if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      await fetch("/api/dev-session", { method: "DELETE" })
      router.push(ROUTES.login)
      router.refresh()
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(ROUTES.login)
    router.refresh()
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800",
        "bg-zinc-900/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 md:px-4"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {user.role === "super_admin" && brands.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 max-w-[min(100%,280px)] justify-between border-zinc-700 bg-zinc-950 px-2 text-zinc-50 md:max-w-xs"
                  aria-label="Chọn thương hiệu"
                >
                  <span className="truncate text-left text-sm font-medium">
                    {selectedBrand?.name ?? "Chọn thương hiệu"}
                  </span>
                  <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] border-zinc-700 bg-zinc-900 text-zinc-50"
              align="start"
            >
              <DropdownMenuLabel className="text-zinc-400">
                Thương hiệu
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-700" />
              {brands.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  className="cursor-pointer gap-2 focus:bg-zinc-800 focus:text-zinc-50"
                  onSelect={() => router.push(ROUTES.brand(b.id))}
                >
                  <span className="flex-1 truncate">{b.name}</span>
                  {selectedBrand?.id === b.id ? (
                    <Check className="size-4 shrink-0 text-[#E8FF47]" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="min-w-0 truncate text-sm font-medium text-zinc-100">
            {selectedBrand?.name ?? "Chưa có thương hiệu"}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        nativeButton={false}
        render={(props) => (
          <Link
            {...props}
            href={notifHref}
            aria-label="Thông báo"
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg",
              props.className
            )}
          >
            <Bell className="size-5" />
          </Link>
        )}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5 text-zinc-100 hover:bg-zinc-800"
              aria-label="Tài khoản"
            >
              <Avatar className="size-8 border border-zinc-700">
                <AvatarFallback className="bg-zinc-800 text-xs font-medium text-[#E8FF47]">
                  {initialsFromEmail(user.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent
          className="w-56 border-zinc-700 bg-zinc-900 text-zinc-50"
          align="end"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{user.email}</span>
              <span className="text-xs font-normal text-zinc-400">
                {roleLabel(user.role)}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-red-400 focus:bg-red-950/50 focus:text-red-300"
            onSelect={(e) => {
              e.preventDefault()
              void handleLogout()
            }}
          >
            <LogOut className="size-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
