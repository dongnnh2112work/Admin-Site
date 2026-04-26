"use client"

import type { AppUser, BrandOption } from "@/lib/types"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BottomTabBar } from "@/components/layout/BottomTabBar"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

export function AppShell({
  user,
  brands,
  children,
}: {
  user: AppUser
  brands: BrandOption[]
  children: React.ReactNode
}) {
  return (
    <TooltipProvider delay={300}>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-950 md:flex-row">
        <Sidebar user={user} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar user={user} brands={brands} />
          <main className="flex-1 overflow-y-auto p-4 text-zinc-50 md:p-6">
            {children}
          </main>
          <BottomTabBar user={user} brands={brands} />
        </div>
      </div>
    </TooltipProvider>
  )
}
