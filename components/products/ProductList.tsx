"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Plus, Upload } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import {
  expectedCsvHeaders,
  metadataFromKv,
  metadataToKv,
  parseProductsCsv,
  productsToCsv,
  type ProductCsvRow,
} from "@/lib/product-csv"
import type { ProductCategoryRow, ProductRow, ProductStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FilterPill = "all" | ProductStatus

const pills: { id: FilterPill; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Nháp" },
  { id: "active", label: "Đang hiển thị" },
  { id: "archived", label: "Lưu trữ" },
]

type SortKey = "updated_desc" | "created_desc" | "name_asc"

const sortLabels: { id: SortKey; label: string }[] = [
  { id: "updated_desc", label: "Cập nhật mới nhất" },
  { id: "created_desc", label: "Tạo mới nhất" },
  { id: "name_asc", label: "Tên A → Z" },
]

function statusLabel(s: ProductStatus): string {
  switch (s) {
    case "draft":
      return "Nháp"
    case "active":
      return "Đang hiển thị"
    case "archived":
      return "Lưu trữ"
    default:
      return s
  }
}

function statusBadgeClass(s: ProductStatus): string {
  switch (s) {
    case "draft":
      return "border-zinc-600 bg-zinc-800 text-zinc-300"
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    case "archived":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400"
    default:
      return ""
  }
}

function parseStatus(raw: string): ProductStatus {
  const t = raw.trim().toLowerCase()
  if (t === "draft" || t === "active" || t === "archived") return t
  return "draft"
}

function rowToCsv(
  p: ProductRow,
  categorySlug: string | null
): ProductCsvRow {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    is_featured: p.is_featured ? "true" : "false",
    sort_order: String(p.sort_order),
    short_desc: p.short_desc ?? "",
    description: p.description ?? "",
    category_slug: categorySlug ?? "",
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    image_url: p.image_url ?? "",
    thumbnail_url: p.thumbnail_url ?? "",
    metadata_kv: metadataToKv(p.metadata),
  }
}

