import { notFound } from "next/navigation"

import { MediaManager } from "@/components/media/MediaManager"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { devMockBrand, isAuthBypass } from "@/lib/dev-bypass"
import type { BrandAssetRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function BrandAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: brandId } = await params
  const user = await requireAuth()

  if (!isSuperAdmin(user) && user.brand_id !== brandId) {
    notFound()
  }

  if (isAuthBypass()) {
    const b = devMockBrand(brandId)
    return (
      <MediaManager
        brandId={b.id}
        brandName={b.name}
        brandSlug={b.slug}
        initialAssets={[]}
      />
    )
  }

  const supabase = await createClient()
  const { data: brand, error: bErr } = await supabase
    .from("brands")
    .select("id,name,slug")
    .eq("id", brandId)
    .maybeSingle()

  if (bErr || !brand) {
    notFound()
  }

  const { data: assets, error: aErr } = await supabase
    .from("brand_assets")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })

  if (aErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được tài nguyên media: {aErr.message}
      </div>
    )
  }

  return (
    <MediaManager
      brandId={brand.id}
      brandName={brand.name}
      brandSlug={brand.slug}
      initialAssets={(assets ?? []) as BrandAssetRow[]}
    />
  )
}
