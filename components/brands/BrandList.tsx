"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Copy, Trash2, Package } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import type { BrandRow } from "@/lib/types"
import type { BrandUserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

type FilterPill = "all" | "active" | "inactive"

const pills: { id: FilterPill; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "active", label: "Đang hoạt động" },
  { id: "inactive", label: "Đã tắt" },
]

export function BrandList({
  initialBrands,
  userRole,
}: {
  initialBrands: BrandRow[]
  userRole: BrandUserRole
}) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterPill>("all")
  const [banner, setBanner] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<BrandRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [duplicatingId, setDuplicatingId] = React.useState<string | null>(null)

  const superAdmin = userRole === "super_admin"
  const brandEditor = userRole === "brand_editor"

  const filtered = React.useMemo(() => {
    let list = [...initialBrands]
    if (filter === "active") list = list.filter((b) => b.is_active)
    if (filter === "inactive") list = list.filter((b) => !b.is_active)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
      )
    }
    return list
  }, [initialBrands, filter, search])

  async function handleDuplicate(source: BrandRow) {
    setBanner(null)
    setDuplicatingId(source.id)
    try {
      const supabase = createClient()
      const newSlug = `${source.slug}-sao-${Date.now()}`
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = source
      void _id
      void _c
      void _u
      const { error: insErr } = await supabase.from("brands").insert({
        ...rest,
        name: `${source.name} (bản sao)`,
        slug: newSlug,
      })
      if (insErr) {
        setBanner(insErr.message || "Nhân bản thất bại.")
        return
      }
      router.refresh()
    } finally {
      setDuplicatingId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) {
        setBanner(error.message || "Không xóa được thương hiệu.")
        return
      }
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thương hiệu"
        subtitle="Quản lý brand và cấu hình hiển thị sự kiện."
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Thương hiệu" },
        ]}
      />

      {banner ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
        >
          {banner}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Tìm theo tên hoặc slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md border-zinc-700 bg-zinc-950"
        />
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={filter === p.id ? "default" : "outline"}
              className={cn(
                filter === p.id
                  ? "bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
                  : "border-zinc-700"
              )}
              onClick={() => setFilter(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Thương hiệu</TableHead>
              <TableHead className="text-zinc-400">Slug</TableHead>
              <TableHead className="text-zinc-400">Trạng thái</TableHead>
              <TableHead className="w-12 text-right text-zinc-400">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={4} className="text-center text-zinc-500">
                  Không có thương hiệu phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="border-zinc-800">
                  <TableCell>
                    <Link
                      href={ROUTES.brand(b.id)}
                      className="flex items-center gap-2 font-medium text-zinc-100 hover:text-[#E8FF47]"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full ring-1 ring-zinc-600"
                        style={{
                          backgroundColor: b.primary_color ?? "#52525b",
                        }}
                        aria-hidden
                      />
                      {b.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {b.slug}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        b.is_active
                          ? "border-emerald-500/40 text-emerald-400"
                          : "border-zinc-600 text-zinc-500"
                      )}
                    >
                      {b.is_active ? "Hoạt động" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-zinc-400"
                            aria-label="Thao tác"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        className="border-zinc-700 bg-zinc-900 text-zinc-50"
                      >
                        {!brandEditor ? (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 focus:bg-zinc-800"
                            onClick={() => router.push(ROUTES.brand(b.id))}
                          >
                            <Pencil className="size-4" />
                            Sửa
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 focus:bg-zinc-800"
                          onClick={() => router.push(ROUTES.brandProducts(b.id))}
                        >
                          <Package className="size-4" />
                          Sản phẩm
                        </DropdownMenuItem>
                        {brandEditor ? (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 focus:bg-zinc-800"
                            onClick={() => router.push(ROUTES.brand(b.id))}
                          >
                            <Pencil className="size-4" />
                            Xem cấu hình
                          </DropdownMenuItem>
                        ) : null}
                        {superAdmin ? (
                          <>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 focus:bg-zinc-800"
                              disabled={duplicatingId === b.id}
                              onClick={() => void handleDuplicate(b)}
                            >
                              <Copy className="size-4" />
                              {duplicatingId === b.id
                                ? "Đang nhân bản…"
                                : "Nhân bản"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-red-400 focus:bg-red-950/40 focus:text-red-300"
                              onClick={() => setDeleteTarget(b)}
                            >
                              <Trash2 className="size-4" />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Không có thương hiệu phù hợp.
          </p>
        ) : (
          filtered.map((b) => (
            <Card key={b.id} className="border-zinc-800 bg-zinc-900/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={ROUTES.brand(b.id)}
                    className="flex min-w-0 items-center gap-2 font-medium text-zinc-100"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full ring-1 ring-zinc-600"
                      style={{
                        backgroundColor: b.primary_color ?? "#52525b",
                      }}
                    />
                    <span className="truncate">{b.name}</span>
                  </Link>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0",
                      b.is_active
                        ? "border-emerald-500/40 text-emerald-400"
                        : "border-zinc-600 text-zinc-500"
                    )}
                  >
                    {b.is_active ? "Hoạt động" : "Đã tắt"}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-zinc-500">{b.slug}</p>
                <div className="flex flex-wrap gap-2">
                  {!brandEditor ? (
                    <Link
                      href={ROUTES.brand(b.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-zinc-700"
                      )}
                    >
                      Sửa
                    </Link>
                  ) : null}
                  <Link
                    href={ROUTES.brandProducts(b.id)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-zinc-700"
                    )}
                  >
                    Sản phẩm
                  </Link>
                  {brandEditor ? (
                    <Link
                      href={ROUTES.brand(b.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-zinc-700"
                      )}
                    >
                      Xem
                    </Link>
                  ) : null}
                  {superAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        disabled={duplicatingId === b.id}
                        onClick={() => void handleDuplicate(b)}
                      >
                        Nhân bản
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(b)}
                      >
                        Xóa
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={
          deleteTarget
            ? `Xóa thương hiệu “${deleteTarget.name}”?`
            : "Xóa thương hiệu?"
        }
        description="Hành động này không thể hoàn tác. Dữ liệu liên quan có thể bị ảnh hưởng theo cấu hình cơ sở dữ liệu."
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={() => confirmDelete()}
        isLoading={deleting}
      />
    </div>
  )
}
