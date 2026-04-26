"use client"

import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import { ROUTES } from "@/constants/routes"
import type { DashboardData } from "@/lib/dashboard"
import type { AppUser } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventCountdown } from "@/components/shared/EventCountdown"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { StorageWarning } from "@/components/shared/StorageWarning"
import { cn } from "@/lib/utils"

function auditSummary(action: string, table: string | null): string {
  return `${action} · ${table ?? "—"}`
}

export function DashboardView({
  user,
  data,
}: {
  user: AppUser
  data: DashboardData
}) {
  const superUser = user.role === "super_admin"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan nhanh thương hiệu, sản phẩm và hoạt động gần đây."
        breadcrumbs={[{ label: "Tổng quan", href: ROUTES.dashboard }]}
      />

      <div className="flex flex-col gap-3">
        {data.storageUsedBytes != null ? (
          <StorageWarning usedBytes={data.storageUsedBytes} />
        ) : null}
        {data.nextEventBrand ? (
          <EventCountdown
            eventDate={data.nextEventBrand.event_date}
            eventName={data.nextEventBrand.event_name}
          />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Thương hiệu" value={data.brandsCount} />
        <StatCard label="Sản phẩm" value={data.productsCount} />
        <StatCard
          label="Thông báo đang bật"
          value={data.activeNotificationsCount}
        />
        <StatCard
          label="Bản ghi nhật ký"
          value={data.showAuditSection ? data.auditLogCount : "—"}
          subtext={
            data.showAuditSection
              ? undefined
              : "Bạn không có quyền xem nhật ký chi tiết."
          }
          subtextTone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-zinc-100">
              Thương hiệu gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentBrands.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có dữ liệu.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {data.recentBrands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={ROUTES.brand(b.id)}
                      className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-[#E8FF47]"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full ring-1 ring-zinc-600"
                        style={{
                          backgroundColor: b.primary_color ?? "#52525b",
                        }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {b.name}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {b.slug}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          b.is_active
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-700 text-zinc-400"
                        )}
                      >
                        {b.is_active ? "Hoạt động" : "Tắt"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={ROUTES.brands}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 w-full border-zinc-700"
              )}
            >
              Xem tất cả thương hiệu
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-zinc-100">
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.showAuditSection ? (
              <p className="text-sm text-zinc-400">
                Vai trò của bạn không xem được nhật ký hệ thống.
              </p>
            ) : data.recentAuditLogs.length === 0 ? (
              <p className="text-sm text-zinc-400">Chưa có hoạt động.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentAuditLogs.map((log) => (
                  <li
                    key={log.id}
                    className="border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-zinc-200">
                      {auditSummary(log.action, log.table_name)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {data.showAuditSection && superUser ? (
              <Link
                href={ROUTES.auditLog}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-4 w-full border-zinc-700"
                )}
              >
                Mở nhật ký đầy đủ
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
