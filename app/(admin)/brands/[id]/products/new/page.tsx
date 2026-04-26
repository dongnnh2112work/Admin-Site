import { notFound } from "next/navigation"

import { ProductForm } from "@/components/products/ProductForm"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { devMockBrand, isAuthBypass } from "@/lib/dev-bypass"
import type { ProductCategoryRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function NewProductPage({
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
      <ProductForm
        brandId={b.id}
        brandSlug={b.slug}
        brandName={b.name}
        categories={[]}
        product={null}
        initialAssets={[]}
        user={user}
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

  const { data: categories, error: cErr } = await supabase
    .from("product_categories")
    .select("*")
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true })

  if (cErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh mục: {cErr.message}
      </div>
    )
  }

  return (
    <ProductForm
      brandId={brand.id}
      brandSlug={brand.slug}
      brandName={brand.name}
      categories={(categories ?? []) as ProductCategoryRow[]}
      product={null}
      initialAssets={[]}
      user={user}
    />
  )
}
