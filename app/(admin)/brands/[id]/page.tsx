import { notFound } from "next/navigation"

import { BrandDetailView } from "@/components/brands/BrandDetailView"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { devMockBrand, isAuthBypass } from "@/lib/dev-bypass"
import type { BrandRow } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireAuth()

  if (!isSuperAdmin(user) && user.brand_id !== id) {
    notFound()
  }

  if (isAuthBypass()) {
    return <BrandDetailView brand={devMockBrand(id)} user={user} />
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  return <BrandDetailView brand={data as BrandRow} user={user} />
}
