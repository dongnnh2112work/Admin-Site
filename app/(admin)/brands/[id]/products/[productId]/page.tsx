import { notFound } from "next/navigation"

import { ProductForm } from "@/components/products/ProductForm"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import {
  devMockBrand,
  devMockProduct,
  devMockProductAssets,
  isAuthBypass,
} from "@/lib/dev-bypass"
import type { ProductAssetRow, ProductCategoryRow, ProductRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>
}) {
  const { id: brandId, productId } = await params
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
        product={devMockProduct(brandId, productId)}
        initialAssets={devMockProductAssets()}
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

  const [{ data: product, error: pErr }, { data: categories, error: cErr }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("brand_id", brandId)
        .maybeSingle(),
      supabase
        .from("product_categories")
        .select("*")
        .eq("brand_id", brandId)
        .order("sort_order", { ascending: true }),
    ])

  if (pErr || !product) {
    notFound()
  }

  if (cErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh mục: {cErr.message}
      </div>
    )
  }

  const { data: assets } = await supabase
    .from("product_assets")
    .select("*")
    .eq("product_id", productId)
    .eq("brand_id", brandId)
    .order("sort_order", { ascending: true })

  return (
    <ProductForm
      brandId={brand.id}
      brandSlug={brand.slug}
      brandName={brand.name}
      categories={(categories ?? []) as ProductCategoryRow[]}
      product={product as ProductRow}
      initialAssets={(assets ?? []) as ProductAssetRow[]}
      user={user}
    />
  )
}
