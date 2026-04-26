"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Copy, FolderTree, ImageUp, Loader2, Trash2, UploadCloud } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { STORAGE_BUCKET } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import type { BrandAssetRow, ProductAssetType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FolderNode = {
  id: ProductAssetType
  label: string
  storageSubPath: string
}

const FOLDERS: FolderNode[] = [
  { id: "logo", label: "Logo", storageSubPath: "logo" },
  { id: "banner", label: "Banner", storageSubPath: "banner" },
  { id: "background", label: "Background", storageSubPath: "background" },
  { id: "icon", label: "Icon", storageSubPath: "icon" },
  {
    id: "product_image",
    label: "Ảnh sản phẩm",
    storageSubPath: "products",
  },
]

const QUOTA_BYTES = 800 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, "_")
}

async function listFolderSize(prefix: string): Promise<number> {
  const supabase = createClient()

  async function listSum(path: string): Promise<number> {
    let page = 0
    let sum = 0
    while (true) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(path, { limit: 100, offset: page * 100, sortBy: { column: "name", order: "asc" } })
      if (error || !data || data.length === 0) break
      for (const item of data) {
        const anyItem = item as unknown as {
          name?: string
          id?: string
          metadata?: { size?: number } | null
        }
        const name = String(anyItem.name ?? "")
        if (!name || name === ".emptyFolderPlaceholder") continue
        const id = String(anyItem.id ?? "")
        const metadata = anyItem.metadata ?? null
        const size = typeof metadata?.size === "number" ? metadata.size : 0

        if (id && size >= 0) {
          sum += size
        } else {
          sum += await listSum(`${path}/${name}`)
        }
      }
      if (data.length < 100) break
      page += 1
    }
    return sum
  }

  return listSum(prefix)
}