export function ProductList({
  brandId,
  brandSlug,
  brandName,
  initialProducts,
  categories,
  readOnly,
}: {
  brandId: string
  brandSlug: string
  brandName: string
  initialProducts: ProductRow[]
  categories: ProductCategoryRow[]
  readOnly: boolean
}) {
  const router = useRouter()
  const importRef = React.useRef<HTMLInputElement>(null)
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterPill>("all")
  const [sort, setSort] = React.useState<SortKey>("updated_desc")
  const [banner, setBanner] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const [busy, setBusy] = React.useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const catById = React.useMemo(() => {
    const m = new Map<string, ProductCategoryRow>()
    for (const c of categories) m.set(c.id, c)
    return m
  }, [categories])

  const slugById = React.useCallback(
    (cid: string | null) => (cid ? catById.get(cid)?.slug ?? null : null),
    [catById]
  )

  const filtered = React.useMemo(() => {
    let list = [...initialProducts]
    if (filter !== "all") list = list.filter((p) => p.status === filter)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.short_desc?.toLowerCase().includes(q) ?? false)
      )
    }
    list.sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name, "vi")
      if (sort === "created_desc")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
    return list
  }, [initialProducts, filter, search, sort])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const someSelected = selected.size > 0

  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const p of filtered) next.delete(p.id)
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const p of filtered) next.add(p.id)
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function patchProduct(
    id: string,
    patch: Partial<ProductRow>
  ): Promise<boolean> {
    setBusy(id)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("brand_id", brandId)
      if (error) {
        setBanner(error.message || "Không cập nhật được.")
        return false
      }
      router.refresh()
      return true
    } finally {
      setBusy(null)
    }
  }

  async function bulkSetStatus(status: ProductStatus) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBusy("bulk")
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids)
        .eq("brand_id", brandId)
      if (error) {
        setBanner(error.message || "Không cập nhật hàng loạt.")
        return
      }
      setSelected(new Set())
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function confirmBulkDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBulkDeleting(true)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error: aErr } = await supabase
        .from("product_assets")
        .delete()
        .in("product_id", ids)
      if (aErr) {
        setBanner(aErr.message || "Không xóa được ảnh đính kèm.")
        throw new Error(aErr.message)
      }
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", ids)
        .eq("brand_id", brandId)
      if (error) {
        setBanner(error.message || "Không xóa được sản phẩm.")
        throw new Error(error.message)
      }
      setSelected(new Set())
      setDeleteOpen(false)
      router.refresh()
    } finally {
      setBulkDeleting(false)
    }
  }

  function exportCsv() {
    const rows = filtered.map((p) => rowToCsv(p, slugById(p.category_id)))
    const csv = productsToCsv(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `san-pham-${brandSlug}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setBanner(null)
    const text = await file.text()
    const parsed = parseProductsCsv(text)
    if (parsed.error) {
      setBanner(parsed.error)
      return
    }
    const supabase = createClient()
    const slugToCatId = new Map(categories.map((c) => [c.slug, c.id]))
    let ok = 0
    let err = 0
    for (const row of parsed.rows) {
      const name = (row.name ?? "").trim()
      const slug = (row.slug ?? "").trim()
      if (!name || !slug) {
        err++
        continue
      }
      const status = parseStatus(row.status ?? "draft")
      const isFeatured = String(row.is_featured).toLowerCase() === "true"
      const sortOrder = Number.parseInt(row.sort_order ?? "0", 10) || 0
      const catSlug = (row.category_slug ?? "").trim()
      const category_id = catSlug ? slugToCatId.get(catSlug) ?? null : null
      const metadata = metadataFromKv(row.metadata_kv ?? "") ?? {}
      const payload = {
        brand_id: brandId,
        name,
        slug,
        status,
        is_featured: isFeatured,
        sort_order: sortOrder,
        short_desc: (row.short_desc ?? "").trim() || null,
        description: (row.description ?? "").trim() || null,
        category_id,
        seo_title: (row.seo_title ?? "").trim() || null,
        seo_description: (row.seo_description ?? "").trim() || null,
        image_url: (row.image_url ?? "").trim() || null,
        thumbnail_url: (row.thumbnail_url ?? "").trim() || null,
        metadata,
        updated_at: new Date().toISOString(),
      }
      const id = (row.id ?? "").trim()
      try {
        if (id) {
          const { data: exists } = await supabase
            .from("products")
            .select("id")
            .eq("id", id)
            .eq("brand_id", brandId)
            .maybeSingle()
          if (exists) {
            const { error } = await supabase
              .from("products")
              .update(payload)
              .eq("id", id)
            if (error) err++
            else ok++
          } else {
            const { error } = await supabase.from("products").insert({
              ...payload,
              id,
              created_at: new Date().toISOString(),
            })
            if (error) err++
            else ok++
          }
        } else {
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("brand_id", brandId)
            .eq("slug", slug)
            .maybeSingle()
          if (existing) {
            const { error } = await supabase
              .from("products")
              .update(payload)
              .eq("id", existing.id)
            if (error) err++
            else ok++
          } else {
            const { error } = await supabase.from("products").insert({
              ...payload,
              created_at: new Date().toISOString(),
            })
            if (error) err++
            else ok++
          }
        }
      } catch {
        err++
      }
    }
    router.refresh()
    if (err > 0) {
      setBanner(
        `Nhập xong: ${ok} dòng thành công, ${err} dòng không hợp lệ. Kiểm tra slug trùng hoặc dữ liệu.`
      )
    } else {
      setBanner(`OK: Đã nhập ${ok} dòng từ CSV.`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sản phẩm"
        subtitle={`${brandName} — danh sách, xuất/nhập CSV và chỉnh nhanh trạng thái.`}
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Thương hiệu", href: ROUTES.brands },
          { label: brandName, href: ROUTES.brand(brandId) },
          { label: "Sản phẩm" },
        ]}
        actions={
          readOnly ? null : (
            <Button
              nativeButton={false}
              render={(p) => (
                <Link
                  {...p}
                  href={ROUTES.brandProductNew(brandId)}
                  className={cn(
                    p.className,
                    "inline-flex items-center gap-1.5 bg-[var(--hs-accent)] text-[var(--hs-black)] hover:bg-[var(--hs-accent)]/90"
                  )}
                >
                  <Plus className="size-4" />
                  Thêm sản phẩm
                </Link>
              )}
            />
          )
        }
      />

      {banner ? (
        <div
          role="alert"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            banner.startsWith("OK:")
              ? "border-zinc-600 bg-zinc-900/80 text-zinc-200"
              : "border-red-500/40 bg-red-950/40 text-red-200"
          )}
        >
          {banner.startsWith("OK:") ? banner.slice(3).trim() : banner}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder="Tìm theo tên, slug, mô tả ngắn…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md border-zinc-700 bg-zinc-950"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-[13px] text-zinc-100"
            aria-label="Sắp xếp"
          >
            {sortLabels.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-zinc-700"
          onClick={exportCsv}
        >
          <Download className="size-4" />
          Xuất CSV
        </Button>
        {!readOnly ? (
          <>
            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onImportFile}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-zinc-700"
              onClick={() => importRef.current?.click()}
            >
              <Upload className="size-4" />
              Nhập CSV
            </Button>
            <p className="text-xs text-zinc-500">
              Cột: {expectedCsvHeaders().join(", ")}. Metadata:{" "}
              <code className="text-zinc-400">key=value|key2=value2</code>
            </p>
          </>
        ) : null}
      </div>

      {someSelected && !readOnly ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
          <span className="text-sm text-zinc-300">
            Đã chọn {selected.size}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-zinc-600"
                  disabled={busy === "bulk"}
                >
                  Đặt trạng thái…
                </Button>
              }
            />
            <DropdownMenuContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800"
                onSelect={() => void bulkSetStatus("active")}
              >
                Đang hiển thị
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800"
                onSelect={() => void bulkSetStatus("draft")}
              >
                Nháp
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-zinc-800"
                onSelect={() => void bulkSetStatus("archived")}
              >
                Lưu trữ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy === "bulk"}
            onClick={() => setDeleteOpen(true)}
          >
            Xóa đã chọn
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Xóa ${selected.size} sản phẩm?`}
        description="Không thể hoàn tác. Ảnh đính kèm trong kho sẽ gỡ khỏi bản ghi (xóa file storage tùy cấu hình bucket)."
        confirmLabel="Xóa"
        onConfirm={() => void confirmBulkDelete()}
        isLoading={bulkDeleting}
      />

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {!readOnly ? (
                <TableHead className="w-10 text-zinc-400">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAllFiltered}
                    className="size-4 rounded border-zinc-600 bg-zinc-900 accent-[var(--hs-accent)]"
                    aria-label="Chọn tất cả trong danh sách lọc"
                  />
                </TableHead>
              ) : null}
              <TableHead className="text-zinc-400">Sản phẩm</TableHead>
              <TableHead className="text-zinc-400">Danh mục</TableHead>
              <TableHead className="text-zinc-400">Trạng thái</TableHead>
              <TableHead className="text-zinc-400">Nổi bật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell
                  colSpan={readOnly ? 4 : 5}
                  className="py-10 text-center text-sm text-zinc-500"
                >
                  Không có sản phẩm phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="border-zinc-800">
                  {!readOnly ? (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="size-4 rounded border-zinc-600 bg-zinc-900 accent-[var(--hs-accent)]"
                        aria-label={`Chọn ${p.name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Link
                      href={ROUTES.brandProduct(brandId, p.id)}
                      className="font-medium text-zinc-100 underline-offset-4 hover:text-[var(--hs-accent)] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-zinc-500">{p.slug}</p>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {p.category_id
                      ? catById.get(p.category_id)?.name ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusBadgeClass(p.status))}
                      >
                        {statusLabel(p.status)}
                      </Badge>
                    ) : (
                      <select
                        value={p.status}
                        disabled={busy === p.id}
                        onChange={(e) =>
                          void patchProduct(p.id, {
                            status: e.target.value as ProductStatus,
                          })
                        }
                        className="h-8 max-w-[140px] rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100"
                        aria-label={`Trạng thái ${p.name}`}
                      >
                        <option value="draft">Nháp</option>
                        <option value="active">Đang hiển thị</option>
                        <option value="archived">Lưu trữ</option>
                      </select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.is_featured}
                      disabled={readOnly || busy === p.id}
                      onCheckedChange={(next) =>
                        void patchProduct(p.id, { is_featured: next })
                      }
                      aria-label={`Nổi bật ${p.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Không có sản phẩm phù hợp.
          </p>
        ) : (
          filtered.map((p) => (
            <Card
              key={p.id}
              className="border-zinc-800 bg-zinc-900/60 text-zinc-50"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  {!readOnly ? (
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      className="mt-1 size-4 rounded border-zinc-600 bg-zinc-900 accent-[var(--hs-accent)]"
                      aria-label={`Chọn ${p.name}`}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.brandProduct(brandId, p.id)}
                      className="font-medium text-zinc-100 underline-offset-4 hover:text-[var(--hs-accent)] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-zinc-500">{p.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusBadgeClass(p.status))}
                  >
                    {statusLabel(p.status)}
                  </Badge>
                  {!readOnly ? (
                    <select
                      value={p.status}
                      disabled={busy === p.id}
                      onChange={(e) =>
                        void patchProduct(p.id, {
                          status: e.target.value as ProductStatus,
                        })
                      }
                      className="h-8 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
                    >
                      <option value="draft">Nháp</option>
                      <option value="active">Đang hiển thị</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Nổi bật</span>
                  <Switch
                    checked={p.is_featured}
                    disabled={readOnly || busy === p.id}
                    onCheckedChange={(next) =>
                      void patchProduct(p.id, { is_featured: next })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
