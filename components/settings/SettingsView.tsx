"use client"

import * as React from "react"

import { ROUTES } from "@/constants/routes"
import type { ConnectionCheckResult, SettingsOverview } from "@/lib/settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "Không xác định"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function SettingsView({
  overview,
  initialConnection,
}: {
  overview: SettingsOverview
  initialConnection: ConnectionCheckResult
}) {
  const [checking, setChecking] = React.useState(false)
  const [result, setResult] = React.useState<ConnectionCheckResult>(initialConnection)

  async function checkNow() {
    setChecking(true)
    try {
      const res = await fetch("/api/settings/check-connection", {
        method: "POST",
      })
      const json = (await res.json()) as ConnectionCheckResult & { error?: string }
      if (!res.ok) {
        setResult({
          ok: false,
          dbOk: false,
          storageOk: false,
          checkedAt: new Date().toISOString(),
          message: json.error ?? "Không thể kiểm tra kết nối.",
        })
        return
      }
      setResult(json)
    } catch {
      setResult({
        ok: false,
        dbOk: false,
        storageOk: false,
        checkedAt: new Date().toISOString(),
        message: "Lỗi mạng khi kiểm tra kết nối.",
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Tình trạng kết nối, storage và thông tin môi trường."
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Cài đặt" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Tổng thương hiệu</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {overview.brandsCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Tổng sản phẩm</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {overview.productsCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-400">Thông báo đang bật</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">
            {overview.notificationsCount}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-sm font-medium text-zinc-100">Kết nối Supabase</h3>
        <p className="mt-2 text-sm text-zinc-300">{result.message}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              result.dbOk
                ? "border-emerald-500/40 text-emerald-300"
                : "border-red-500/40 text-red-300"
            }
          >
            DB: {result.dbOk ? "OK" : "Fail"}
          </Badge>
          <Badge
            variant="outline"
            className={
              result.storageOk
                ? "border-emerald-500/40 text-emerald-300"
                : "border-red-500/40 text-red-300"
            }
          >
            Storage: {result.storageOk ? "OK" : "Fail"}
          </Badge>
          <span className="text-xs text-zinc-500">
            Lần check: {new Date(result.checkedAt).toLocaleString("vi-VN")}
          </span>
        </div>
        <Button
          type="button"
          className="mt-4 bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
          onClick={() => void checkNow()}
          disabled={checking}
        >
          {checking ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-medium text-zinc-100">Storage usage</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Ước tính từ bucket `{overview.storageBucket}`.
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-100">
            {formatBytes(overview.estimatedStorageBytes)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-medium text-zinc-100">System info</h3>
          <div className="mt-2 space-y-1 text-sm text-zinc-300">
            <p>
              Environment: <span className="text-zinc-100">{overview.envName}</span>
            </p>
            <p>
              Supabase host:{" "}
              <span className="font-mono text-zinc-100">{overview.supabaseHost}</span>
            </p>
            <p>
              Dev bypass:{" "}
              <span className="text-zinc-100">
                {overview.devBypass ? "Bật" : "Tắt"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
