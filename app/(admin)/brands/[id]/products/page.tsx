import { notFound } from "next/navigation"

import { ProductList } from "@/components/products/ProductList"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import {
  devMockBrand,
  devMockProducts,
  isAuthBypass,
} from "@/lib/dev-bypass"
import type { ProductCategoryRow, ProductRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function BrandProductsPage({
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
      <ProductList
        brandId={b.id}
        brandSlug={b.slug}
        brandName={b.name}
        initialProducts={devMockProducts(brandId)}
        categories={[]}
        readOnly={false}
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

  const [{ data: products, error: pErr }, { data: categories, error: cErr }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("brand_id", brandId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("product_categories")
        .select("*")
        .eq("brand_id", brandId)
        .order("sort_order", { ascending: true }),
    ])

  if (pErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được sản phẩm: {pErr.message}
      </div>
    )
  }

  if (cErr) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh mục: {cErr.message}
      </div>
    )
  }

  return (
    <ProductList
      brandId={brand.id}
      brandSlug={brand.slug}
      brandName={brand.name}
      initialProducts={(products ?? []) as ProductRow[]}
      categories={(categories ?? []) as ProductCategoryRow[]}
      readOnly={false}
    />
  )
}
