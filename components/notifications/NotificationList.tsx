"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared/PageHeader"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ROUTES } from "@/constants/routes"
import type { NotificationLevel, NotificationRow } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ScopeFilter = "all" | "brand" | "global"
type StatusFilter = "all" | "active" | "inactive"

type NotificationFormState = {
  id: string | null
  scope: "brand" | "global"
  level: NotificationLevel
  title: string
  body: string
  cta_label: string
  cta_url: string
  show_from: string
  show_until: string
  is_active: boolean
}

const defaultForm: NotificationFormState = {
  id: null,
  scope: "brand",
  level: "info",
  title: "",
  body: "",
  cta_label: "",
  cta_url: "",
  show_from: "",
  show_until: "",
  is_active: true,
}

function levelLabel(level: NotificationLevel): string {
  switch (level) {
    case "success":
      return "Thành công"
    case "warning":
      return "Cảnh báo"
    case "error":
      return "Lỗi"
    default:
      return "Thông tin"
  }
}

function levelClass(level: NotificationLevel): string {
  switch (level) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    case "warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300"
    case "error":
      return "border-rose-500/30 bg-rose-500/10 text-rose-300"
    default:
      return "border-sky-500/30 bg-sky-500/10 text-sky-300"
  }
}

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000
  const local = new Date(d.getTime() - tzOffsetMs)
  return local.toISOString().slice(0, 16)
}