export function MediaManager({
  brandId,
  brandName,
  brandSlug,
  initialAssets,
}: {
  brandId: string
  brandName: string
  brandSlug: string
  initialAssets: BrandAssetRow[]
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [folder, setFolder] = React.useState<ProductAssetType | "all">("all")
  const [uploadType, setUploadType] = React.useState<ProductAssetType>("logo")
  const [busy, setBusy] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<BrandAssetRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [banner, setBanner] = React.useState<string | null>(null)
  const [usageBytes, setUsageBytes] = React.useState<number | null>(null)

  const filteredAssets = React.useMemo(() => {
    let list = [...initialAssets]
    if (folder !== "all") list = list.filter((a) => a.asset_type === folder)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          a.url.toLowerCase().includes(q) ||
          (a.label ?? "").toLowerCase().includes(q) ||
          a.asset_type.toLowerCase().includes(q)
      )
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [folder, initialAssets, query])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const size = await listFolderSize(`brands/${brandSlug}`)
        if (!cancelled) setUsageBytes(size)
      } catch {
        if (!cancelled) setUsageBytes(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brandSlug, initialAssets.length])

  async function refreshAndNotice(msg: string) {
    setBanner(msg)
    router.refresh()
  }

  async function handleUpload(files: File[]) {
    if (files.length === 0) return
    setBusy(true)
    setBanner(null)
    const supabase = createClient()
    const folderCfg = FOLDERS.find((f) => f.id === uploadType)
    const subPath = folderCfg?.storageSubPath ?? "uploads"

    let ok = 0
    let fail = 0
    let firstErr: string | null = null

    for (const file of files) {
      const path = `brands/${brandSlug}/${subPath}/${Date.now()}-${safeFilename(file.name)}`
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true })
      if (upErr) {
        fail++
        if (!firstErr) firstErr = upErr.message
        continue
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      const { error: insErr } = await supabase.from("brand_assets").insert({
        brand_id: brandId,
        asset_type: uploadType,
        url: data.publicUrl,
        storage_path: path,
        label: file.name,
        is_active: true,
      })
      if (insErr) {
        fail++
        if (!firstErr) firstErr = insErr.message
      } else {
        ok++
      }
    }

    setBusy(false)
    if (fail > 0) {
      await refreshAndNotice(
        `Đã tải ${ok} tệp, ${fail} tệp lỗi.${firstErr ? ` Lỗi đầu tiên: ${firstErr}` : ""}`
      )
    } else {
      await refreshAndNotice(`Đã tải lên ${ok} tệp.`)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    multiple: true,
    disabled: busy,
    onDrop: (accepted) => {
      void handleUpload(accepted)
    },
  })

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setBanner("Đã copy URL vào clipboard.")
    } catch {
      setBanner("Không copy được URL. Hãy copy thủ công.")
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setBanner(null)
    try {
      const supabase = createClient()
      if (deleteTarget.storage_path) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([deleteTarget.storage_path])
      }
      const { error } = await supabase
        .from("brand_assets")
        .delete()
        .eq("id", deleteTarget.id)
      if (error) {
        setBanner(error.message || "Không xóa được tệp.")
        throw new Error(error.message)
      }
      setDeleteTarget(null)
      await refreshAndNotice("Đã xóa tệp.")
    } finally {
      setDeleting(false)
    }
  }

  const usagePct = clampPct(((usageBytes ?? 0) / QUOTA_BYTES) * 100)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Media Manager"
        subtitle={`${brandName} — quản lý file ảnh, upload nhanh và sao chép URL.`}
      />

      {banner ? (
        <div
          role="alert"
          className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200"
        >
          {banner}
        </div>
      ) : null}

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-200">Dung lượng lưu trữ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Đã dùng: {usageBytes == null ? "Đang tính..." : formatBytes(usageBytes)}
            </span>
            <span>Hạn mức tham chiếu: {formatBytes(QUOTA_BYTES)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                usagePct >= 80 ? "bg-amber-400" : "bg-[var(--hs-accent)]"
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">{usagePct.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
              <FolderTree className="size-4" />
              Thư mục
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              type="button"
              variant={folder === "all" ? "default" : "ghost"}
              className={cn(
                "h-9 w-full justify-start",
                folder === "all"
                  ? "bg-[var(--hs-accent)] text-[var(--hs-black)] hover:bg-[var(--hs-accent)]/90"
                  : "text-zinc-300 hover:bg-zinc-800"
              )}
              onClick={() => setFolder("all")}
            >
              Tất cả
            </Button>
            {FOLDERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant={folder === f.id ? "default" : "ghost"}
                className={cn(
                  "h-9 w-full justify-start",
                  folder === f.id
                    ? "bg-[var(--hs-accent)] text-[var(--hs-black)] hover:bg-[var(--hs-accent)]/90"
                    : "text-zinc-300 hover:bg-zinc-800"
                )}
                onClick={() => {
                  setFolder(f.id)
                  setUploadType(f.id)
                }}
              >
                {f.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-50">
            <CardContent className="space-y-3 pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1 space-y-1">
                  <Label htmlFor="assets-search">Tìm kiếm tệp</Label>
                  <Input
                    id="assets-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Theo label, URL hoặc loại asset..."
                    className="border-zinc-700 bg-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Loại upload</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button type="button" variant="outline" className="border-zinc-700">
                          <ImageUp className="size-4" />
                          {FOLDERS.find((f) => f.id === uploadType)?.label ?? "Chọn"}
                        </Button>
                      }
                    />
                    <DropdownMenuContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                      <DropdownMenuRadioGroup
                        value={uploadType}
                        onValueChange={(v) => setUploadType(v as ProductAssetType)}
                      >
                        {FOLDERS.map((f) => (
                          <DropdownMenuRadioItem key={f.id} value={f.id}>
                            {f.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                  busy
                    ? "cursor-not-allowed border-zinc-700 bg-zinc-900/40"
                    : isDragActive
                      ? "cursor-copy border-[var(--hs-accent)] bg-[var(--hs-accent)]/10"
                      : "cursor-pointer border-zinc-700 bg-zinc-950/60 hover:border-zinc-500"
                )}
              >
                <input {...getInputProps()} />
                {busy ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
                    <Loader2 className="size-4 animate-spin" />
                    Đang upload...
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-200">
                      Kéo thả ảnh vào đây hoặc bấm để chọn file
                    </p>
                    <p className="text-xs text-zinc-500">
                      Hỗ trợ ảnh PNG, JPG, WEBP, GIF. Sẽ lưu vào bucket {STORAGE_BUCKET}.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={UploadCloud}
              title="Chưa có tệp"
              description="Upload ảnh đầu tiên cho thương hiệu này để lấy URL dùng ở các trang khác."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="group border-zinc-800 bg-zinc-900/60 text-zinc-50"
                >
                  <CardContent className="space-y-2 pt-4">
                    <div className="relative overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.label ?? "asset"}
                        className="aspect-video w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/65 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-zinc-500 bg-zinc-900/70"
                          onClick={() => void handleCopy(asset.url)}
                        >
                          <Copy className="size-4" />
                          Copy URL
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(asset)}
                        >
                          <Trash2 className="size-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-100">
                        {asset.label || "(không có label)"}
                      </p>
                      <p className="line-clamp-1 text-xs text-zinc-500">{asset.asset_type}</p>
                      <p className="line-clamp-1 text-xs text-zinc-500">{asset.url}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
        title="Xóa tệp này?"
        description="Hành động này không thể hoàn tác. URL đang dùng ở nơi khác có thể bị hỏng."
        confirmLabel="Xóa tệp"
        onConfirm={() => void confirmDelete()}
        isLoading={deleting}
      />
    </div>
  )
}
