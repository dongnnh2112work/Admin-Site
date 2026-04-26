"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { STORAGE_BUCKET } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import type {
  AppUser,
  ProductAssetRow,
  ProductCategoryRow,
  ProductRow,
  ProductStatus,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared/PageHeader"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MetaRow = { uid: string; key: string; value: string }

function newMetaRow(): MetaRow {
  return { uid: crypto.randomUUID(), key: "", value: "" }
}

function rowsFromMetadata(m: Record<string, unknown>): MetaRow[] {
  if (!m || Object.keys(m).length === 0) return [newMetaRow()]
  return Object.entries(m).map(([key, value]) => ({
    uid: crypto.randomUUID(),
    key,
    value:
      value === null || value === undefined
        ? ""
        : typeof value === "string"
          ? value
          : JSON.stringify(value),
  }))
}

function metadataFromRows(rows: MetaRow[]): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  for (const r of rows) {
    const k = r.key.trim()
    if (!k) continue
    const v = r.value.trim()
    if (!v) continue
    try {
      if (
        (v.startsWith("{") && v.endsWith("}")) ||
        (v.startsWith("[") && v.endsWith("]"))
      ) {
        o[k] = JSON.parse(v) as unknown
      } else if (v === "true") {
        o[k] = true
      } else if (v === "false") {
        o[k] = false
      } else {
        const n = Number(v)
        if (v !== "" && Number.isFinite(n) && String(n) === v) o[k] = n
        else o[k] = v
      }
    } catch {
      o[k] = v
    }
  }
  return o
}

function slugifyHint(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "san-pham"
  )
}