function toIso(input: string): string | null {
  if (!input.trim()) return null
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function isNowVisible(n: NotificationRow, nowMs: number): boolean {
  const fromMs = n.show_from ? new Date(n.show_from).getTime() : null
  const untilMs = n.show_until ? new Date(n.show_until).getTime() : null
  const passFrom = fromMs === null || nowMs >= fromMs
  const passUntil = untilMs === null || nowMs <= untilMs
  return passFrom && passUntil
}

export function NotificationList({
  brandId,
  brandName,
  initialNotifications,
  currentUserId,
  allowGlobalScope,
  readOnly,
}: {
  brandId: string
  brandName: string
  initialNotifications: NotificationRow[]
  currentUserId: string
  allowGlobalScope: boolean
  readOnly: boolean
}) {
  const router = useRouter()
  const [banner, setBanner] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [scopeFilter, setScopeFilter] = React.useState<ScopeFilter>("all")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<NotificationFormState>(defaultForm)
  const [saving, setSaving] = React.useState(false)

  const [nowMs] = React.useState(() => Date.now())
  const stats = React.useMemo(() => {
    let active = 0
    let scheduled = 0
    let expired = 0
    for (const n of initialNotifications) {
      if (n.is_active) active += 1
      const fromMs = n.show_from ? new Date(n.show_from).getTime() : null
      const untilMs = n.show_until ? new Date(n.show_until).getTime() : null
      if (fromMs !== null && fromMs > nowMs) scheduled += 1
      if (untilMs !== null && untilMs < nowMs) expired += 1
    }
    return {
      total: initialNotifications.length,
      active,
      scheduled,
      expired,
    }
  }, [initialNotifications, nowMs])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return initialNotifications.filter((n) => {
      if (scopeFilter === "brand" && n.brand_id === null) return false
      if (scopeFilter === "global" && n.brand_id !== null) return false
      if (statusFilter === "active" && !n.is_active) return false
      if (statusFilter === "inactive" && n.is_active) return false
      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        (n.body?.toLowerCase().includes(q) ?? false) ||
        levelLabel(n.level).toLowerCase().includes(q)
      )
    })
  }, [initialNotifications, search, scopeFilter, statusFilter])

  function openCreateDialog() {
    setForm({
      ...defaultForm,
      scope: allowGlobalScope ? "brand" : "brand",
    })
    setDialogOpen(true)
  }

  function openEditDialog(n: NotificationRow) {
    setForm({
      id: n.id,
      scope: n.brand_id === null ? "global" : "brand",
      level: n.level,
      title: n.title,
      body: n.body ?? "",
      cta_label: n.cta_label ?? "",
      cta_url: n.cta_url ?? "",
      show_from: toLocalDateTimeInput(n.show_from),
      show_until: toLocalDateTimeInput(n.show_until),
      is_active: n.is_active,
    })
    setDialogOpen(true)
  }

  async function toggleActive(n: NotificationRow, next: boolean) {
    setBusyId(n.id)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("notifications")
        .update({ is_active: next })
        .eq("id", n.id)
      if (error) {
        setBanner(error.message || "Không cập nhật được trạng thái.")
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function saveDialog() {
    if (!form.title.trim()) {
      setBanner("Vui lòng nhập tiêu đề thông báo.")
      return
    }
    if (form.cta_label.trim() && !form.cta_url.trim()) {
      setBanner("CTA có nhãn thì cần URL.")
      return
    }
    const fromIso = toIso(form.show_from)
    const untilIso = toIso(form.show_until)
    if (fromIso && untilIso && new Date(fromIso) > new Date(untilIso)) {
      setBanner("show_from phải sớm hơn show_until.")
      return
    }
    setSaving(true)
    setBanner(null)
    try {
      const payload = {
        brand_id: form.scope === "global" ? null : brandId,
        level: form.level,
        title: form.title.trim(),
        body: form.body.trim() || null,
        cta_label: form.cta_label.trim() || null,
        cta_url: form.cta_url.trim() || null,
        show_from: fromIso,
        show_until: untilIso,
        is_active: form.is_active,
      }
      const supabase = createClient()
      if (form.id) {
        const { error } = await supabase
          .from("notifications")
          .update(payload)
          .eq("id", form.id)
        if (error) {
          setBanner(error.message || "Không cập nhật được thông báo.")
          return
        }
      } else {
        const { error } = await supabase.from("notifications").insert({
          ...payload,
          created_by: currentUserId,
        })
        if (error) {
          setBanner(error.message || "Không tạo được thông báo.")
          return
        }
      }
      setDialogOpen(false)
      setForm(defaultForm)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thông báo"
        subtitle={brandName}
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Thương hiệu", href: ROUTES.brands },
          { label: brandName, href: ROUTES.brand(brandId) },
          { label: "Thông báo" },
        ]}
        actions={
          !readOnly ? (
            <Button
              type="button"
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              onClick={openCreateDialog}
            >
              <Plus className="mr-1 size-4" />
              Tạo thông báo
            </Button>
          ) : null
        }
      />

      {readOnly ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          Bạn chỉ có quyền xem thông báo. Liên hệ quản lý để chỉnh sửa.
        </p>
      ) : null}

      {banner ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {banner}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <div className="text-xs text-zinc-400">Tổng số</div>
          <div className="text-xl font-semibold text-zinc-100">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <div className="text-xs text-zinc-400">Đang bật</div>
          <div className="text-xl font-semibold text-emerald-300">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <div className="text-xs text-zinc-400">Sắp hiển thị</div>
          <div className="text-xl font-semibold text-sky-300">{stats.scheduled}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
          <div className="text-xs text-zinc-400">Đã hết hạn</div>
          <div className="text-xl font-semibold text-amber-300">{stats.expired}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề, nội dung..."
          className="border-zinc-700 bg-zinc-950"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                statusFilter === k
                  ? "border-[#E8FF47] bg-[#E8FF47]/10 text-[#E8FF47]"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              )}
            >
              {k === "all" ? "Tất cả trạng thái" : k === "active" ? "Đang bật" : "Đang tắt"}
            </button>
          ))}
          {allowGlobalScope ? (
            <>
              {(["all", "brand", "global"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setScopeFilter(k)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    scopeFilter === k
                      ? "border-[#E8FF47] bg-[#E8FF47]/10 text-[#E8FF47]"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  )}
                >
                  {k === "all"
                    ? "Mọi phạm vi"
                    : k === "brand"
                      ? "Theo thương hiệu"
                      : "Toàn hệ thống"}
                </button>
              ))}
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Mức</TableHead>
              <TableHead>Lịch hiển thị</TableHead>
              <TableHead>CTA</TableHead>
              <TableHead>Phạm vi</TableHead>
              <TableHead className="text-right">Bật/Tắt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((n) => (
              <TableRow
                key={n.id}
                className="cursor-pointer border-zinc-800 hover:bg-zinc-800/40"
                onClick={() => {
                  if (!readOnly) openEditDialog(n)
                }}
              >
                <TableCell className="max-w-[320px]">
                  <div className="font-medium text-zinc-100">{n.title}</div>
                  <div className="line-clamp-2 text-xs text-zinc-400">
                    {n.body ?? "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", levelClass(n.level))}>
                    {levelLabel(n.level)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-300">
                  <div>
                    Từ:{" "}
                    {n.show_from
                      ? new Date(n.show_from).toLocaleString("vi-VN")
                      : "Ngay lập tức"}
                  </div>
                  <div>
                    Đến:{" "}
                    {n.show_until
                      ? new Date(n.show_until).toLocaleString("vi-VN")
                      : "Không giới hạn"}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    {isNowVisible(n, nowMs) ? "Đang trong khung hiển thị" : "Ngoài khung hiển thị"}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-zinc-300">
                  {n.cta_label ? (
                    <span>
                      {n.cta_label}
                      {n.cta_url ? ` → ${n.cta_url}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border",
                      n.brand_id
                        ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-300"
                    )}
                  >
                    {n.brand_id ? "Brand" : "Global"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end">
                    <Switch
                      checked={n.is_active}
                      disabled={readOnly || busyId === n.id}
                      onCheckedChange={(next) => {
                        void toggleActive(n, next)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="py-8 text-center text-zinc-400">
                  Không có thông báo nào khớp bộ lọc.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900 text-zinc-50">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Cập nhật thông báo" : "Tạo thông báo mới"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Thiết lập lịch hiển thị, CTA và mức độ thông báo trong dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notif-title">Tiêu đề</Label>
              <Input
                id="notif-title"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notif-body">Nội dung</Label>
              <Textarea
                id="notif-body"
                value={form.body}
                rows={4}
                onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label>Mức độ</Label>
              <Select
                value={form.level}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, level: v as NotificationLevel }))
                }
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                  <SelectItem value="info">Thông tin</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="warning">Cảnh báo</SelectItem>
                  <SelectItem value="error">Lỗi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phạm vi</Label>
              <Select
                value={form.scope}
                onValueChange={(v) =>
                  setForm((s) => ({ ...s, scope: v as "brand" | "global" }))
                }
                disabled={!allowGlobalScope}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                  <SelectItem value="brand">Theo thương hiệu</SelectItem>
                  {allowGlobalScope ? (
                    <SelectItem value="global">Toàn hệ thống</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-label">Nhãn CTA</Label>
              <Input
                id="cta-label"
                value={form.cta_label}
                onChange={(e) =>
                  setForm((s) => ({ ...s, cta_label: e.target.value }))
                }
                className="border-zinc-700 bg-zinc-950"
                placeholder="Ví dụ: Xem chi tiết"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-url">URL CTA</Label>
              <Input
                id="cta-url"
                value={form.cta_url}
                onChange={(e) => setForm((s) => ({ ...s, cta_url: e.target.value }))}
                className="border-zinc-700 bg-zinc-950"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="show-from">Hiển thị từ</Label>
              <Input
                id="show-from"
                type="datetime-local"
                value={form.show_from}
                onChange={(e) =>
                  setForm((s) => ({ ...s, show_from: e.target.value }))
                }
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="show-until">Hiển thị đến</Label>
              <Input
                id="show-until"
                type="datetime-local"
                value={form.show_until}
                onChange={(e) =>
                  setForm((s) => ({ ...s, show_until: e.target.value }))
                }
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                id="notif-active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((s) => ({ ...s, is_active: checked }))
                }
              />
              <Label htmlFor="notif-active">Bật thông báo sau khi lưu</Label>
            </div>
          </div>
          <DialogFooter className="border-zinc-800 bg-zinc-900/40">
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              onClick={() => void saveDialog()}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Tạo thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
