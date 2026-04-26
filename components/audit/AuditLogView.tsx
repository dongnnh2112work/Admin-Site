"use client"

import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import type { BrandOption } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type AuditViewRow = {
  id: string
  created_at: string
  action: string
  table_name: string | null
  record_id: string | null
  brand_id: string | null
  brand_name: string
  user_id: string | null
  ip_address: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}

function actionDescription(action: string): string {
  if (action.includes("create")) return "Tạo mới dữ liệu"
  if (action.includes("update")) return "Cập nhật dữ liệu"
  if (action.includes("delete")) return "Xóa dữ liệu"
  if (action.includes("publish")) return "Đăng nội dung"
  if (action.includes("archive")) return "Lưu trữ nội dung"
  return "Thao tác quản trị"
}

function actionBadgeClass(action: string): string {
  if (action.includes("create")) return "border-emerald-500/40 text-emerald-300"
  if (action.includes("update")) return "border-sky-500/40 text-sky-300"
  if (action.includes("delete")) return "border-red-500/40 text-red-300"
  return "border-zinc-600 text-zinc-300"
}

function toPrettyJson(v: Record<string, unknown> | null): string {
  if (!v) return "null"
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return "[Invalid JSON]"
  }
}

type DateFilter = "all" | "7d" | "30d" | "custom"

export function AuditLogView({
  rows,
  brands,
}: {
  rows: AuditViewRow[]
  brands: BrandOption[]
}) {
  const [brandFilter, setBrandFilter] = React.useState<string>("all")
  const [actionFilter, setActionFilter] = React.useState<string>("all")
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("30d")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [nowMs] = React.useState(() => Date.now())

  const uniqueActions = React.useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.action))).sort((a, b) =>
      a.localeCompare(b, "vi")
    )
  }, [rows])

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      if (brandFilter !== "all" && r.brand_id !== brandFilter) return false
      if (actionFilter !== "all" && r.action !== actionFilter) return false
      const ts = new Date(r.created_at).getTime()
      if (dateFilter === "7d") {
        if (ts < nowMs - 7 * 24 * 60 * 60 * 1000) return false
      } else if (dateFilter === "30d") {
        if (ts < nowMs - 30 * 24 * 60 * 60 * 1000) return false
      } else if (dateFilter === "custom") {
        const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
        const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null
        if (from !== null && ts < from) return false
        if (to !== null && ts > to) return false
      }
      return true
    })
  }, [rows, brandFilter, actionFilter, dateFilter, fromDate, toDate, nowMs])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nhật ký hoạt động"
        subtitle="Theo dõi thao tác dữ liệu của quản trị viên."
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Nhật ký hoạt động" },
        ]}
      />

      <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">Thương hiệu</p>
          <Select
            value={brandFilter}
            onValueChange={(value) => setBrandFilter(value ?? "all")}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
              <SelectItem value="all">Tất cả thương hiệu</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">Hành động</p>
          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value ?? "all")}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
              <SelectItem value="all">Tất cả hành động</SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">Khoảng thời gian</p>
          <Select
            value={dateFilter}
            onValueChange={(v) => setDateFilter(v as DateFilter)}
          >
            <SelectTrigger className="border-zinc-700 bg-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
              <SelectItem value="all">Toàn thời gian</SelectItem>
              <SelectItem value="7d">7 ngày gần đây</SelectItem>
              <SelectItem value="30d">30 ngày gần đây</SelectItem>
              <SelectItem value="custom">Tùy chọn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            className="w-full border-zinc-700"
            onClick={() => {
              setBrandFilter("all")
              setActionFilter("all")
              setDateFilter("30d")
              setFromDate("")
              setToDate("")
            }}
          >
            Reset bộ lọc
          </Button>
        </div>
        {dateFilter === "custom" ? (
          <>
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">Từ ngày</p>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">Đến ngày</p>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead />
              <TableHead>Thời gian</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Bảng</TableHead>
              <TableHead>Thương hiệu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const expanded = expandedId === r.id
              return (
                <React.Fragment key={r.id}>
                  <TableRow className="border-zinc-800">
                    <TableCell>
                      <button
                        type="button"
                        className="inline-flex items-center text-zinc-400 hover:text-zinc-100"
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        aria-label="Mở chi tiết"
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-300">
                      {new Date(r.created_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(actionBadgeClass(r.action))}
                      >
                        {r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-200">
                      {actionDescription(r.action)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-400">
                      {r.table_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      {r.brand_name}
                    </TableCell>
                  </TableRow>
                  {expanded ? (
                    <TableRow className="border-zinc-800 bg-zinc-950/40">
                      <TableCell colSpan={6}>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-400">Record ID</p>
                            <p className="font-mono text-xs text-zinc-200">
                              {r.record_id ?? "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-400">User ID</p>
                            <p className="font-mono text-xs text-zinc-200">
                              {r.user_id ?? "—"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-400">IP Address</p>
                            <p className="font-mono text-xs text-zinc-200">
                              {r.ip_address ?? "—"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs text-zinc-400">Old data</p>
                            <pre className="max-h-48 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 text-[11px] text-zinc-300">
                              {toPrettyJson(r.old_data)}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-zinc-400">New data</p>
                            <pre className="max-h-48 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 text-[11px] text-zinc-300">
                              {toPrettyJson(r.new_data)}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              )
            })}
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="py-8 text-center text-zinc-400">
                  Không có bản ghi phù hợp.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
