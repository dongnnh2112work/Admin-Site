import { BrandList } from "@/components/brands/BrandList"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { isAuthBypass } from "@/lib/dev-bypass"
import type { BrandRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function BrandsPage() {
  const user = await requireAuth()

  if (isAuthBypass()) {
    return <BrandList initialBrands={[]} userRole={user.role} />
  }

  const supabase = await createClient()

  let q = supabase
    .from("brands")
    .select("*")
    .order("updated_at", { ascending: false })

  if (!isSuperAdmin(user) && user.brand_id) {
    q = q.eq("id", user.brand_id)
  }

  const { data, error } = await q

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
        Không tải được danh sách thương hiệu: {error.message}
      </div>
    )
  }

  const brands = (data ?? []) as BrandRow[]

  return <BrandList initialBrands={brands} userRole={user.role} />
}