export function ProductForm({
  brandId,
  brandSlug,
  brandName,
  categories,
  product,
  initialAssets,
  user: _user,
}: {
  brandId: string
  brandSlug: string
  brandName: string
  categories: ProductCategoryRow[]
  product: ProductRow | null
  initialAssets: ProductAssetRow[]
  user: AppUser
}) {
  void _user
  const router = useRouter()
  const isNew = product === null
  const productId = product?.id ?? null

  const [banner, setBanner] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState<"draft" | "publish" | null>(null)
  const [uploading, setUploading] = React.useState<string | null>(null)
  const [assetDelete, setAssetDelete] = React.useState<ProductAssetRow | null>(
    null
  )
  const [deletingAsset, setDeletingAsset] = React.useState(false)

  const [name, setName] = React.useState(product?.name ?? "")
  const [slug, setSlug] = React.useState(product?.slug ?? "")
  const [categoryId, setCategoryId] = React.useState<string | null>(
    product?.category_id ?? null
  )
  const [shortDesc, setShortDesc] = React.useState(product?.short_desc ?? "")
  const [description, setDescription] = React.useState(
    product?.description ?? ""
  )
  const [sortOrder, setSortOrder] = React.useState(
    String(product?.sort_order ?? 0)
  )
  const [seoTitle, setSeoTitle] = React.useState(product?.seo_title ?? "")
  const [seoDescription, setSeoDescription] = React.useState(
    product?.seo_description ?? ""
  )
  const [imageUrl, setImageUrl] = React.useState(product?.image_url ?? "")
  const [thumbnailUrl, setThumbnailUrl] = React.useState(
    product?.thumbnail_url ?? ""
  )
  const [metaRows, setMetaRows] = React.useState<MetaRow[]>(() =>
    rowsFromMetadata(product?.metadata ?? {})
  )

  function addMetaRow() {
    setMetaRows((r) => [...r, newMetaRow()])
  }

  function updateMetaRow(uid: string, patch: Partial<MetaRow>) {
    setMetaRows((rows) =>
      rows.map((r) => (r.uid === uid ? { ...r, ...patch } : r))
    )
  }

  function removeMetaRow(uid: string) {
    setMetaRows((rows) => {
      const next = rows.filter((r) => r.uid !== uid)
      return next.length ? next : [newMetaRow()]
    })
  }

  async function uploadToStorage(
    file: File,
    folder: "main" | "gallery"
  ): Promise<{ url: string; path: string } | null> {
    if (!productId) {
      setBanner("Lưu nháp sản phẩm trước, sau đó mới tải ảnh lên.")
      return null
    }
    const safeBrand =
      brandSlug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "brand"
    const sub = folder === "main" ? "main" : `gallery-${Date.now()}`
    const path = `brands/${safeBrand}/products/${productId}/${sub}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`
    const supabase = createClient()
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true })
    if (error) {
      setBanner(error.message)
      return null
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, path }
  }

  async function onMainFile(file: File) {
    setUploading("main")
    setBanner(null)
    try {
      const up = await uploadToStorage(file, "main")
      if (!up) return
      setImageUrl(up.url)
      const thumb = thumbnailUrl.trim() || up.url
      setThumbnailUrl((t) => t || up.url)
      const supabase = createClient()
      const { error } = await supabase
        .from("products")
        .update({
          image_url: up.url,
          thumbnail_url: thumb,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId!)
        .eq("brand_id", brandId)
      if (error) setBanner(error.message)
      else router.refresh()
    } finally {
      setUploading(null)
    }
  }

  async function onGalleryFile(file: File) {
    if (!productId) return
    setUploading("gallery")
    setBanner(null)
    try {
      const up = await uploadToStorage(file, "gallery")
      if (!up) return
      const supabase = createClient()
      const nextOrder =
        initialAssets.reduce((m, a) => Math.max(m, a.sort_order), 0) + 1
      const { error } = await supabase.from("product_assets").insert({
        product_id: productId,
        brand_id: brandId,
        asset_type: "product_image",
        url: up.url,
        storage_path: up.path,
        alt_text: null,
        sort_order: nextOrder,
      })
      if (error) {
        setBanner(error.message)
        return
      }
      router.refresh()
    } finally {
      setUploading(null)
    }
  }

  async function confirmDeleteAsset() {
    if (!assetDelete) return
    setDeletingAsset(true)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("product_assets")
        .delete()
        .eq("id", assetDelete.id)
      if (error) {
        setBanner(error.message)
        throw new Error(error.message)
      }
      setAssetDelete(null)
      router.refresh()
    } finally {
      setDeletingAsset(false)
    }
  }

  function buildPayload(status: ProductStatus) {
    const so = Number.parseInt(sortOrder, 10)
    return {
      brand_id: brandId,
      name: name.trim(),
      slug: slug.trim() || slugifyHint(name),
      category_id: categoryId,
      short_desc: shortDesc.trim() || null,
      description: description.trim() || null,
      status,
      sort_order: Number.isFinite(so) ? so : 0,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      image_url: imageUrl.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      metadata: (() => {
        const m = metadataFromRows(metaRows)
        return Object.keys(m).length ? m : {}
      })(),
      updated_at: new Date().toISOString(),
    }
  }

  async function save(status: ProductStatus, mode: "draft" | "publish") {
    if (!name.trim()) {
      setBanner("Vui lòng nhập tên sản phẩm.")
      return
    }
    const payload = buildPayload(status)
    setSaving(mode)
    setBanner(null)
    try {
      const supabase = createClient()
      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert({
            ...payload,
            is_featured: false,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single()
        if (error) {
          setBanner(error.message || "Không tạo được sản phẩm.")
          return
        }
        router.replace(ROUTES.brandProduct(brandId, data.id))
        router.refresh()
        return
      }
      const { error } = await supabase
        .from("products")
        .update({
          ...payload,
          is_featured: product!.is_featured,
        })
        .eq("id", product!.id)
        .eq("brand_id", brandId)
      if (error) {
        setBanner(error.message || "Không lưu được.")
        return
      }
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  const crumbProduct = isNew ? "Mới" : product!.name

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isNew ? "Thêm sản phẩm" : "Sửa sản phẩm"}
        subtitle={brandName}
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Thương hiệu", href: ROUTES.brands },
          { label: brandName, href: ROUTES.brand(brandId) },
          { label: "Sản phẩm", href: ROUTES.brandProducts(brandId) },
          { label: crumbProduct },
        ]}
        actions={
          <Button
            nativeButton={false}
            variant="outline"
            className="border-zinc-600"
            render={(p) => (
              <Link {...p} href={ROUTES.brandProducts(brandId)}>
                ← Danh sách
              </Link>
            )}
          />
        }
      />

      {banner ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
        >
          {banner}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Tên sản phẩm</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (isNew && !slug.trim()) setSlug(slugifyHint(name))
              }}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-slug">Slug (URL)</Label>
            <Input
              id="p-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Select
              value={categoryId ?? "__none__"}
              onValueChange={(v) =>
                setCategoryId(v === "__none__" ? null : v)
              }
            >
              <SelectTrigger className="border-zinc-700 bg-zinc-950">
                <SelectValue placeholder="Không chọn" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                <SelectItem value="__none__">— Không —</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-short">Mô tả ngắn</Label>
            <Textarea
              id="p-short"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={2}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Mô tả đầy đủ</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-sort">Thứ tự hiển thị</Label>
            <Input
              id="p-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="max-w-[120px] border-zinc-700 bg-zinc-950"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-seo-title">SEO — tiêu đề</Label>
            <Input
              id="p-seo-title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-seo-desc">SEO — mô tả</Label>
            <Textarea
              id="p-seo-desc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-img">Ảnh chính — URL</Label>
            <Input
              id="p-img"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
            <input
              type="file"
              accept="image/*"
              disabled={uploading !== null || isNew}
              className="text-sm text-zinc-400 file:mr-2 file:rounded-md file:border file:border-zinc-600 file:bg-zinc-800 file:px-2 file:py-1 file:text-zinc-200"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onMainFile(f)
                e.target.value = ""
              }}
            />
            {isNew ? (
              <p className="text-xs text-zinc-500">
                Lưu nháp một lần để bật tải ảnh lên kho.
              </p>
            ) : null}
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="mt-2 max-h-40 rounded border border-zinc-700 object-contain"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-thumb">Ảnh thumbnail — URL</Label>
            <Input
              id="p-thumb"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-base">Thuộc tính bổ sung</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-zinc-600"
            onClick={addMetaRow}
          >
            <Plus className="size-4" />
            Thêm dòng
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          Cặp khóa — giá trị (ví dụ SKU, mã nội bộ). Không hiển thị JSON thô.
        </p>
        <div className="space-y-2">
          {metaRows.map((row) => (
            <div
              key={row.uid}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1">
                <span className="text-xs text-zinc-500">Khóa</span>
                <Input
                  value={row.key}
                  onChange={(e) =>
                    updateMetaRow(row.uid, { key: e.target.value })
                  }
                  placeholder="sku"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="flex-[2] space-y-1">
                <span className="text-xs text-zinc-500">Giá trị</span>
                <Input
                  value={row.value}
                  onChange={(e) =>
                    updateMetaRow(row.uid, { value: e.target.value })
                  }
                  placeholder="ABC-123"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 text-zinc-400 hover:text-red-400"
                aria-label="Xóa dòng"
                onClick={() => removeMetaRow(row.uid)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base">Ảnh bổ sung</Label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading !== null || isNew}
          className="text-sm text-zinc-400 file:mr-2 file:rounded-md file:border file:border-zinc-600 file:bg-zinc-800 file:px-2 file:py-1 file:text-zinc-200"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onGalleryFile(f)
            e.target.value = ""
          }}
        />
        {initialAssets.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có ảnh phụ.</p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {initialAssets.map((a) => (
              <li
                key={a.id}
                className="relative w-24 shrink-0 overflow-hidden rounded border border-zinc-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.alt_text ?? ""}
                  className="aspect-square object-cover"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  className="absolute right-1 bottom-1 h-6 px-1 text-[10px]"
                  onClick={() => setAssetDelete(a)}
                >
                  Xóa
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {uploading ? (
        <p className="text-sm text-zinc-400">Đang tải lên ({uploading})…</p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          className="bg-zinc-200 text-zinc-950 hover:bg-zinc-300"
          disabled={saving !== null}
          onClick={() => void save("draft", "draft")}
        >
          {saving === "draft" ? "Đang lưu…" : "Lưu nháp"}
        </Button>
        <Button
          type="button"
          className="bg-[var(--hs-accent)] text-[var(--hs-black)] hover:bg-[var(--hs-accent)]/90"
          disabled={saving !== null}
          onClick={() => void save("active", "publish")}
        >
          {saving === "publish" ? "Đang lưu…" : "Lưu & đăng"}
        </Button>
      </div>

      <ConfirmDialog
        open={assetDelete !== null}
        onOpenChange={(o) => !o && setAssetDelete(null)}
        title="Xóa ảnh này?"
        description="Ảnh sẽ gỡ khỏi sản phẩm. File trên kho có thể cần dọn tay."
        confirmLabel="Xóa ảnh"
        onConfirm={() => void confirmDeleteAsset()}
        isLoading={deletingAsset}
      />
    </div>
  )
}
